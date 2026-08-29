import { handleInitialPasswordCompletion } from "./logic.ts";

type Membership = {
  id: string;
  subscriber_id: string;
  user_id: string;
  role: string;
  account_status: string;
  must_change_password: boolean;
  password_changed_at: string | null;
};

function assert(
  condition: unknown,
  message = "Assertion failed",
): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(
  actual: unknown,
  expected: unknown,
  message = "Values are not equal",
): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`,
    );
  }
}

const owner = (overrides: Partial<Membership> = {}): Membership => ({
  id: "30000000-0000-0000-0000-000000000001",
  subscriber_id: "20000000-0000-0000-0000-000000000001",
  user_id: "10000000-0000-0000-0000-000000000001",
  role: "clinic_owner",
  account_status: "active",
  must_change_password: true,
  password_changed_at: null,
  ...overrides,
});

class FakeQuery {
  private action: "select" | "update" | "insert" = "select";
  private payload: Record<string, unknown> | null = null;
  private filters: Array<[string, unknown]> = [];
  private maximum: number | null = null;

  constructor(
    private readonly admin: FakeAdmin,
    private readonly table: string,
  ) {}

  select(): this {
    return this;
  }

  update(payload: Record<string, unknown>): this {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  insert(payload: Record<string, unknown>): this {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }

  limit(value: number): this {
    this.maximum = value;
    return this;
  }

  maybeSingle(): Promise<{ data: unknown; error: unknown }> {
    return Promise.resolve(this.result(true));
  }

  then<TResult1 = { data: unknown; error: unknown }, TResult2 = never>(
    onfulfilled?:
      | ((
        value: { data: unknown; error: unknown },
      ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.result(false)).then(onfulfilled, onrejected);
  }

  private result(single: boolean): { data: unknown; error: unknown } {
    if (this.table === "subscriber_memberships" && this.action === "select") {
      this.admin.calls.push("membership.resolve");
      if (this.admin.membershipResolutionError) {
        return { data: null, error: { code: "test" } };
      }
      const matches = this.admin.memberships.filter((membership) =>
        this.filters.every(
          ([column, value]) => membership[column as keyof Membership] === value,
        )
      );
      return {
        data: this.maximum === null ? matches : matches.slice(0, this.maximum),
        error: null,
      };
    }
    if (this.table === "subscriber_memberships" && this.action === "update") {
      this.admin.calls.push("membership.finalize");
      if (this.admin.finalizationError) {
        return { data: null, error: { code: "test" } };
      }
      const match = this.admin.memberships.find((membership) =>
        this.filters.every(
          ([column, value]) => membership[column as keyof Membership] === value,
        )
      );
      if (!match || this.admin.finalizationReturnsNoRow) {
        return { data: null, error: null };
      }
      Object.assign(match, this.payload);
      return { data: single ? { ...match } : [{ ...match }], error: null };
    }
    if (this.table === "audit_events" && this.action === "insert") {
      this.admin.calls.push("audit.insert");
      this.admin.auditPayloads.push(structuredClone(this.payload ?? {}));
      return {
        data: null,
        error: this.admin.auditError ? { code: "test" } : null,
      };
    }
    return { data: single ? null : [], error: null };
  }
}

class FakeAdmin {
  memberships: Membership[] = [owner()];
  membershipResolutionError = false;
  authUpdateError = false;
  finalizationError = false;
  finalizationReturnsNoRow = false;
  auditError = false;
  signOutError = false;
  calls: string[] = [];
  auditPayloads: Array<Record<string, unknown>> = [];
  authTargets: string[] = [];
  signOutArguments: Array<[string, string]> = [];

  auth: {
    admin: {
      updateUserById: (
        userId: string,
      ) => Promise<{ data: null; error: { code: string } | null }>;
      signOut: (
        token: string,
        scope: string,
      ) => Promise<{ data: null; error: { code: string } | null }>;
    };
  };

  constructor() {
    this.auth = {
      admin: {
        updateUserById: (userId: string) => {
          this.calls.push("auth.update");
          this.authTargets.push(userId);
          return Promise.resolve({
            data: null,
            error: this.authUpdateError ? { code: "test" } : null,
          });
        },
        signOut: (token: string, scope: string) => {
          this.calls.push("auth.signOut");
          this.signOutArguments.push([token, scope]);
          return Promise.resolve({
            data: null,
            error: this.signOutError ? { code: "test" } : null,
          });
        },
      },
    };
  }

  from(table: string): FakeQuery {
    return new FakeQuery(this, table);
  }
}

const request = (body: unknown, token = "current-access-token"): Request =>
  new Request("http://localhost/complete", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

async function invoke(
  admin: FakeAdmin,
  body: unknown,
  options: { userId?: unknown; token?: string } = {},
) {
  const result = await handleInitialPasswordCompletion(
    request(body, options.token ?? "current-access-token"),
    {
      userClaims: { id: options.userId ?? owner().user_id },
      supabaseAdmin: admin,
    },
  );
  return { status: result.status, body: await result.json() };
}

Deno.test("unexpected fields are rejected", async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, {
    newPassword: "ValidPassword123",
    userId: owner().user_id,
  });
  assertEquals(result.body.error.code, "INVALID_REQUEST");
  assertEquals(admin.authTargets.length, 0);
});

Deno.test("browser cannot choose the target user", async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, {
    newPassword: "ValidPassword123",
    ownerUserId: "other",
  });
  assertEquals(result.body.error.code, "INVALID_REQUEST");
  assertEquals(admin.authTargets.length, 0);
});

Deno.test("zero active owner memberships are rejected", async () => {
  const admin = new FakeAdmin();
  admin.memberships = [];
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(result.body.error.code, "NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP");
});

Deno.test("multiple active owner memberships are rejected", async () => {
  const admin = new FakeAdmin();
  admin.memberships.push(
    owner({
      id: "30000000-0000-0000-0000-000000000002",
      subscriber_id: "20000000-0000-0000-0000-000000000002",
    }),
  );
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(
    result.body.error.code,
    "MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS",
  );
  assertEquals(admin.authTargets.length, 0);
});

Deno.test("inactive owner membership is rejected", async () => {
  const admin = new FakeAdmin();
  admin.memberships = [owner({ account_status: "suspended" })];
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(result.body.error.code, "NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP");
});

Deno.test("wrong membership role is rejected", async () => {
  const admin = new FakeAdmin();
  admin.memberships = [owner({ role: "staff" })];
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(result.body.error.code, "NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP");
});

Deno.test("already-completed state never rotates Auth password", async () => {
  const admin = new FakeAdmin();
  admin.memberships[0].must_change_password = false;
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(result.body.error.code, "INITIAL_PASSWORD_ALREADY_COMPLETED");
  assertEquals(admin.authTargets.length, 0);
  assertEquals(admin.calls.includes("membership.finalize"), false);
});

Deno.test("password below 12 characters is rejected", async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, { newPassword: "Short123" });
  assertEquals(result.body.error.code, "INVALID_PASSWORD");
});

Deno.test("password without a letter is rejected", async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, { newPassword: "123456789012" });
  assertEquals(result.body.error.code, "INVALID_PASSWORD");
});

Deno.test("password without a digit is rejected", async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, { newPassword: "LettersOnlyPassword" });
  assertEquals(result.body.error.code, "INVALID_PASSWORD");
});

Deno.test("valid password completes with safe response", async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(result.status, 200);
  assertEquals(result.body, { completed: true, mustChangePassword: false });
});

Deno.test("Auth update occurs before membership finalization and audit", async () => {
  const admin = new FakeAdmin();
  await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(admin.calls.slice(0, 5), [
    "membership.resolve",
    "auth.update",
    "membership.finalize",
    "audit.insert",
    "auth.signOut",
  ]);
});

Deno.test("Auth update failure leaves first-login state unchanged", async () => {
  const admin = new FakeAdmin();
  admin.authUpdateError = true;
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(result.body.error.code, "AUTH_PASSWORD_UPDATE_FAILED");
  assertEquals(admin.memberships[0].must_change_password, true);
  assertEquals(admin.calls.includes("membership.finalize"), false);
});

Deno.test("success finalizes only the resolved membership", async () => {
  const admin = new FakeAdmin();
  const unrelated = owner({
    id: "30000000-0000-0000-0000-000000000009",
    subscriber_id: "20000000-0000-0000-0000-000000000009",
    user_id: "10000000-0000-0000-0000-000000000009",
  });
  admin.memberships.push(unrelated);
  await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(admin.memberships[0].must_change_password, false);
  assertEquals(unrelated.must_change_password, true);
});

Deno.test("success records password_changed_at", async () => {
  const admin = new FakeAdmin();
  await invoke(admin, { newPassword: "ValidPassword123" });
  assert(typeof admin.memberships[0].password_changed_at === "string");
  assert(!Number.isNaN(Date.parse(admin.memberships[0].password_changed_at!)));
});

Deno.test("stale conditional finalization returns recovery-required state", async () => {
  const admin = new FakeAdmin();
  admin.finalizationReturnsNoRow = true;
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(
    result.body.error.code,
    "PASSWORD_UPDATED_STATE_FINALIZATION_REQUIRED",
  );
  assertEquals(admin.memberships[0].must_change_password, true);
  assert(
    admin.auditPayloads.some((payload) =>
      payload.event_type ===
        "account.initial_password.state_finalization_required"
    ),
  );
});

Deno.test("database finalization failure returns recovery-required state", async () => {
  const admin = new FakeAdmin();
  admin.finalizationError = true;
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(
    result.body.error.code,
    "PASSWORD_UPDATED_STATE_FINALIZATION_REQUIRED",
  );
});

Deno.test("success audit contains safe identifiers and no credential", async () => {
  const admin = new FakeAdmin();
  await invoke(admin, { newPassword: "ValidPassword123" });
  const audit = admin.auditPayloads.find((payload) =>
    payload.event_type === "account.initial_password.changed"
  );
  assert(audit);
  assertEquals(audit.actor_user_id, owner().user_id);
  assertEquals(audit.entity_id, owner().id);
  const serialized = JSON.stringify(audit);
  for (
    const prohibited of [
      "ValidPassword123",
      "current-access-token",
      "authorization",
      "temporaryPassword",
      "newPassword",
    ]
  ) {
    assert(
      !serialized.includes(prohibited),
      `Audit included prohibited value: ${prohibited}`,
    );
  }
});

Deno.test("safe response contains no password, token, or session", async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  const serialized = JSON.stringify(result.body).toLowerCase();
  assert(!serialized.includes("newpassword"));
  assert(!serialized.includes("temporarypassword"));
  assert(!serialized.includes("validpassword123"));
  assert(!serialized.includes("token"));
  assert(!serialized.includes("session"));
});

Deno.test("selective revocation preserves current session scope", async () => {
  const admin = new FakeAdmin();
  await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(admin.signOutArguments, [["current-access-token", "others"]]);
});

Deno.test("session revocation failure does not undo completed state", async () => {
  const admin = new FakeAdmin();
  admin.signOutError = true;
  const result = await invoke(admin, { newPassword: "ValidPassword123" });
  assertEquals(result.body, { completed: true, mustChangePassword: false });
  assertEquals(admin.memberships[0].must_change_password, false);
  assert(
    admin.auditPayloads.some((payload) =>
      payload.event_type ===
        "account.initial_password.other_sessions_revocation_failed"
    ),
  );
});

Deno.test("invalid JSON returns typed invalid request", async () => {
  const admin = new FakeAdmin();
  const invalidRequest = new Request("http://localhost/complete", {
    method: "POST",
    headers: {
      authorization: "Bearer current-access-token",
      "content-type": "application/json",
    },
    body: "{",
  });
  const result = await handleInitialPasswordCompletion(invalidRequest, {
    userClaims: { id: owner().user_id },
    supabaseAdmin: admin,
  });
  assertEquals((await result.json()).error.code, "INVALID_REQUEST");
});

Deno.test("missing verified claim is rejected", async () => {
  const admin = new FakeAdmin();
  const result = await handleInitialPasswordCompletion(
    request({ newPassword: "ValidPassword123" }),
    {
      userClaims: null,
      supabaseAdmin: admin,
    },
  );
  assertEquals((await result.json()).error.code, "UNAUTHORIZED");
});

Deno.test("missing bearer context is rejected before state changes", async () => {
  const admin = new FakeAdmin();
  const noToken = new Request("http://localhost/complete", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ newPassword: "ValidPassword123" }),
  });
  const result = await handleInitialPasswordCompletion(noToken, {
    userClaims: { id: owner().user_id },
    supabaseAdmin: admin,
  });
  assertEquals((await result.json()).error.code, "UNAUTHORIZED");
  assertEquals(admin.calls.length, 0);
});
