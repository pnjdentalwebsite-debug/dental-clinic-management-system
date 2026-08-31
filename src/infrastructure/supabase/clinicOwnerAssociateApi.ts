import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseClient } from './client';
import type { ClinicOwnerBootstrap } from './clinicOwnerApi';

export interface ClinicOwnerAssociateClinicAssignment {
  clinicId: string;
  clinicName: string;
  assignmentStatus: string;
}

export interface ClinicOwnerAssociateDirectoryItem {
  membershipId: string;
  associateNumber: string | null;
  displayName: string;
  email: string | null;
  mobile: string | null;
  designation: string | null;
  specialization: string | null;
  accountStatus: string;
  calendarColor: string | null;
  workSchedule: unknown;
  clinics: ClinicOwnerAssociateClinicAssignment[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ClinicOwnerAssociateDetail extends ClinicOwnerAssociateDirectoryItem {
  licenseNumber: string | null;
  ptrNumber: string | null;
  s2LicenseNumber: string | null;
  certificatesAndQualifications: string | null;
  alternateAssociateIds: string[];
  deviceRestrictionEnabled: boolean;
}

export type ClinicOwnerAssociateApiErrorCode =
  | 'OWNER_CONTEXT_UNAVAILABLE'
  | 'ASSOCIATE_NOT_FOUND'
  | 'DATA_UNAVAILABLE';

const safeMessages: Record<ClinicOwnerAssociateApiErrorCode, string> = {
  OWNER_CONTEXT_UNAVAILABLE: 'Clinic Owner access is unavailable. Please sign in again.',
  ASSOCIATE_NOT_FOUND: 'Associate Dentist not found.',
  DATA_UNAVAILABLE: 'Associate Dentist service unavailable. Please try again later.',
};

export class ClinicOwnerAssociateApiError extends Error {
  readonly code: ClinicOwnerAssociateApiErrorCode;

  constructor(code: ClinicOwnerAssociateApiErrorCode) {
    super(safeMessages[code]);
    this.code = code;
  }
}

type OwnerScope = Pick<ClinicOwnerBootstrap, 'subscriber'>;

const record = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
);

const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const string = (value: unknown): string => typeof value === 'string' ? value : '';
const nullableString = (value: unknown): string | null => {
  const result = string(value);
  return result || null;
};

function first(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return record(value[0]);
  return record(value);
}

function subscriberIdFrom(scope: OwnerScope): string {
  const subscriberId = scope?.subscriber?.id;
  if (!subscriberId) throw new ClinicOwnerAssociateApiError('OWNER_CONTEXT_UNAVAILABLE');
  return subscriberId;
}

function displayName(profile: Record<string, unknown>): string {
  const explicit = string(profile.display_name);
  if (explicit) return explicit;
  const name = [profile.first_name, profile.middle_name, profile.last_name]
    .map(string)
    .filter(Boolean)
    .join(' ');
  return name || string(profile.email) || 'Unnamed Associate';
}

function profileFor(row: Record<string, unknown>) {
  return first(row.profiles);
}

function professionalFor(row: Record<string, unknown>) {
  return first(row.associate_dentist_profiles);
}

function assignmentsFor(
  membershipId: string,
  subscriberId: string,
  rows: unknown[],
): ClinicOwnerAssociateClinicAssignment[] {
  return rows.flatMap((value) => {
    const assignment = record(value);
    if (
      string(assignment.membership_id) !== membershipId
      || string(assignment.subscriber_id) !== subscriberId
      || string(assignment.assignment_role) !== 'associate'
    ) {
      return [];
    }
    const clinic = first(assignment.clinics);
    if (!clinic || string(clinic.subscriber_id) !== subscriberId || !string(clinic.id)) return [];
    return [{
      clinicId: string(clinic.id),
      clinicName: string(clinic.name) || 'Clinic unavailable',
      assignmentStatus: string(assignment.status) || 'unavailable',
    }];
  });
}

function baseItem(
  row: Record<string, unknown>,
  subscriberId: string,
  assignments: unknown[],
): ClinicOwnerAssociateDirectoryItem {
  const membershipId = string(row.id);
  if (
    !membershipId
    || string(row.subscriber_id) !== subscriberId
    || string(row.role) !== 'associate'
  ) {
    throw new ClinicOwnerAssociateApiError('DATA_UNAVAILABLE');
  }
  const profile = profileFor(row);
  const professional = professionalFor(row);
  return {
    membershipId,
    associateNumber: nullableString(professional.associate_number),
    displayName: displayName(profile),
    email: nullableString(profile.email),
    mobile: nullableString(profile.mobile_number),
    designation: nullableString(professional.designation),
    specialization: nullableString(professional.specialization),
    accountStatus: string(row.account_status) || 'unavailable',
    calendarColor: nullableString(professional.calendar_color),
    workSchedule: professional.work_schedule ?? null,
    clinics: assignmentsFor(membershipId, subscriberId, assignments),
    createdAt: nullableString(row.created_at),
    updatedAt: nullableString(row.updated_at),
  };
}

async function loadAssignments(
  client: SupabaseClient,
  subscriberId: string,
  membershipIds: string[],
): Promise<unknown[]> {
  if (membershipIds.length === 0) return [];
  const { data, error } = await client
    .from('clinic_assignments')
    .select('membership_id, subscriber_id, clinic_id, assignment_role, status, clinics(id, subscriber_id, name)')
    .eq('subscriber_id', subscriberId)
    .eq('assignment_role', 'associate')
    .in('membership_id', membershipIds);
  if (error || !Array.isArray(data)) throw new ClinicOwnerAssociateApiError('DATA_UNAVAILABLE');
  return data;
}

const associateMembershipSelect = `
  id, subscriber_id, user_id, role, account_status, created_at, updated_at,
  profiles(id, email, display_name, first_name, middle_name, last_name, mobile_number),
  associate_dentist_profiles(
    associate_number, license_number, ptr_number, s2_license_number,
    designation, specialization, calendar_color, certificates_and_qualifications,
    alternate_associate_ids, device_restriction_enabled, work_schedule
  )
`;

export async function getClinicOwnerAssociateDirectory(
  scope: OwnerScope,
  client: SupabaseClient = requireSupabaseClient(),
): Promise<ClinicOwnerAssociateDirectoryItem[]> {
  const subscriberId = subscriberIdFrom(scope);
  const { data, error } = await client
    .from('subscriber_memberships')
    .select(associateMembershipSelect)
    .eq('subscriber_id', subscriberId)
    .eq('role', 'associate')
    .order('created_at', { ascending: false });
  if (error || !Array.isArray(data)) throw new ClinicOwnerAssociateApiError('DATA_UNAVAILABLE');

  const memberships = data.map(record);
  const membershipIds = memberships.map((membership) => string(membership.id)).filter(Boolean);
  const assignments = await loadAssignments(client, subscriberId, membershipIds);
  return memberships.map((membership) => baseItem(membership, subscriberId, assignments));
}

export async function getClinicOwnerAssociateDetail(
  scope: OwnerScope,
  membershipId: string,
  client: SupabaseClient = requireSupabaseClient(),
): Promise<ClinicOwnerAssociateDetail> {
  const subscriberId = subscriberIdFrom(scope);
  if (!membershipId) throw new ClinicOwnerAssociateApiError('ASSOCIATE_NOT_FOUND');
  const { data, error } = await client
    .from('subscriber_memberships')
    .select(associateMembershipSelect)
    .eq('id', membershipId)
    .eq('subscriber_id', subscriberId)
    .eq('role', 'associate')
    .maybeSingle();
  if (error) throw new ClinicOwnerAssociateApiError('DATA_UNAVAILABLE');
  if (!data) throw new ClinicOwnerAssociateApiError('ASSOCIATE_NOT_FOUND');

  const assignments = await loadAssignments(client, subscriberId, [membershipId]);
  const row = record(data);
  const professional = professionalFor(row);
  const base = baseItem(row, subscriberId, assignments);
  return {
    ...base,
    licenseNumber: nullableString(professional.license_number),
    ptrNumber: nullableString(professional.ptr_number),
    s2LicenseNumber: nullableString(professional.s2_license_number),
    certificatesAndQualifications: nullableString(professional.certificates_and_qualifications),
    alternateAssociateIds: list(professional.alternate_associate_ids).map(string).filter(Boolean),
    deviceRestrictionEnabled: professional.device_restriction_enabled === true,
  };
}
