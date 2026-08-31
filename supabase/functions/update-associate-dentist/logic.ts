import { requestJson, response, text, uuid } from '../_shared/http.ts';

type AssociateUpdateContext = {
  userClaims?: { id?: unknown } | null;
  // deno-lint-ignore no-explicit-any
  supabaseAdmin: any;
};

const allowedUpdateKeys = new Set([
  'membershipId', 'firstName', 'middleName', 'lastName', 'mobileNumber', 'address',
  'licenseNumber', 'ptrNumber', 's2LicenseNumber', 'designation',
  'specialization', 'calendarColor', 'certificatesAndQualifications', 'clinicIds',
]);

const errorMessages: Record<string, { status: number; message: string }> = {
  AUTH_REQUIRED: { status: 401, message: 'Authentication is required.' },
  CLINIC_OWNER_ACCESS_REQUIRED: { status: 403, message: 'An eligible Clinic Owner membership is required.' },
  CLINIC_OWNER_CONTEXT_AMBIGUOUS: { status: 409, message: 'Clinic Owner membership context requires administrative review.' },
  FIRST_LOGIN_REQUIRED: { status: 403, message: 'Complete the initial password change before managing Associate Dentists.' },
  SUBSCRIPTION_NOT_ELIGIBLE: { status: 409, message: 'The current subscription is not eligible for Associate Dentist updates.' },
  INVALID_CLINIC_ASSIGNMENT: { status: 422, message: 'One or more clinic assignments are invalid.' },
  ASSOCIATE_NOT_FOUND: { status: 404, message: 'Associate Dentist not found.' },
  ASSOCIATE_UPDATE_FAILED: { status: 409, message: 'Associate Dentist update could not be completed.' },
  INVALID_ASSOCIATE_INPUT: { status: 422, message: 'Associate Dentist input is invalid.' },
};

class AssociateUpdateApiError extends Error {
  constructor(readonly code: string) {
    super(errorMessages[code]?.message ?? errorMessages.ASSOCIATE_UPDATE_FAILED.message);
  }
}

function fail(code: keyof typeof errorMessages): never {
  throw new AssociateUpdateApiError(code);
}

function optional(value: unknown, maximum: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  try { return text(value, 'Value', maximum); } catch { return fail('INVALID_ASSOCIATE_INPUT'); }
}

function required(value: unknown, maximum: number): string {
  try { return text(value, 'Value', maximum); } catch { return fail('INVALID_ASSOCIATE_INPUT'); }
}

function normalizedInput(payload: Record<string, unknown>): { membershipId: string; input: Record<string, unknown> } {
  if (Object.keys(payload).some((key) => !allowedUpdateKeys.has(key))) fail('INVALID_ASSOCIATE_INPUT');
  let membershipId: string;
  try { membershipId = uuid(payload.membershipId, 'membershipId'); } catch { return fail('ASSOCIATE_NOT_FOUND'); }
  const clinicIds = payload.clinicIds;
  if (!Array.isArray(clinicIds) || clinicIds.length === 0 || new Set(clinicIds.map(String)).size !== clinicIds.length) fail('INVALID_CLINIC_ASSIGNMENT');
  const normalizedClinicIds = clinicIds.map((clinicId) => {
    try { return uuid(clinicId, 'clinicIds'); } catch { return fail('INVALID_CLINIC_ASSIGNMENT'); }
  });
  const calendarColor = optional(payload.calendarColor, 20);
  if (calendarColor !== null && !/^#[0-9a-f]{6}$/i.test(calendarColor)) fail('INVALID_ASSOCIATE_INPUT');
  return {
    membershipId,
    input: {
      firstName: required(payload.firstName, 120),
      ...(optional(payload.middleName, 120) ? { middleName: optional(payload.middleName, 120) } : {}),
      lastName: required(payload.lastName, 120),
      ...(optional(payload.mobileNumber, 80) ? { mobileNumber: optional(payload.mobileNumber, 80) } : {}),
      ...(optional(payload.address, 1000) ? { address: optional(payload.address, 1000) } : {}),
      licenseNumber: required(payload.licenseNumber, 120),
      ptrNumber: required(payload.ptrNumber, 120),
      s2LicenseNumber: required(payload.s2LicenseNumber, 120),
      designation: required(payload.designation, 120),
      specialization: required(payload.specialization, 120),
      ...(calendarColor ? { calendarColor } : {}),
      ...(optional(payload.certificatesAndQualifications, 4000) ? { certificatesAndQualifications: optional(payload.certificatesAndQualifications, 4000) } : {}),
      clinicIds: normalizedClinicIds,
    },
  };
}

function errorCode(error: unknown): keyof typeof errorMessages {
  const source = error as { message?: unknown; code?: unknown } | null;
  const serialized = `${typeof source?.message === 'string' ? source.message : ''} ${typeof source?.code === 'string' ? source.code : ''}`;
  return (Object.keys(errorMessages) as Array<keyof typeof errorMessages>).find((code) => serialized.includes(code)) ?? 'ASSOCIATE_UPDATE_FAILED';
}

export async function handleAssociateUpdate(request: Request, ctx: AssociateUpdateContext): Promise<Response> {
  try {
    const actorUserId = typeof ctx.userClaims?.id === 'string' ? ctx.userClaims.id : null;
    if (!actorUserId) fail('AUTH_REQUIRED');
    const { membershipId, input } = normalizedInput(await requestJson(request));
    const { data, error } = await ctx.supabaseAdmin.rpc('update_my_associate_dentist', {
      p_actor_user_id: actorUserId,
      p_membership_id: membershipId,
      p_input: input,
    });
    if (error) fail(errorCode(error));
    if (!data || typeof data !== 'object' || (data as Record<string, unknown>).updated !== true) fail('ASSOCIATE_UPDATE_FAILED');
    return response(request, { updated: true, membershipId });
  } catch (error) {
    const code = error instanceof AssociateUpdateApiError ? error.code : 'ASSOCIATE_UPDATE_FAILED';
    const detail = errorMessages[code] ?? errorMessages.ASSOCIATE_UPDATE_FAILED;
    return response(request, { error: { code, message: detail.message } }, detail.status);
  }
}
