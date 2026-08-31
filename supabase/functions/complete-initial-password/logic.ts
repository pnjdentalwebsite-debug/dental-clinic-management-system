import { requestJson, response } from "../_shared/http.ts";

type InitialPasswordContext = {
  userClaims?: { id?: unknown } | null;
  // The server package does not export its wrapped Admin client context type.
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any;
};

type FirstLoginMembership = {
  id: string;
  subscriber_id: string;
  user_id: string;
  role: "clinic_owner" | "associate";
  account_status: "active";
  must_change_password: boolean;
  password_changed_at: string | null;
};

export class InitialPasswordApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function initialPasswordErrorResponse(
  request: Request,
  error: unknown,
): Response {
  if (error instanceof InitialPasswordApiError) {
    return response(request, {
      error: { code: error.code, message: error.message },
    }, error.status);
  }
  return response(request, {
    error: {
      code: "INTERNAL_ERROR",
      message: "Unable to complete the initial password change.",
    },
  }, 500);
}

export function passwordRequestOnly(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload);
  if (
    keys.length !== 1 || keys[0] !== "newPassword" ||
    typeof payload.newPassword !== "string"
  ) {
    throw new InitialPasswordApiError(
      "INVALID_REQUEST",
      422,
      "Only newPassword may be supplied.",
    );
  }
  return payload.newPassword;
}

export function validateNewPassword(password: string): void {
  if (!password || password.trim().length === 0 || password.length > 256) {
    throw new InitialPasswordApiError(
      "INVALID_PASSWORD",
      422,
      "Choose a valid password of at most 256 characters.",
    );
  }
  if (password.length < 12) {
    throw new InitialPasswordApiError(
      "INVALID_PASSWORD",
      422,
      "Choose a password with at least 12 characters.",
    );
  }
  if (!/\p{L}/u.test(password)) {
    throw new InitialPasswordApiError(
      "INVALID_PASSWORD",
      422,
      "Choose a password containing at least one letter.",
    );
  }
  if (!/\p{N}/u.test(password)) {
    throw new InitialPasswordApiError(
      "INVALID_PASSWORD",
      422,
      "Choose a password containing at least one digit.",
    );
  }
}

export function accessTokenFromRequest(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!match?.[1]) {
    throw new InitialPasswordApiError(
      "UNAUTHORIZED",
      401,
      "Authentication is required.",
    );
  }
  return match[1];
}

async function safeFailureAudit(
  // deno-lint-ignore no-explicit-any
  admin: any,
  membership: FirstLoginMembership,
  userId: string,
  eventType: string,
  failureCode: string,
): Promise<void> {
  try {
    await admin.from("audit_events").insert({
      actor_user_id: userId,
      subscriber_id: membership.subscriber_id,
      event_type: eventType,
      entity_type: "subscriber_membership",
      entity_id: membership.id,
      metadata: { failure_code: failureCode },
    });
  } catch {
    // The typed API response and unchanged authoritative membership flag remain
    // the repair signal if the database is unavailable to record this event.
  }
}

export async function handleInitialPasswordCompletion(
  request: Request,
  ctx: InitialPasswordContext,
): Promise<Response> {
  try {
    const userId = typeof ctx.userClaims?.id === "string"
      ? ctx.userClaims.id
      : null;
    if (!userId) {
      throw new InitialPasswordApiError(
        "UNAUTHORIZED",
        401,
        "Authentication is required.",
      );
    }
    const accessToken = accessTokenFromRequest(request);

    let payload: Record<string, unknown>;
    try {
      payload = await requestJson(request);
    } catch {
      throw new InitialPasswordApiError(
        "INVALID_REQUEST",
        422,
        "A valid JSON request body is required.",
      );
    }
    const newPassword = passwordRequestOnly(payload);
    // deno-lint-ignore no-explicit-any
    const admin = ctx.supabaseAdmin as any;

    const { data: memberships, error: membershipError } = await admin
      .from("subscriber_memberships")
      .select(
        "id, subscriber_id, user_id, role, account_status, must_change_password, password_changed_at",
      )
      .eq("user_id", userId)
      .in("role", ["clinic_owner", "associate"])
      .eq("account_status", "active")
      .limit(2);
    if (membershipError || !Array.isArray(memberships)) {
      throw new InitialPasswordApiError(
        "MEMBERSHIP_STATE_UNAVAILABLE",
        503,
        "Clinic Owner membership state is temporarily unavailable.",
      );
    }
    if (memberships.length === 0) {
      throw new InitialPasswordApiError(
        "NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP",
        403,
        "An active Clinic Owner membership is required.",
      );
    }
    if (memberships.length > 1) {
      throw new InitialPasswordApiError(
        "MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS",
        409,
        "Multiple active Clinic Owner memberships require administrative review.",
      );
    }

    const membership = memberships[0] as FirstLoginMembership;
    if (!membership.must_change_password) {
      throw new InitialPasswordApiError(
        "INITIAL_PASSWORD_ALREADY_COMPLETED",
        409,
        "Initial password setup has already been completed.",
      );
    }
    validateNewPassword(newPassword);

    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (authError) {
      throw new InitialPasswordApiError(
        "AUTH_PASSWORD_UPDATE_FAILED",
        503,
        "The Auth password could not be updated.",
      );
    }

    const passwordChangedAt = new Date().toISOString();
    const { data: finalizedMembership, error: finalizationError } = await admin
      .from("subscriber_memberships")
      .update({
        must_change_password: false,
        password_changed_at: passwordChangedAt,
      })
      .eq("id", membership.id)
      .eq("user_id", userId)
      .in("role", ["clinic_owner", "associate"])
      .eq("account_status", "active")
      .eq("must_change_password", true)
      .select("id, subscriber_id, must_change_password, password_changed_at")
      .maybeSingle();
    if (finalizationError || !finalizedMembership) {
      await safeFailureAudit(
        admin,
        membership,
        userId,
        "account.initial_password.state_finalization_required",
        "PASSWORD_UPDATED_STATE_FINALIZATION_REQUIRED",
      );
      throw new InitialPasswordApiError(
        "PASSWORD_UPDATED_STATE_FINALIZATION_REQUIRED",
        503,
        "The password was updated, but first-login state requires administrative repair.",
      );
    }

    const { error: auditError } = await admin.from("audit_events").insert({
      actor_user_id: userId,
      subscriber_id: membership.subscriber_id,
      event_type: "account.initial_password.changed",
      entity_type: "subscriber_membership",
      entity_id: membership.id,
      metadata: {
        role: membership.role,
        must_change_password: { from: true, to: false },
        password_changed_at: passwordChangedAt,
      },
      created_at: passwordChangedAt,
    });
    if (auditError) {
      throw new InitialPasswordApiError(
        "PASSWORD_CHANGED_AUDIT_RECORD_FAILED",
        503,
        "The password change completed, but its audit event requires administrative repair.",
      );
    }

    try {
      const { error: signOutError } = await admin.auth.admin.signOut(
        accessToken,
        "others",
      );
      if (signOutError) {
        await safeFailureAudit(
          admin,
          membership,
          userId,
          "account.initial_password.other_sessions_revocation_failed",
          "OTHER_SESSIONS_REVOCATION_FAILED",
        );
      }
    } catch {
      await safeFailureAudit(
        admin,
        membership,
        userId,
        "account.initial_password.other_sessions_revocation_failed",
        "OTHER_SESSIONS_REVOCATION_FAILED",
      );
    }

    return response(request, { completed: true, mustChangePassword: false });
  } catch (error) {
    return initialPasswordErrorResponse(request, error);
  }
}
