import type { ActivityLogLike, MockClinic, PlatformUser, Subscriber } from '../../platformManagement/types';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type { RegistrationLike } from '../../platformManagement/types';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import type { PlanLimit } from '../../plans/types';
import type { Clinic, ClinicAssignment, ClinicAssignmentRole, ClinicFilters, ClinicFormData, ClinicHistoryRecord, ClinicResult, ClinicSort } from '../types';
import { clinicUsageCountingStatuses, validateActivationReadiness, validateClinicForm, validateClinicOwnership, validateUserAssignment } from '../validation/clinicValidation';

const CLINICS_KEY = 'pnj_mock_clinics';
const ASSIGNMENTS_KEY = 'pnj_mock_clinic_assignments';
const HISTORY_KEY = 'pnj_mock_clinic_history';
const USERS_KEY = 'pnj_mock_platform_users';
const SUBSCRIBERS_KEY = 'pnj_mock_subscribers';
const ACTIVITY_KEY = 'pnj_mock_activity_logs';
const DELETED_CLINICS_KEY = 'pnj_mock_deleted_clinics';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const today = () => new Date().toISOString().split('T')[0];
const nowText = () => new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const normalizeStatus = (value?: string): Clinic['status'] => value === 'archived' || value === 'inactive' || value === 'draft' || value === 'pending' ? value : value === 'deactivated' || value === 'suspended' ? 'inactive' : 'active';

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    if (key === ACTIVITY_KEY && Array.isArray(value)) {
      const trimmed = value.slice(0, 200);
      try {
        localStorage.setItem(key, JSON.stringify(trimmed));
        return;
      } catch {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return;
      }
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};
const getDeletedClinicKeys = (): string[] => safeRead<string[]>(DELETED_CLINICS_KEY, []).map(s => String(s || '').toLowerCase());
const readClinicsRaw = () => {
  const deleted = getDeletedClinicKeys();
  const raw = safeRead<Array<Partial<Clinic> & Partial<MockClinic> & Record<string, unknown>>>(CLINICS_KEY, []);
  return raw.filter(c => 
    !deleted.includes(String(c.id || '').toLowerCase()) && 
    !deleted.includes(String(c.clinicNumber || '').toLowerCase()) && 
    !deleted.includes(String(c.name || '').trim().toLowerCase())
  );
};
const writeClinics = (records: Clinic[]) => safeWrite(CLINICS_KEY, records);
const readAssignments = () => safeRead<ClinicAssignment[]>(ASSIGNMENTS_KEY, []);
const writeAssignments = (records: ClinicAssignment[]) => safeWrite(ASSIGNMENTS_KEY, records);
const readHistory = () => safeRead<ClinicHistoryRecord[]>(HISTORY_KEY, []);
const writeHistory = (records: ClinicHistoryRecord[]) => safeWrite(HISTORY_KEY, records);
const readUsers = () => safeRead<PlatformUser[]>(USERS_KEY, []);
const writeUsers = (records: PlatformUser[]) => safeWrite(USERS_KEY, records);
const readSubscribers = () => safeRead<Subscriber[]>(SUBSCRIBERS_KEY, []);
const writeSubscribers = (records: Subscriber[]) => safeWrite(SUBSCRIBERS_KEY, records);
const readRegistrations = () => safeRead<RegistrationLike[]>('pnj_mock_registrations', []);

export const defaultBusinessHours = () => Object.fromEntries(days.map(day => [day, {
  enabled: !['Saturday', 'Sunday'].includes(day),
  openingTime: '09:00',
  closingTime: '18:00',
  breakEnabled: true,
  breakStart: '12:00',
  breakEnd: '13:00'
}])) as Clinic['businessHours'];

const logActivity = (event: string, details: string) => {
  const logs = safeRead<ActivityLogLike[]>(ACTIVITY_KEY, []);
  safeWrite(ACTIVITY_KEY, [{ id: makeId('LOG'), timestamp: nowText(), event, details, role: 'platform_owner' }, ...logs]);
};

const addHistory = (clinic: Clinic, action: string, details: string, previousStatus?: Clinic['status'], nextStatus?: Clinic['status']) => {
  writeHistory([{ id: makeId('CH'), clinicId: clinic.id, action, details, createdAt: nowText(), actor: 'platform_owner', previousStatus, nextStatus }, ...readHistory()]);
  logActivity(`Clinic ${action}`, details);
};

const parseAddress = (address?: string) => {
  const parts = String(address || '').split(',').map(item => item.trim()).filter(Boolean);
  return {
    addressLine1: parts[0] || 'Mock clinic address pending setup',
    city: parts.length > 1 ? parts[parts.length - 1] : 'Manila',
    province: parts.length > 2 ? parts[parts.length - 2] : 'Metro Manila'
  };
};

const subscriberFor = (id?: string) => id ? mockPlatformManagementService.getSubscriberById(id) : null;
const usersForSubscriber = (subscriberId: string) => readUsers().filter(user => user.subscriberId === subscriberId);
const ownerForSubscriber = (subscriberId: string) => usersForSubscriber(subscriberId).find(user => user.role === 'clinic_owner' && user.accountStatus === 'active');
const activeAssignmentsFor = (clinicId: string, role?: ClinicAssignmentRole) => readAssignments().filter(item => item.clinicId === clinicId && item.assignmentStatus === 'active' && (!role || item.assignmentRole === role));

const normalizeClinic = (record: Partial<Clinic> & Partial<MockClinic> & Record<string, unknown>, index: number): Clinic | null => {
  if (!record.id || !record.subscriberId) return null;
  const subscriber = subscriberFor(String(record.subscriberId));
  const address = parseAddress(String(record.address || record.addressLine1 || ''));
  const status = normalizeStatus(String(record.status || subscriber?.accountStatus || 'active'));
  const owner = String(record.primaryOwnerUserId || subscriber?.ownerUserId || ownerForSubscriber(String(record.subscriberId))?.id || '');
  const assignments = readAssignments().filter(item => item.clinicId === String(record.id) && item.assignmentStatus === 'active');
  const dentistUserIds = Array.isArray(record.dentistUserIds) ? record.dentistUserIds.map(String) : assignments.filter(item => item.assignmentRole === 'associate').map(item => item.userId);
  const staffUserIds = Array.isArray(record.staffUserIds) ? record.staffUserIds.map(String) : assignments.filter(item => item.assignmentRole === 'staff').map(item => item.userId);
  return {
    id: String(record.id),
    clinicNumber: String(record.clinicNumber || `CLN-${String(index + 1).padStart(6, '0')}`),
    subscriberId: String(record.subscriberId),
    primaryOwnerUserId: owner || undefined,
    branchType: record.branchType === 'satellite' ? 'satellite' : 'main',
    name: String(record.name || subscriber?.primaryClinicName || 'Mock Dental Clinic'),
    legalBusinessName: String(record.legalBusinessName || subscriber?.businessName || record.name || 'Mock Dental Clinic'),
    email: String(record.email || subscriber?.email || 'clinic@example.com'),
    contactNumber: String(record.contactNumber || subscriber?.mobileNumber || '09170000000'),
    alternativeContactNumber: record.alternativeContactNumber ? String(record.alternativeContactNumber) : undefined,
    addressLine1: String(record.addressLine1 || address.addressLine1),
    addressLine2: record.addressLine2 ? String(record.addressLine2) : '',
    barangay: record.barangay ? String(record.barangay) : '',
    city: String(record.city || address.city),
    province: String(record.province || address.province),
    postalCode: record.postalCode ? String(record.postalCode) : '',
    country: String(record.country || 'Philippines'),
    timezone: String(record.timezone || 'Asia/Manila'),
    description: record.description ? String(record.description) : '',
    logoMetadata: record.logoMetadata as Clinic['logoMetadata'] | undefined,
    status,
    visibility: record.visibility === 'hidden' ? 'hidden' : 'visible',
    isPrimaryClinic: record.isPrimaryClinic !== undefined ? Boolean(record.isPrimaryClinic) : (subscriber?.primaryClinicName === record.name || index === 0),
    dentistUserIds,
    staffUserIds,
    laboratoryIds: Array.isArray(record.laboratoryIds) ? record.laboratoryIds.map(String) : [],
    businessHours: (record.businessHours as Clinic['businessHours']) || defaultBusinessHours(),
    createdAt: String(record.createdAt || today()),
    updatedAt: String(record.updatedAt || today()),
    activatedAt: record.activatedAt ? String(record.activatedAt) : status === 'active' ? String(record.createdAt || today()) : undefined,
    deactivatedAt: record.deactivatedAt ? String(record.deactivatedAt) : undefined,
    archivedAt: record.archivedAt ? String(record.archivedAt) : status === 'archived' ? today() : undefined,
    createdBy: String(record.createdBy || 'system'),
    updatedBy: String(record.updatedBy || 'system'),
    deactivationReason: record.deactivationReason ? String(record.deactivationReason) : undefined,
    archiveReason: record.archiveReason ? String(record.archiveReason) : undefined
  };
};

const listNormalized = () => {
  mockPlatformManagementService.ensureSeedData();
  const raw = readClinicsRaw().filter(cln =>
    !String(cln.id || '').startsWith('CLN-MOCK-') &&
    !String(cln.email || '').includes('@example.com')
  );
  const normalized = raw.map(normalizeClinic).filter(Boolean) as Clinic[];
  writeClinics(normalized);
  return normalized;
};

const pendingRegistrationClinics = (persisted: Clinic[]): Clinic[] => {
  const registrations = readRegistrations();
  const existingEmails = new Set(persisted.map((clinic) => clinic.email.toLowerCase()));
  const existingNames = new Set(persisted.map((clinic) => `${clinic.subscriberId}::${clinic.name.toLowerCase()}`));

  return registrations
    .filter((registration) =>
      ['unpaid', 'pending_verification'].includes(registration.paymentStatus) &&
      !existingEmails.has(registration.clinicEmail.toLowerCase()) &&
      !existingNames.has(`${registration.subscriberId || `REGISTRATION-${registration.id}`}::${registration.clinicName.toLowerCase()}`)
    )
    .map((registration, index) => {
      const address = parseAddress(registration.clinicAddress || registration.ownerAddress || '');
      const subscriberId = registration.subscriberId || `REGISTRATION-${registration.id}`;
      return {
        id: `CLN-PENDING-${registration.id}`,
        clinicNumber: `PENDING-CLN-${String(index + 1).padStart(4, '0')}`,
        subscriberId,
        primaryOwnerUserId: registration.userId || '',
        branchType: 'main',
        name: registration.clinicName,
        legalBusinessName: registration.clinicName,
        email: registration.clinicEmail || registration.ownerEmail,
        contactNumber: registration.clinicMobile || registration.ownerMobile,
        alternativeContactNumber: '',
        addressLine1: address.addressLine1,
        addressLine2: '',
        barangay: '',
        city: address.city,
        province: address.province,
        postalCode: '',
        country: 'Philippines',
        timezone: 'Asia/Manila',
        description: 'Pending clinic registration awaiting payment verification and approval.',
        status: 'pending',
        visibility: 'visible',
        isPrimaryClinic: true,
        dentistUserIds: [],
        staffUserIds: [],
        laboratoryIds: [],
        businessHours: defaultBusinessHours(),
        createdAt: registration.submittedDate || today(),
        updatedAt: registration.updatedDate || registration.submittedDate || today(),
        createdBy: 'registration',
        updatedBy: 'registration'
      };
    });
};

const syncUserClinicIds = () => {
  const assignments = readAssignments().filter(item => item.assignmentStatus === 'active');
  const users = readUsers().map(user => {
    const clinicIds = assignments.filter(item => item.userId === user.id).map(item => item.clinicId);
    return { ...user, clinicIds: Array.from(new Set(clinicIds.length ? clinicIds : user.clinicIds)), updatedAt: today() };
  });
  writeUsers(users);
};

const getLiveDentistsForClinic = (clinicId: string, _clinicName: string) => {
  const dentists = safeRead<Array<Record<string, unknown>>>('clinic_owner_associate_dentists_v1', []);
  return dentists.filter(d => {
    const clinicIds = Array.isArray(d.clinicIds) ? d.clinicIds : [];
    return clinicIds.includes(clinicId);
  }).map(d => String(d.id || d.associateNumber));
};

const getLiveStaffForClinic = (clinicId: string, _clinicName: string) => {
  const staff = safeRead<Array<Record<string, unknown>>>('pnj_mock_staff_members', []);
  return staff.filter(s => {
    const clinicIds = Array.isArray(s.clinicIds) ? s.clinicIds : [];
    return clinicIds.includes(clinicId);
  }).map(s => String(s.id || s.staffNumber));
};

const syncClinicAssignmentArrays = () => {
  const assignments = readAssignments().filter(item => item.assignmentStatus === 'active');
  const clinics = listNormalized().map(clinic => {
    const assignedDentists = assignments.filter(item => item.clinicId === clinic.id && item.assignmentRole === 'associate').map(item => item.userId);
    const assignedStaff = assignments.filter(item => item.clinicId === clinic.id && item.assignmentRole === 'staff').map(item => item.userId);
    const liveDentists = getLiveDentistsForClinic(clinic.id, clinic.name);
    const liveStaff = getLiveStaffForClinic(clinic.id, clinic.name);
    const combinedDentists = Array.from(new Set([...assignedDentists, ...liveDentists]));
    const combinedStaff = Array.from(new Set([...assignedStaff, ...liveStaff]));
    return {
      ...clinic,
      dentistUserIds: combinedDentists,
      staffUserIds: combinedStaff
    };
  });
  writeClinics(clinics);
  return clinics;
};

const ensureAssignment = (clinic: Clinic, userId: string | undefined, role: ClinicAssignmentRole, note = 'Seeded assignment') => {
  if (!userId) return;
  const assignments = readAssignments();
  if (assignments.some(item => item.clinicId === clinic.id && item.userId === userId && item.assignmentRole === role && item.assignmentStatus === 'active')) return;
  writeAssignments([{ id: makeId('CA'), subscriberId: clinic.subscriberId, clinicId: clinic.id, userId, assignmentRole: role, assignmentStatus: 'active', assignedAt: today(), assignedBy: 'system', note }, ...assignments]);
};

const seedExtraClinics = () => {
  const existing = listNormalized();
  const filtered = existing.filter(item => !item.id.startsWith('CLN-MOCK-'));
  if (filtered.length !== existing.length) {
    writeClinics(filtered);
  }
};

const planLimitForSubscriber = (subscriber: Subscriber | null): PlanLimit | null => {
  if (!subscriber) return null;
  const plan = mockPlanService.listPlans().find(item => [item.id, item.name, item.planCode].includes(subscriber.planId));
  return plan?.limits.find(item => item.key === 'clinics') || null;
};

const toClinic = (data: ClinicFormData, status: Clinic['status'], count: number): Clinic => ({
  id: makeId('CLN'),
  clinicNumber: `CLN-${String(count + 1).padStart(6, '0')}`,
  subscriberId: data.subscriberId,
  primaryOwnerUserId: data.primaryOwnerUserId || undefined,
  branchType: data.branchType,
  name: data.name.trim(),
  legalBusinessName: data.legalBusinessName.trim() || data.name.trim(),
  email: data.email.trim(),
  contactNumber: data.contactNumber.trim(),
  alternativeContactNumber: data.alternativeContactNumber.trim() || undefined,
  addressLine1: data.addressLine1.trim(),
  addressLine2: data.addressLine2.trim(),
  barangay: data.barangay.trim(),
  city: data.city.trim(),
  province: data.province.trim(),
  postalCode: data.postalCode.trim(),
  country: data.country.trim() || 'Philippines',
  timezone: data.timezone.trim() || 'Asia/Manila',
  description: data.description.trim(),
  logoMetadata: data.logoFileName ? { fileName: data.logoFileName, fileType: data.logoFileType || 'unknown', previewLabel: 'Mock logo placeholder' } : undefined,
  status,
  visibility: data.visibility,
  isPrimaryClinic: data.isPrimaryClinic,
  dentistUserIds: data.dentistUserIds,
  staffUserIds: data.staffUserIds,
  laboratoryIds: [],
  businessHours: data.businessHours,
  createdAt: today(),
  updatedAt: today(),
  activatedAt: status === 'active' ? today() : undefined,
  createdBy: 'platform_owner',
  updatedBy: 'platform_owner'
});

export const mockClinicService = {
  initializeClinics: () => {
    const clinics = listNormalized();
    seedExtraClinics();
    mockClinicService.reconcileClinicAssignments();
    mockClinicService.reconcileSubscriberClinicCounts();
    return clinics.length ? mockClinicService.listClinics() : syncClinicAssignmentArrays();
  },
  listClinics: () => {
    const persisted = syncClinicAssignmentArrays();
    return [...persisted, ...pendingRegistrationClinics(persisted)];
  },
  getClinicById: (id: string) => mockClinicService.listClinics().find(item => item.id === id || item.clinicNumber === id) || null,
  getClinicsBySubscriberId: (subscriberId: string) => mockClinicService.listClinics().filter(item => item.subscriberId === subscriberId),
  getClinicsByUserId: (userId: string) => mockClinicService.listClinics().filter(item => activeAssignmentsFor(item.id).some(assignment => assignment.userId === userId)),
  getClinicHistory: (clinicId: string) => readHistory().filter(item => item.clinicId === clinicId),
  getClinicAssignments: (clinicId: string) => readAssignments().filter(item => item.clinicId === clinicId),
  getClinicUsers: (clinicId: string) => activeAssignmentsFor(clinicId).map(item => readUsers().find(user => user.id === item.userId)).filter(Boolean) as PlatformUser[],
  getClinicDentists: (clinicId: string) => activeAssignmentsFor(clinicId, 'associate').map(item => readUsers().find(user => user.id === item.userId)).filter(Boolean) as PlatformUser[],
  getClinicStaff: (clinicId: string) => activeAssignmentsFor(clinicId, 'staff').map(item => readUsers().find(user => user.id === item.userId)).filter(Boolean) as PlatformUser[],
  getClinicLaboratories: () => [],
  validateClinicOwnership: (subscriberId: string) => validateClinicOwnership(subscriberFor(subscriberId), mockSubscriptionService.getCurrentSubscriptionBySubscriberId(subscriberId)),
  validateClinicLimit: (subscriberId: string, currentClinicId?: string, allowPendingOverride = false) => {
    const subscriber = subscriberFor(subscriberId);
    const limit = planLimitForSubscriber(subscriber);
    const recordUsage = mockClinicService.getClinicsBySubscriberId(subscriberId).filter(item => item.id !== currentClinicId && clinicUsageCountingStatuses.includes(item.status)).length;
    const usage = Math.max(recordUsage, currentClinicId ? 0 : subscriber?.clinicCount || 0);
    if (!limit) return { valid: false, message: 'Plan clinic limit could not be resolved.', limitLabel: 'Unknown', limitValue: 'pending' as const, usage, remaining: 'pending' as const };
    if (limit.type === 'not_included') return { valid: false, message: 'Clinics are not included in the assigned plan.', limitLabel: limit.label, limitValue: 'not_included' as const, usage, remaining: 0 };
    if (limit.type === 'pending') return { valid: allowPendingOverride, warning: 'Clinic limit is pending product decision; prototype override was used.', limitLabel: limit.label, limitValue: 'pending' as const, usage, remaining: 'pending' as const };
    if (limit.type === 'unlimited') return { valid: true, limitLabel: limit.label, limitValue: 'unlimited' as const, usage, remaining: 'unlimited' as const };
    const remaining = Math.max(0, (limit.value || 0) - usage);
    return remaining > 0 ? { valid: true, limitLabel: limit.label, limitValue: limit.value || 0, usage, remaining } : { valid: false, message: 'This subscriber has reached the plan clinic limit.', limitLabel: limit.label, limitValue: limit.value || 0, usage, remaining };
  },
  createClinic: (data: ClinicFormData, draft = false, allowPendingOverride = false): ClinicResult<Clinic> => {
    const clinics = mockClinicService.listClinics();
    const validation = validateClinicForm(data, clinics);
    if (!validation.valid) return { ok: false, error: validation.message };
    const ownership = draft ? { valid: true } : mockClinicService.validateClinicOwnership(data.subscriberId);
    if (!ownership.valid) return { ok: false, error: ownership.message };
    const limit = mockClinicService.validateClinicLimit(data.subscriberId, undefined, allowPendingOverride);
    if (!limit.valid && !draft) return { ok: false, error: limit.message || limit.warning };
    const clinic = toClinic(data, draft ? 'draft' : 'active', clinics.length);
    writeClinics([clinic, ...clinics]);
    if (clinic.isPrimaryClinic) mockClinicService.setPrimaryClinic(clinic.id, true);
    if (clinic.primaryOwnerUserId) mockClinicService.assignUserToClinic(clinic.id, clinic.primaryOwnerUserId, 'clinic_owner', 'Primary administrator');
    data.dentistUserIds.forEach(userId => mockClinicService.assignUserToClinic(clinic.id, userId, 'associate', 'Initial dentist assignment'));
    data.staffUserIds.forEach(userId => mockClinicService.assignUserToClinic(clinic.id, userId, 'staff', 'Initial staff assignment'));
    addHistory(clinic, draft ? 'Created Draft' : 'Created', `${clinic.clinicNumber} was ${draft ? 'saved as draft' : 'created'}.`);
    if (limit.warning) logActivity('Clinic Limit Override', `${clinic.clinicNumber}: ${limit.warning}`);
    mockClinicService.reconcileSubscriberClinicCounts();
    return { ok: true, data: mockClinicService.getClinicById(clinic.id) || clinic, warning: limit.warning };
  },
  updateClinic: (clinicId: string, data: ClinicFormData): ClinicResult<Clinic> => {
    const clinics = mockClinicService.listClinics();
    const target = clinics.find(item => item.id === clinicId);
    if (!target) return { ok: false, error: 'Clinic not found.' };
    const validation = validateClinicForm({ ...data, subscriberId: target.subscriberId, primaryOwnerUserId: target.primaryOwnerUserId || '' }, clinics, target.id);
    if (!validation.valid) return { ok: false, error: validation.message };
    const updated: Clinic = { ...target, ...toClinic({ ...data, subscriberId: target.subscriberId, primaryOwnerUserId: target.primaryOwnerUserId || '', isPrimaryClinic: target.isPrimaryClinic, dentistUserIds: target.dentistUserIds, staffUserIds: target.staffUserIds }, target.status, clinics.length), id: target.id, clinicNumber: target.clinicNumber, createdAt: target.createdAt, createdBy: target.createdBy, status: target.status, activatedAt: target.activatedAt, archivedAt: target.archivedAt, updatedAt: today(), updatedBy: 'platform_owner' };
    writeClinics(clinics.map(item => item.id === target.id ? updated : item));
    addHistory(updated, 'Updated', `${updated.clinicNumber} editable fields were updated.`);
    return { ok: true, data: updated };
  },
  activateClinic: (clinicId: string): ClinicResult<Clinic> => {
    const clinic = mockClinicService.getClinicById(clinicId);
    if (!clinic) return { ok: false, error: 'Clinic not found.' };
    const ready = validateActivationReadiness(clinic);
    if (!ready.valid) return { ok: false, error: ready.message };
    const ownership = mockClinicService.validateClinicOwnership(clinic.subscriberId);
    if (!ownership.valid) return { ok: false, error: ownership.message };
    const limit = mockClinicService.validateClinicLimit(clinic.subscriberId, clinic.id);
    if (!limit.valid) return { ok: false, error: limit.message || limit.warning };
    return mockClinicService.setStatus(clinic.id, 'active', 'Activated', { activatedAt: today(), deactivatedAt: undefined, deactivationReason: undefined });
  },
  deactivateClinic: (clinicId: string, reason: string): ClinicResult<Clinic> => {
    if (!reason.trim()) return { ok: false, error: 'Deactivation reason is required.' };
    return mockClinicService.setStatus(clinicId, 'inactive', 'Deactivated', { deactivatedAt: today(), deactivationReason: reason });
  },
  archiveClinic: (clinicId: string, reason: string): ClinicResult<Clinic> => {
    if (!reason.trim()) return { ok: false, error: 'Archive reason is required.' };
    const clinic = mockClinicService.getClinicById(clinicId);
    if (!clinic) return { ok: false, error: 'Clinic not found.' };
    const activeSiblings = mockClinicService.getClinicsBySubscriberId(clinic.subscriberId).filter(item => item.id !== clinic.id && item.status === 'active');
    const updated = mockClinicService.setStatus(clinicId, 'archived', 'Archived', { archivedAt: today(), archiveReason: reason, isPrimaryClinic: clinic.isPrimaryClinic && activeSiblings.length ? false : clinic.isPrimaryClinic });
    if (clinic.isPrimaryClinic && activeSiblings[0]) mockClinicService.setPrimaryClinic(activeSiblings[0].id, true);
    return updated;
  },
  restoreClinic: (clinicId: string, allowPendingOverride = false): ClinicResult<Clinic> => {
    const clinic = mockClinicService.getClinicById(clinicId);
    if (!clinic) return { ok: false, error: 'Clinic not found.' };
    if (clinic.status !== 'archived') return { ok: false, error: 'Only archived clinics can be restored.' };
    const subscriber = subscriberFor(clinic.subscriberId);
    if (!subscriber || subscriber.accountStatus !== 'active') return { ok: false, error: 'Restore requires an active subscriber.' };
    const limit = mockClinicService.validateClinicLimit(clinic.subscriberId, clinic.id, allowPendingOverride);
    if (!limit.valid) return { ok: false, error: limit.message || limit.warning };
    return mockClinicService.setStatus(clinicId, 'inactive', 'Restored', { archivedAt: undefined, archiveReason: undefined });
  },
  setStatus: (clinicId: string, status: Clinic['status'], action: string, patch: Partial<Clinic> = {}): ClinicResult<Clinic> => {
    const clinics = mockClinicService.listClinics();
    const target = clinics.find(item => item.id === clinicId);
    if (!target) return { ok: false, error: 'Clinic not found.' };
    const updated = { ...target, ...patch, status, updatedAt: today(), updatedBy: 'platform_owner' };
    writeClinics(clinics.map(item => item.id === target.id ? updated : item));
    addHistory(updated, action, `${updated.clinicNumber} was ${action.toLowerCase()}.`, target.status, status);
    mockClinicService.reconcileSubscriberClinicCounts();
    return { ok: true, data: updated };
  },
  permanentlyDeleteClinic: (clinicId: string): ClinicResult<boolean> => {
    const clinics = mockClinicService.listClinics();
    const target = clinics.find(item => item.id === clinicId || item.clinicNumber === clinicId);
    if (!target) return { ok: false, error: 'Clinic not found.' };
    if (target.isPrimaryClinic && clinics.filter(c => c.subscriberId === target.subscriberId).length > 1) {
      return { ok: false, error: 'Cannot delete the primary headquarters branch while secondary branches exist. Please reassign the primary clinic first.' };
    }

    // 1. Blacklist clinic to prevent re-seeding
    const deleted = safeRead<string[]>(DELETED_CLINICS_KEY, []);
    const keysToAdd = [target.id, target.clinicNumber, target.name.trim().toLowerCase()].filter(Boolean);
    safeWrite(DELETED_CLINICS_KEY, Array.from(new Set([...deleted, ...keysToAdd])));

    // 2. Remove from raw clinics storage
    const rawClinics = safeRead<Array<Record<string, unknown>>>(CLINICS_KEY, []);
    const remaining = rawClinics.filter(item => 
      item.id !== target.id && 
      item.clinicNumber !== target.clinicNumber &&
      String(item.name || '').trim().toLowerCase() !== target.name.trim().toLowerCase()
    );
    safeWrite(CLINICS_KEY, remaining);

    // 3. Remove assignments
    const assignments = readAssignments().filter(item => item.clinicId !== target.id && item.clinicId !== target.clinicNumber);
    writeAssignments(assignments);
    syncUserClinicIds();

    addHistory(target, 'Clinic Deleted Permanently', `${target.clinicNumber} (${target.name}) was permanently deleted from the system.`);
    mockClinicService.reconcileSubscriberClinicCounts();
    return { ok: true, data: true };
  },
  assignUserToClinic: (clinicId: string, userId: string, role: ClinicAssignmentRole, note = ''): ClinicResult<ClinicAssignment> => {
    const clinic = mockClinicService.getClinicById(clinicId);
    const user = readUsers().find(item => item.id === userId) || null;
    if (!clinic) return { ok: false, error: 'Clinic not found.' };
    if (clinic.status === 'archived') return { ok: false, error: 'Archived clinics cannot receive new assignments.' };
    const validation = validateUserAssignment(user, clinic.subscriberId, role);
    if (!validation.valid) return { ok: false, error: validation.message };
    const assignments = readAssignments();
    const existing = assignments.find(item => item.clinicId === clinic.id && item.userId === userId && item.assignmentRole === role && item.assignmentStatus === 'active');
    if (existing) return { ok: false, error: 'This user already has an active assignment for this clinic.' };
    const assignment: ClinicAssignment = { id: makeId('CA'), subscriberId: clinic.subscriberId, clinicId: clinic.id, userId, assignmentRole: role, assignmentStatus: 'active', assignedAt: today(), assignedBy: 'platform_owner', note };
    writeAssignments([assignment, ...assignments]);
    if (role === 'clinic_owner' && !clinic.primaryOwnerUserId) mockClinicService.changePrimaryAdministrator(clinic.id, userId, 'Assigned as administrator');
    syncUserClinicIds();
    syncClinicAssignmentArrays();
    addHistory(clinic, 'User Assigned', `${user!.fullName} assigned as ${role.replace('_', ' ')} to ${clinic.clinicNumber}.`);
    mockClinicService.reconcileSubscriberClinicCounts();
    return { ok: true, data: assignment };
  },
  removeUserFromClinic: (assignmentId: string, reason = ''): ClinicResult<ClinicAssignment> => {
    const assignments = readAssignments();
    const assignment = assignments.find(item => item.id === assignmentId);
    if (!assignment) return { ok: false, error: 'Assignment not found.' };
    const clinic = mockClinicService.getClinicById(assignment.clinicId);
    if (!clinic) return { ok: false, error: 'Clinic not found.' };
    if (assignment.assignmentRole === 'clinic_owner' && clinic.primaryOwnerUserId === assignment.userId) return { ok: false, error: 'Choose a replacement administrator before removing the primary Clinic Owner.' };
    const updated = { ...assignment, assignmentStatus: 'removed' as const, removedAt: today(), removedBy: 'platform_owner', removalReason: reason };
    writeAssignments(assignments.map(item => item.id === assignment.id ? updated : item));
    syncUserClinicIds();
    syncClinicAssignmentArrays();
    addHistory(clinic, 'User Removed', `Assignment ${assignment.id} was removed${reason ? `. Reason: ${reason}` : '.'}`);
    mockClinicService.reconcileSubscriberClinicCounts();
    return { ok: true, data: updated };
  },
  setPrimaryClinic: (clinicId: string, silent = false): ClinicResult<Clinic> => {
    const clinics = mockClinicService.listClinics();
    const target = clinics.find(item => item.id === clinicId);
    if (!target) return { ok: false, error: 'Clinic not found.' };
    if (target.status === 'archived') return { ok: false, error: 'Archived clinics cannot become primary.' };
    const updated = clinics.map(item => item.subscriberId === target.subscriberId ? { ...item, isPrimaryClinic: item.id === target.id, updatedAt: today() } : item);
    writeClinics(updated);
    const primary = updated.find(item => item.id === target.id)!;
    const subscribers = readSubscribers().map(item => item.id === primary.subscriberId ? { ...item, primaryClinicName: primary.name, updatedAt: today() } : item);
    writeSubscribers(subscribers);
    if (!silent) addHistory(primary, 'Primary Clinic Changed', `${primary.clinicNumber} is now the primary clinic.`);
    return { ok: true, data: primary };
  },
  changePrimaryAdministrator: (clinicId: string, userId: string, note = ''): ClinicResult<Clinic> => {
    const clinics = mockClinicService.listClinics();
    const clinic = clinics.find(item => item.id === clinicId);
    const user = readUsers().find(item => item.id === userId) || null;
    if (!clinic) return { ok: false, error: 'Clinic not found.' };
    const validation = validateUserAssignment(user, clinic.subscriberId, 'clinic_owner');
    if (!validation.valid) return { ok: false, error: validation.message };
    const updated = { ...clinic, primaryOwnerUserId: userId, updatedAt: today(), updatedBy: 'platform_owner' };
    writeClinics(clinics.map(item => item.id === clinic.id ? updated : item));
    const activeOwner = readAssignments().some(item => item.clinicId === clinic.id && item.userId === userId && item.assignmentRole === 'clinic_owner' && item.assignmentStatus === 'active');
    if (!activeOwner) mockClinicService.assignUserToClinic(clinic.id, userId, 'clinic_owner', note || 'Primary administrator change');
    addHistory(updated, 'Administrator Changed', `${user!.fullName} is now primary administrator for ${clinic.clinicNumber}.`);
    return { ok: true, data: updated };
  },
  reconcileClinicAssignments: () => {
    const clinics = listNormalized();
    clinics.forEach(clinic => {
      ensureAssignment(clinic, clinic.primaryOwnerUserId, 'clinic_owner');
      readUsers().filter(user => user.clinicIds.includes(clinic.id)).forEach(user => ensureAssignment(clinic, user.id, user.role === 'associate' ? 'associate' : user.role === 'staff' ? 'staff' : 'clinic_owner'));
    });
    syncUserClinicIds();
    return syncClinicAssignmentArrays();
  },
  reconcileSubscriberClinicCounts: () => {
    const clinics = mockClinicService.listClinics();
    const assignments = readAssignments().filter(item => item.assignmentStatus === 'active');
    const subscribers = readSubscribers().map(subscriber => {
      const owned = clinics.filter(item => item.subscriberId === subscriber.id && item.status !== 'archived');
      const userIds = new Set(assignments.filter(item => item.subscriberId === subscriber.id).map(item => item.userId));
      const users = readUsers().filter(user => userIds.has(user.id));
      return { ...subscriber, clinicCount: owned.length, associateCount: users.filter(user => user.role === 'associate').length, staffCount: users.filter(user => user.role === 'staff').length, updatedAt: today() };
    });
    writeSubscribers(subscribers);
    return subscribers;
  },
  searchClinics: (records: Clinic[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    const subscribers = readSubscribers();
    return records.filter(item => [item.clinicNumber, item.name, item.legalBusinessName, item.email, item.city, item.province, subscribers.find(sub => sub.id === item.subscriberId)?.businessName].some(value => String(value || '').toLowerCase().includes(term)));
  },
  filterClinics: (records: Clinic[], filters: ClinicFilters) => {
    let next = mockClinicService.searchClinics(records, filters.search);
    if (filters.tab !== 'all') next = next.filter(item => item.status === filters.tab);
    if (filters.subscriberId !== 'all') next = next.filter(item => item.subscriberId === filters.subscriberId);
    if (filters.status !== 'all') next = next.filter(item => item.status === filters.status);
    if (filters.primary !== 'all') next = next.filter(item => String(item.isPrimaryClinic) === filters.primary);
    if (filters.province) next = next.filter(item => item.province.toLowerCase().includes(filters.province.toLowerCase()));
    if (filters.city) next = next.filter(item => item.city.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.dentistAssignment === 'with') next = next.filter(item => item.dentistUserIds.length > 0);
    if (filters.dentistAssignment === 'without') next = next.filter(item => item.dentistUserIds.length === 0);
    if (filters.staffAssignment === 'with') next = next.filter(item => item.staffUserIds.length > 0);
    if (filters.staffAssignment === 'without') next = next.filter(item => item.staffUserIds.length === 0);
    if (filters.createdDate) next = next.filter(item => item.createdAt === filters.createdDate);
    return next;
  },
  sortClinics: (records: Clinic[], sort: ClinicSort) => [...records].sort((a, b) => String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? '')) * (sort.direction === 'asc' ? 1 : -1)),
  paginateClinics: (records: Clinic[], page: number, pageSize: number) => records.slice((page - 1) * pageSize, page * pageSize),
  getClinicSummary: () => {
    const clinics = mockClinicService.listClinics();
    return { total: clinics.length, active: clinics.filter(item => item.status === 'active').length, draft: clinics.filter(item => item.status === 'draft').length, inactive: clinics.filter(item => item.status === 'inactive').length, archived: clinics.filter(item => item.status === 'archived').length, primary: clinics.filter(item => item.isPrimaryClinic).length, withoutDentists: clinics.filter(item => item.dentistUserIds.length === 0 && item.status !== 'archived').length, withoutStaff: clinics.filter(item => item.staffUserIds.length === 0 && item.status !== 'archived').length };
  },
  toFormData: (clinic?: Clinic): ClinicFormData => ({
    subscriberId: clinic?.subscriberId || '',
    primaryOwnerUserId: clinic?.primaryOwnerUserId || '',
    branchType: clinic?.branchType || 'main',
    isPrimaryClinic: Boolean(clinic?.isPrimaryClinic),
    name: clinic?.name || '',
    legalBusinessName: clinic?.legalBusinessName || '',
    email: clinic?.email || '',
    contactNumber: clinic?.contactNumber || '',
    alternativeContactNumber: clinic?.alternativeContactNumber || '',
    addressLine1: clinic?.addressLine1 || '',
    addressLine2: clinic?.addressLine2 || '',
    barangay: clinic?.barangay || '',
    city: clinic?.city || '',
    province: clinic?.province || '',
    postalCode: clinic?.postalCode || '',
    country: clinic?.country || 'Philippines',
    timezone: clinic?.timezone || 'Asia/Manila',
    description: clinic?.description || '',
    logoFileName: clinic?.logoMetadata?.fileName || '',
    logoFileType: clinic?.logoMetadata?.fileType || '',
    visibility: clinic?.visibility || 'visible',
    businessHours: clinic?.businessHours || defaultBusinessHours(),
    dentistUserIds: clinic?.dentistUserIds || [],
    staffUserIds: clinic?.staffUserIds || []
  })
};
