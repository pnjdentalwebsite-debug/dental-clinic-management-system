import { email, requestJson, response, text, uuid } from '../_shared/http.ts';
import { sendInitialAssociateCredentialEmail } from '../_shared/registration-email.ts';

type AssociateProvisioningContext = {
  userClaims?: { id?: unknown } | null;
  // The server package does not export its wrapped Admin client context type.
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any;
};

type AssociateAttempt = {
  attempt_id: string;
  attempt_status: 'claimed' | 'database_provisioned' | 'completed' | 'failed';
  operation: 'create' | 'delivery_retry' | 'completed';
  auth_user_id: string | null;
  membership_id: string | null;
  credential_delivery_status: 'pending' | 'sent' | 'failed';
};

type ProvisionedAssociate = {
  membership_id: string;
  associate_number: string;
  credential_delivery_status: 'pending' | 'sent' | 'failed';
};

const allowedCreateKeys = new Set([
  'email', 'firstName', 'middleName', 'lastName', 'mobileNumber', 'address',
  'licenseNumber', 'ptrNumber', 's2LicenseNumber', 'designation',
  'specialization', 'calendarColor', 'certificatesAndQualifications', 'clinicIds',
]);

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AssociateProvisioningApiError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

const errorMessages: Record<string, { status: number; message: string }> = {
  AUTH_REQUIRED: { status: 401, message: 'Authentication is required.' },
  CLINIC_OWNER_ACCESS_REQUIRED: { status: 403, message: 'An eligible Clinic Owner membership is required.' },
  CLINIC_OWNER_CONTEXT_AMBIGUOUS: { status: 409, message: 'Clinic Owner membership context requires administrative review.' },
  FIRST_LOGIN_REQUIRED: { status: 403, message: 'Complete the initial password change before managing Associate Dentists.' },
  SUBSCRIPTION_NOT_ELIGIBLE: { status: 409, message: 'The current subscription is not eligible for Associate Dentist provisioning.' },
  ASSOCIATE_QUOTA_REACHED: { status: 409, message: 'The Associate Dentist plan quota has been reached.' },
  ASSOCIATE_EMAIL_UNAVAILABLE: { status: 409, message: 'This email is unavailable for Associate Dentist provisioning.' },
  INVALID_CLINIC_ASSIGNMENT: { status: 422, message: 'One or more clinic assignments are invalid.' },
  ASSOCIATE_NOT_FOUND: { status: 404, message: 'Associate Dentist not found.' },
  CREDENTIAL_DELIVERY_FAILED: { status: 503, message: 'The credential could not be delivered. Retry is required.' },
  ASSOCIATE_PROVISIONING_FAILED: { status: 409, message: 'Associate Dentist provisioning could not be completed.' },
  ASSOCIATE_UPDATE_FAILED: { status: 409, message: 'Associate Dentist update could not be completed.' },
  INVALID_ASSOCIATE_INPUT: { status: 422, message: 'Associate Dentist input is invalid.' },
};

function fail(code: keyof typeof errorMessages): never {
  const detail = errorMessages[code];
  throw new AssociateProvisioningApiError(code, detail.status, detail.message);
}

function normalizedOptional(value: unknown, maximum: number, code: keyof typeof errorMessages = 'INVALID_ASSOCIATE_INPUT'): string | null {
  if (value === undefined || value === null || value === '') return null;
  try {
    return text(value, 'Value', maximum);
  } catch {
    return fail(code);
  }
}

function normalizedRequired(value: unknown, maximum: number): string {
  try {
    return text(value, 'Value', maximum);
  } catch {
    return fail('INVALID_ASSOCIATE_INPUT');
  }
}

export function createRequestOnly(payload: Record<string, unknown>): Record<string, unknown> {
  const keys = Object.keys(payload);
  if (keys.some((key) => !allowedCreateKeys.has(key))) fail('INVALID_ASSOCIATE_INPUT');

  let normalizedEmail: string;
  try {
    normalizedEmail = email(payload.email);
  } catch {
    return fail('INVALID_ASSOCIATE_INPUT');
  }
  const clinicIds = payload.clinicIds;
  if (!Array.isArray(clinicIds) || clinicIds.length === 0 || new Set(clinicIds.map(String)).size !== clinicIds.length) {
    return fail('INVALID_CLINIC_ASSIGNMENT');
  }
  const normalizedClinicIds = clinicIds.map((value) => {
    if (typeof value !== 'string' || !uuidPattern.test(value.trim())) return fail('INVALID_CLINIC_ASSIGNMENT');
    return value.trim().toLowerCase();
  });
  const calendarColor = normalizedOptional(payload.calendarColor, 20);
  if (calendarColor !== null && !/^#[0-9a-f]{6}$/i.test(calendarColor)) fail('INVALID_ASSOCIATE_INPUT');

  return {
    email: normalizedEmail,
    firstName: normalizedRequired(payload.firstName, 120),
    ...(normalizedOptional(payload.middleName, 120) ? { middleName: normalizedOptional(payload.middleName, 120) } : {}),
    lastName: normalizedRequired(payload.lastName, 120),
    ...(normalizedOptional(payload.mobileNumber, 80) ? { mobileNumber: normalizedOptional(payload.mobileNumber, 80) } : {}),
    ...(normalizedOptional(payload.address, 1000) ? { address: normalizedOptional(payload.address, 1000) } : {}),
    licenseNumber: normalizedRequired(payload.licenseNumber, 120),
    ptrNumber: normalizedRequired(payload.ptrNumber, 120),
    s2LicenseNumber: normalizedRequired(payload.s2LicenseNumber, 120),
    designation: normalizedRequired(payload.designation, 120),
    specialization: normalizedRequired(payload.specialization, 120),
    ...(calendarColor ? { calendarColor } : {}),
    ...(normalizedOptional(payload.certificatesAndQualifications, 4000)
      ? { certificatesAndQualifications: normalizedOptional(payload.certificatesAndQualifications, 4000) }
      : {}),
    clinicIds: normalizedClinicIds,
  };
}

function errorCodeFromRpc(error: unknown, fallback: keyof typeof errorMessages): keyof typeof errorMessages {
  const source = error as { message?: unknown; code?: unknown } | null;
  const textValue = `${typeof source?.message === 'string' ? source.message : ''} ${typeof source?.code === 'string' ? source.code : ''}`;
  return (Object.keys(errorMessages) as Array<keyof typeof errorMessages>)
    .find((code) => textValue.includes(code)) ?? fallback;
}

function rpcError(error: unknown, fallback: keyof typeof errorMessages): never {
  return fail(errorCodeFromRpc(error, fallback));
}

function temporaryPassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%';
  const all = `${uppercase}${lowercase}${digits}${symbols}`;
  const randomIndex = (alphabet: string): string => {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return alphabet[value[0] % alphabet.length];
  };
  const characters = [randomIndex(uppercase), randomIndex(lowercase), randomIndex(digits), randomIndex(symbols)];
  while (characters.length < 20) characters.push(randomIndex(all));
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    const swapIndex = value[0] % (index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join('');
}

async function findAuthUserByEmail(admin: any, normalizedEmail: string): Promise<{ id: string } | null> {
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) fail('ASSOCIATE_PROVISIONING_FAILED');
    const users = (data?.users ?? []) as Array<{ id: string; email?: string | null }>;
    const match = users.find((user) => user.email?.trim().toLowerCase() === normalizedEmail);
    if (match) return { id: match.id };
    if (users.length < 1000) return null;
  }
}

async function callRpc<T>(admin: any, name: string, params: Record<string, unknown>, fallback: keyof typeof errorMessages): Promise<T> {
  const { data, error } = await admin.rpc(name, params);
  if (error) rpcError(error, fallback);
  return data as T;
}

async function markAttemptFailed(admin: any, attemptId: string, actorId: string, failureCode: string): Promise<void> {
  try {
    await admin.rpc('fail_associate_provisioning_attempt', {
      p_attempt_id: attemptId,
      p_actor_user_id: actorId,
      p_failure_code: failureCode,
    });
  } catch {
    // The original safe response and retained attempt ledger are the recovery signal.
  }
}

async function compensateCreatedAuthUser(admin: any, attemptId: string, actorId: string, authUserId: string): Promise<void> {
  await markAttemptFailed(admin, attemptId, actorId, 'DATABASE_PROVISIONING_FAILED');
  const { error } = await admin.auth.admin.deleteUser(authUserId);
  if (error) return;
  try {
    await admin.rpc('clear_failed_associate_attempt_auth_identity', {
      p_attempt_id: attemptId,
      p_actor_user_id: actorId,
      p_auth_user_id: authUserId,
    });
  } catch {
    // A successfully deleted Auth identity remains harmless; the attempt is retained for repair.
  }
}

function safeCompletion(record: ProvisionedAssociate): Record<string, unknown> {
  return {
    provisioningStatus: 'completed',
    membershipId: record.membership_id,
    associateNumber: record.associate_number,
    credentialDelivery: { status: 'sent' },
  };
}

async function deliverCredential(
  admin: any,
  attemptId: string,
  actorId: string,
  recipient: string,
  password: string,
): Promise<ProvisionedAssociate> {
  let temporary: string | null = password;
  try {
    await sendInitialAssociateCredentialEmail({ to: recipient, temporaryPassword: temporary });
  } catch {
    temporary = null;
    try {
      await callRpc<ProvisionedAssociate[]>(admin, 'record_associate_credential_delivery', {
        p_attempt_id: attemptId,
        p_actor_user_id: actorId,
        p_delivery_status: 'failed',
        p_failure_code: 'CREDENTIAL_DELIVERY_FAILED',
      }, 'CREDENTIAL_DELIVERY_FAILED');
    } catch {
      // Do not conceal delivery failure if the recovery ledger itself is unavailable.
    }
    return fail('CREDENTIAL_DELIVERY_FAILED');
  } finally {
    temporary = null;
  }
  const delivery = await callRpc<ProvisionedAssociate[]>(admin, 'record_associate_credential_delivery', {
    p_attempt_id: attemptId,
    p_actor_user_id: actorId,
    p_delivery_status: 'sent',
    p_failure_code: null,
  }, 'CREDENTIAL_DELIVERY_FAILED');
  if (!delivery?.[0]) fail('CREDENTIAL_DELIVERY_FAILED');
  return delivery[0];
}

export function associateProvisioningErrorResponse(request: Request, error: unknown): Response {
  if (error instanceof AssociateProvisioningApiError) {
    return response(request, { error: { code: error.code, message: error.message } }, error.status);
  }
  return response(request, {
    error: { code: 'ASSOCIATE_PROVISIONING_FAILED', message: errorMessages.ASSOCIATE_PROVISIONING_FAILED.message },
  }, 503);
}

export async function handleAssociateProvisioning(request: Request, ctx: AssociateProvisioningContext): Promise<Response> {
  let password: string | null = null;
  try {
    const actorId = typeof ctx.userClaims?.id === 'string' ? ctx.userClaims.id : null;
    if (!actorId) fail('AUTH_REQUIRED');
    let payload: Record<string, unknown>;
    try {
      payload = createRequestOnly(await requestJson(request));
    } catch (error) {
      if (error instanceof AssociateProvisioningApiError) throw error;
      return fail('INVALID_ASSOCIATE_INPUT');
    }
    const admin = ctx.supabaseAdmin as any;
    const attemptRows = await callRpc<AssociateAttempt[]>(admin, 'begin_associate_provisioning', {
      p_actor_user_id: actorId,
      p_input: payload,
    }, 'ASSOCIATE_PROVISIONING_FAILED');
    const attempt = attemptRows?.[0];
    if (!attempt) fail('ASSOCIATE_PROVISIONING_FAILED');

    if (attempt.operation === 'completed') {
      return response(request, {
        provisioningStatus: 'completed',
        membershipId: attempt.membership_id,
        credentialDelivery: { status: 'sent' },
      });
    }

    if (attempt.operation === 'delivery_retry') {
      const retryRows = await callRpc<Array<{ auth_user_id: string; membership_id: string; email_normalized: string }>>(
        admin,
        'prepare_associate_credential_retry',
        { p_attempt_id: attempt.attempt_id, p_actor_user_id: actorId },
        'CREDENTIAL_DELIVERY_FAILED',
      );
      const retry = retryRows?.[0];
      if (!retry) fail('CREDENTIAL_DELIVERY_FAILED');
      password = temporaryPassword();
      const { error: rotationError } = await admin.auth.admin.updateUserById(retry.auth_user_id, { password });
      if (rotationError) fail('ASSOCIATE_PROVISIONING_FAILED');
      const delivered = await deliverCredential(admin, attempt.attempt_id, actorId, retry.email_normalized, password);
      return response(request, safeCompletion(delivered));
    }

    const requestedEmail = String(payload.email);
    if (await findAuthUserByEmail(admin, requestedEmail)) {
      await markAttemptFailed(admin, attempt.attempt_id, actorId, 'ASSOCIATE_EMAIL_UNAVAILABLE');
      fail('ASSOCIATE_EMAIL_UNAVAILABLE');
    }

    password = temporaryPassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: requestedEmail,
      password,
      email_confirm: true,
      app_metadata: { pnj_role: 'associate' },
    });
    if (createError || !created?.user) {
      await markAttemptFailed(admin, attempt.attempt_id, actorId, 'AUTH_IDENTITY_CREATE_FAILED');
      fail('ASSOCIATE_EMAIL_UNAVAILABLE');
    }
    const authUserId = created.user.id;
    try {
      await callRpc<void>(admin, 'record_associate_provisioning_auth_identity', {
        p_attempt_id: attempt.attempt_id,
        p_actor_user_id: actorId,
        p_auth_user_id: authUserId,
      }, 'ASSOCIATE_PROVISIONING_FAILED');
    } catch (error) {
      await markAttemptFailed(admin, attempt.attempt_id, actorId, 'AUTH_IDENTITY_RECORD_FAILED');
      await admin.auth.admin.deleteUser(authUserId);
      throw error;
    }

    let provisioned: ProvisionedAssociate;
    try {
      const rows = await callRpc<ProvisionedAssociate[]>(admin, 'complete_associate_provisioning', {
        p_attempt_id: attempt.attempt_id,
        p_actor_user_id: actorId,
        p_auth_user_id: authUserId,
      }, 'ASSOCIATE_PROVISIONING_FAILED');
      if (!rows?.[0]) fail('ASSOCIATE_PROVISIONING_FAILED');
      provisioned = rows[0];
    } catch (error) {
      await compensateCreatedAuthUser(admin, attempt.attempt_id, actorId, authUserId);
      throw error;
    }

    const delivered = await deliverCredential(admin, attempt.attempt_id, actorId, requestedEmail, password);
    password = null;
    return response(request, safeCompletion({ ...provisioned, ...delivered }));
  } catch (error) {
    password = null;
    return associateProvisioningErrorResponse(request, error);
  }
}
