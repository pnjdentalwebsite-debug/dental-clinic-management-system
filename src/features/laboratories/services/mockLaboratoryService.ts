import type { ActivityLogLike, RegistrationLike, Subscriber } from '../../platformManagement/types';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockClinicService, defaultBusinessHours } from '../../clinics/services/mockClinicService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import type { Clinic } from '../../clinics/types';
import type { PlanLimit } from '../../plans/types';
import type { ClinicLaboratoryConnection, Laboratory, LaboratoryFilters, LaboratoryFormData, LaboratoryHistoryRecord, LaboratoryLimitResult, LaboratoryResult, LaboratoryService, LaboratorySort } from '../types';
import { detectDuplicateLaboratory, laboratoryUsageCountingStatuses, validateActivationReadiness, validateClinicConnection, validateLaboratoryForm, validateLaboratoryOwnership, validateServiceForm } from '../validation/laboratoryValidation';

const LABS_KEY = 'pnj_mock_laboratories';
const SERVICES_KEY = 'pnj_mock_laboratory_services';
const CONNECTIONS_KEY = 'pnj_mock_clinic_laboratory_connections';
const HISTORY_KEY = 'pnj_mock_laboratory_history';
const SUBSCRIBERS_KEY = 'pnj_mock_subscribers';
const ACTIVITY_KEY = 'pnj_mock_activity_logs';
const DELETED_LABS_KEY = 'pnj_mock_deleted_laboratories';
const REGISTRATIONS_KEY = 'pnj_mock_registrations';

const today = () => new Date().toISOString().split('T')[0];
const nowText = () => new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const format = (value: string) => value.replaceAll('_', ' ');

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
const getDeletedLabKeys = (): string[] => safeRead<string[]>(DELETED_LABS_KEY, []).map(s => String(s || '').toLowerCase());
const readLabs = () => {
  const deleted = getDeletedLabKeys();
  const labs = safeRead<Laboratory[]>(LABS_KEY, []);
  return labs.filter(l => 
    !deleted.includes(String(l.id || '').toLowerCase()) && 
    !deleted.includes(String(l.laboratoryNumber || '').toLowerCase()) &&
    !deleted.includes(String(l.name || '').trim().toLowerCase())
  );
};
const writeLabs = (records: Laboratory[]) => safeWrite(LABS_KEY, records);
const readServices = () => safeRead<LaboratoryService[]>(SERVICES_KEY, []);
const writeServices = (records: LaboratoryService[]) => safeWrite(SERVICES_KEY, records);
const readConnections = () => safeRead<ClinicLaboratoryConnection[]>(CONNECTIONS_KEY, []);
const writeConnections = (records: ClinicLaboratoryConnection[]) => safeWrite(CONNECTIONS_KEY, records);
const readHistory = () => safeRead<LaboratoryHistoryRecord[]>(HISTORY_KEY, []);
const writeHistory = (records: LaboratoryHistoryRecord[]) => safeWrite(HISTORY_KEY, records);
const readSubscribers = () => safeRead<Subscriber[]>(SUBSCRIBERS_KEY, []);
const writeSubscribers = (records: Subscriber[]) => safeWrite(SUBSCRIBERS_KEY, records);

const logActivity = (event: string, details: string) => {
  const logs = safeRead<ActivityLogLike[]>(ACTIVITY_KEY, []);
  safeWrite(ACTIVITY_KEY, [{ id: makeId('LOG'), timestamp: nowText(), event, details, role: 'platform_owner' }, ...logs]);
};

const addHistory = (laboratory: Laboratory, action: string, details: string, previousStatus?: string, nextStatus?: string) => {
  writeHistory([{ id: makeId('LH'), laboratoryId: laboratory.id, action, details, createdAt: nowText(), actor: 'platform_owner', previousStatus: previousStatus as LaboratoryHistoryRecord['previousStatus'], nextStatus: nextStatus as LaboratoryHistoryRecord['nextStatus'] }, ...readHistory()]);
  logActivity(`Laboratory ${action}`, details);
};

const subscriberFor = (id?: string) => id ? mockPlatformManagementService.getSubscriberById(id) : null;
const planLimitForSubscriber = (subscriber: Subscriber | null): PlanLimit | null => {
  if (!subscriber) return null;
  const plan = mockPlanService.listPlans().find(item => [item.id, item.name, item.planCode].includes(subscriber.planId));
  return plan?.limits.find(item => item.key === 'laboratories') || null;
};

const normalizeLab = (record: Partial<Laboratory>, index: number): Laboratory | null => {
  if (!record.id || !record.subscriberId) return null;
  const status = ['draft', 'pending', 'active', 'inactive', 'archived'].includes(String(record.status)) ? record.status as Laboratory['status'] : 'active';
  return {
    id: String(record.id),
    laboratoryNumber: String(record.laboratoryNumber || `LAB-${String(index + 1).padStart(6, '0')}`),
    subscriberId: String(record.subscriberId),
    name: String(record.name || 'Mock Dental Laboratory'),
    legalBusinessName: String(record.legalBusinessName || record.name || 'Mock Dental Laboratory'),
    laboratoryType: ['internal', 'external', 'partner', 'independent'].includes(String(record.laboratoryType)) ? record.laboratoryType as Laboratory['laboratoryType'] : 'external',
    email: String(record.email || 'lab@example.com'),
    contactNumber: String(record.contactNumber || '09170000000'),
    alternativeContactNumber: record.alternativeContactNumber || '',
    contactPersonName: String(record.contactPersonName || 'Laboratory Coordinator'),
    contactPersonPosition: String(record.contactPersonPosition || 'Coordinator'),
    addressLine1: String(record.addressLine1 || 'Mock laboratory address'),
    addressLine2: record.addressLine2 || '',
    barangay: record.barangay || '',
    city: String(record.city || 'Manila'),
    province: String(record.province || 'Metro Manila'),
    postalCode: record.postalCode || '1000',
    country: String(record.country || 'Philippines'),
    timezone: String(record.timezone || 'Asia/Manila'),
    description: record.description || '',
    logoMetadata: record.logoMetadata,
    status,
    visibility: record.visibility === 'hidden' ? 'hidden' : 'visible',
    serviceArea: String(record.serviceArea || 'Metro Manila'),
    defaultTurnaroundDays: Number(record.defaultTurnaroundDays || 7),
    rushTurnaroundDays: Number(record.rushTurnaroundDays || 3),
    acceptsRushOrders: Boolean(record.acceptsRushOrders ?? true),
    clinicIds: Array.isArray(record.clinicIds) ? record.clinicIds.map(String) : [],
    serviceIds: Array.isArray(record.serviceIds) ? record.serviceIds.map(String) : [],
    businessHours: record.businessHours || defaultBusinessHours(),
    createdAt: String(record.createdAt || today()),
    updatedAt: String(record.updatedAt || today()),
    activatedAt: record.activatedAt || (status === 'active' ? today() : undefined),
    deactivatedAt: record.deactivatedAt,
    archivedAt: record.archivedAt || (status === 'archived' ? today() : undefined),
    createdBy: String(record.createdBy || 'system'),
    updatedBy: String(record.updatedBy || 'system'),
    deactivationReason: record.deactivationReason,
    archiveReason: record.archiveReason
  };
};

const toLaboratory = (data: LaboratoryFormData, status: Laboratory['status'], count: number): Laboratory => ({
  id: makeId('LAB'),
  laboratoryNumber: `LAB-${String(count + 1).padStart(6, '0')}`,
  subscriberId: data.subscriberId,
  name: data.name.trim(),
  legalBusinessName: data.legalBusinessName.trim() || data.name.trim(),
  laboratoryType: data.laboratoryType,
  email: data.email.trim(),
  contactNumber: data.contactNumber.trim(),
  alternativeContactNumber: data.alternativeContactNumber.trim() || undefined,
  contactPersonName: data.contactPersonName.trim(),
  contactPersonPosition: data.contactPersonPosition.trim(),
  addressLine1: data.addressLine1.trim(),
  addressLine2: data.addressLine2.trim(),
  barangay: data.barangay.trim(),
  city: data.city.trim(),
  province: data.province.trim(),
  postalCode: data.postalCode.trim(),
  country: data.country.trim() || 'Philippines',
  timezone: data.timezone.trim() || 'Asia/Manila',
  description: data.description.trim(),
  logoMetadata: data.logoFileName
    ? {
        fileName: data.logoFileName,
        fileType: data.logoFileType || 'unknown',
        previewLabel: data.logoFileName,
        previewUrl: data.logoPreviewUrl || undefined
      }
    : undefined,
  status,
  visibility: data.visibility,
  serviceArea: data.serviceArea.trim(),
  defaultTurnaroundDays: data.defaultTurnaroundDays,
  rushTurnaroundDays: data.rushTurnaroundDays,
  acceptsRushOrders: data.acceptsRushOrders,
  clinicIds: [],
  serviceIds: [],
  businessHours: data.businessHours,
  createdAt: today(),
  updatedAt: today(),
  activatedAt: status === 'active' ? today() : undefined,
  createdBy: 'platform_owner',
  updatedBy: 'platform_owner'
});

const makeServiceFromInput = (laboratoryId: string, input: LaboratoryFormData['initialServices'][number]): LaboratoryService => ({
  id: input.id || makeId('LBS'),
  laboratoryId,
  serviceCode: input.serviceCode.trim(),
  name: input.name.trim(),
  category: input.category,
  description: input.description.trim(),
  defaultPrice: input.defaultPrice === '' ? undefined : Number(input.defaultPrice),
  currency: 'PHP',
  defaultTurnaroundDays: input.defaultTurnaroundDays,
  rushAvailable: input.rushAvailable,
  rushAdditionalDays: input.rushAdditionalDays,
  rushFee: input.rushFee === '' ? undefined : Number(input.rushFee),
  status: input.status,
  createdAt: today(),
  updatedAt: today(),
  archivedAt: input.status === 'archived' ? today() : undefined
});

const activeConnectionFor = (clinicId: string, laboratoryId: string) => readConnections().find(item => item.clinicId === clinicId && item.laboratoryId === laboratoryId && item.status === 'active');

export const mockLaboratoryService = {
  initializeLaboratories: () => {
    // 1. Purge synthetic mockup labs
    const rawLabs = readLabs().filter(l =>
      !String(l.id || '').startsWith('LAB-MOCK-') &&
      !String(l.email || '').includes('@example.com') &&
      l.id !== 'LAB-WESMILE-001'
    );
    writeLabs(rawLabs.map(normalizeLab).filter(Boolean) as Laboratory[]);

    // 2. Clean services
    const currentServices = readServices().filter(s =>
      !s.laboratoryId.startsWith('LAB-MOCK-') &&
      s.laboratoryId !== 'LAB-WESMILE-001'
    );
    writeServices(currentServices);

    // 3. Clean connections
    const connections = readConnections().filter(c =>
      !c.laboratoryId.startsWith('LAB-MOCK-') &&
      c.laboratoryId !== 'LAB-WESMILE-001'
    );
    writeConnections(connections);

    mockLaboratoryService.reconcileClinicLaboratoryConnections();
    mockLaboratoryService.reconcileSubscriberLaboratoryCounts();
    return mockLaboratoryService.listLaboratories();
  },
  listLaboratories: () => {
    const labs = readLabs().map(normalizeLab).filter(Boolean) as Laboratory[];
    const connections = readConnections().filter(item => item.status === 'active');
    const services = readServices().filter(item => item.status !== 'archived');
    const synced = labs.map(lab => ({ ...lab, clinicIds: connections.filter(item => item.laboratoryId === lab.id).map(item => item.clinicId), serviceIds: services.filter(item => item.laboratoryId === lab.id).map(item => item.id) }));
    writeLabs(synced);
    return synced;
  },
  getLaboratoryById: (id: string) => mockLaboratoryService.listLaboratories().find(item => item.id === id || item.laboratoryNumber === id) || null,
  getLaboratoriesBySubscriberId: (subscriberId: string) => mockLaboratoryService.listLaboratories().filter(item => item.subscriberId === subscriberId),
  getLaboratoriesByClinicId: (clinicId: string) => mockLaboratoryService.getClinicLaboratories(clinicId).map(row => row.laboratory),
  getLaboratoryHistory: (laboratoryId: string) => readHistory().filter(item => item.laboratoryId === laboratoryId),
  getLaboratoryConnections: (laboratoryId: string) => readConnections().filter(item => item.laboratoryId === laboratoryId),
  getConnectionById: (connectionId: string) => readConnections().find(item => item.id === connectionId) || null,
  getLaboratoryClinics: (laboratoryId: string) => readConnections().filter(item => item.laboratoryId === laboratoryId).map(connection => ({ connection, clinic: mockClinicService.getClinicById(connection.clinicId) })).filter(item => item.clinic) as { connection: ClinicLaboratoryConnection; clinic: Clinic }[],
  getClinicLaboratories: (clinicId: string) => readConnections().filter(item => item.clinicId === clinicId).map(connection => ({ connection, laboratory: mockLaboratoryService.getLaboratoryById(connection.laboratoryId) })).filter(item => item.laboratory) as { connection: ClinicLaboratoryConnection; laboratory: Laboratory }[],
  getLaboratoryServices: (laboratoryId: string) => readServices().filter(item => item.laboratoryId === laboratoryId),
  validateLaboratoryOwnership: (subscriberId: string) => validateLaboratoryOwnership(subscriberFor(subscriberId), mockSubscriptionService.getCurrentSubscriptionBySubscriberId(subscriberId)),
  validateLaboratoryLimit: (subscriberId: string, currentLaboratoryId?: string, allowPendingOverride = false): LaboratoryLimitResult => {
    const subscriber = subscriberFor(subscriberId);
    const limit = planLimitForSubscriber(subscriber);
    const usage = mockLaboratoryService.getLaboratoriesBySubscriberId(subscriberId).filter(item => item.id !== currentLaboratoryId && laboratoryUsageCountingStatuses.includes(item.status)).length;
    if (!limit) return { valid: false, message: 'Plan laboratory limit could not be resolved.', limitLabel: 'Unknown', limitValue: 'pending', usage, remaining: 'pending' };
    if (limit.type === 'not_included') return { valid: false, message: 'Laboratories are not included in the assigned plan.', limitLabel: limit.label, limitValue: 'not_included', usage, remaining: 0 };
    if (limit.type === 'pending') return { valid: allowPendingOverride, warning: 'Laboratory limit is pending product decision; prototype override was used.', limitLabel: limit.label, limitValue: 'pending', usage, remaining: 'pending' };
    if (limit.type === 'unlimited') return { valid: true, limitLabel: limit.label, limitValue: 'unlimited', usage, remaining: 'unlimited' };
    const remaining = Math.max(0, (limit.value || 0) - usage);
    return remaining > 0 ? { valid: true, limitLabel: limit.label, limitValue: limit.value || 0, usage, remaining } : { valid: false, message: 'This subscriber has reached the plan laboratory limit.', limitLabel: limit.label, limitValue: limit.value || 0, usage, remaining };
  },
  validateLaboratoryOwnershipCompatibility: (laboratoryId: string, clinicId: string) => {
    const laboratory = mockLaboratoryService.getLaboratoryById(laboratoryId);
    const clinic = mockClinicService.getClinicById(clinicId);
    return validateClinicConnection(laboratory, clinic, readConnections());
  },
  detectDuplicateLaboratory: (data: LaboratoryFormData, currentLaboratoryId?: string) => detectDuplicateLaboratory(data, mockLaboratoryService.listLaboratories(), currentLaboratoryId),
  createLaboratory: (data: LaboratoryFormData, draft = false, allowPendingOverride = false): LaboratoryResult<Laboratory> => {
    const labs = mockLaboratoryService.listLaboratories();
    const clinics = mockClinicService.listClinics();
    const validation = validateLaboratoryForm(data, labs, clinics);
    if (!validation.valid) return { ok: false, error: validation.message };
    const ownership = draft ? { valid: true } : mockLaboratoryService.validateLaboratoryOwnership(data.subscriberId);
    if (!ownership.valid) return { ok: false, error: ownership.message };
    const limit = mockLaboratoryService.validateLaboratoryLimit(data.subscriberId, undefined, allowPendingOverride);
    if (!limit.valid && !draft) return { ok: false, error: limit.message || limit.warning };
    const lab = toLaboratory(data, draft ? 'draft' : 'active', labs.length);
    writeLabs([lab, ...labs]);
    data.initialServices.filter(item => item.name.trim()).forEach(item => mockLaboratoryService.createLaboratoryService(lab.id, makeServiceFromInput(lab.id, item), true));
    data.initialClinicIds.forEach(clinicId => mockLaboratoryService.connectLaboratoryToClinic(lab.id, clinicId, { isPreferred: false, notes: 'Initial laboratory connection.' }));
    addHistory(lab, draft ? 'Created Draft' : 'Created', `${lab.laboratoryNumber} was ${draft ? 'saved as draft' : 'created'}.`);
    if (limit.warning) logActivity('Laboratory Limit Override', `${lab.laboratoryNumber}: ${limit.warning}`);
    mockLaboratoryService.reconcileClinicLaboratoryConnections();
    mockLaboratoryService.reconcileSubscriberLaboratoryCounts();
    return { ok: true, data: mockLaboratoryService.getLaboratoryById(lab.id) || lab, warning: limit.warning };
  },
  updateLaboratory: (laboratoryId: string, data: LaboratoryFormData): LaboratoryResult<Laboratory> => {
    const labs = mockLaboratoryService.listLaboratories();
    const target = labs.find(item => item.id === laboratoryId);
    if (!target) return { ok: false, error: 'Laboratory not found.' };
    const validation = validateLaboratoryForm({ ...data, subscriberId: target.subscriberId, initialClinicIds: [] }, labs, mockClinicService.listClinics(), target.id);
    if (!validation.valid) return { ok: false, error: validation.message };
    const updated: Laboratory = { ...target, ...toLaboratory({ ...data, subscriberId: target.subscriberId, initialClinicIds: [] }, target.status, labs.length), id: target.id, laboratoryNumber: target.laboratoryNumber, subscriberId: target.subscriberId, createdAt: target.createdAt, createdBy: target.createdBy, activatedAt: target.activatedAt, archivedAt: target.archivedAt, clinicIds: target.clinicIds, serviceIds: target.serviceIds, updatedAt: today(), updatedBy: 'platform_owner' };
    writeLabs(labs.map(item => item.id === target.id ? updated : item));
    addHistory(updated, 'Updated', `${updated.laboratoryNumber} editable fields were updated.`);
    return { ok: true, data: updated };
  },
  activateLaboratory: (laboratoryId: string): LaboratoryResult<Laboratory> => {
    const lab = mockLaboratoryService.getLaboratoryById(laboratoryId);
    if (!lab) return { ok: false, error: 'Laboratory not found.' };
    const ready = validateActivationReadiness(lab);
    if (!ready.valid) return { ok: false, error: ready.message };
    const ownership = mockLaboratoryService.validateLaboratoryOwnership(lab.subscriberId);
    if (!ownership.valid) return { ok: false, error: ownership.message };
    const limit = mockLaboratoryService.validateLaboratoryLimit(lab.subscriberId, lab.id, true);
    if (!limit.valid) return { ok: false, error: limit.message || limit.warning };
    return mockLaboratoryService.setLaboratoryStatus(lab.id, 'active', 'Activated', { activatedAt: today(), deactivatedAt: undefined, deactivationReason: undefined });
  },
  deactivateLaboratory: (laboratoryId: string, reason: string): LaboratoryResult<Laboratory> => {
    if (!reason.trim()) return { ok: false, error: 'Deactivation reason is required.' };
    return mockLaboratoryService.setLaboratoryStatus(laboratoryId, 'inactive', 'Deactivated', { deactivatedAt: today(), deactivationReason: reason });
  },
  archiveLaboratory: (laboratoryId: string, reason: string): LaboratoryResult<Laboratory> => {
    if (!reason.trim()) return { ok: false, error: 'Archive reason is required.' };
    const result = mockLaboratoryService.setLaboratoryStatus(laboratoryId, 'archived', 'Archived', { archivedAt: today(), archiveReason: reason });
    if (result.ok && result.data) {
      writeConnections(readConnections().map(item => item.laboratoryId === laboratoryId && item.status === 'active' ? { ...item, status: 'inactive', isPreferred: false, disconnectedAt: today(), disconnectedBy: 'platform_owner', disconnectionReason: 'Laboratory archived.' } : item));
      mockLaboratoryService.reconcileClinicLaboratoryConnections();
    }
    return result;
  },
  restoreLaboratory: (laboratoryId: string, allowPendingOverride = false): LaboratoryResult<Laboratory> => {
    const lab = mockLaboratoryService.getLaboratoryById(laboratoryId);
    if (!lab) return { ok: false, error: 'Laboratory not found.' };
    if (lab.status !== 'archived') return { ok: false, error: 'Only archived laboratories can be restored.' };
    const ownership = mockLaboratoryService.validateLaboratoryOwnership(lab.subscriberId);
    if (!ownership.valid) return { ok: false, error: ownership.message };
    const limit = mockLaboratoryService.validateLaboratoryLimit(lab.subscriberId, lab.id, allowPendingOverride);
    if (!limit.valid) return { ok: false, error: limit.message || limit.warning };
    return mockLaboratoryService.setLaboratoryStatus(lab.id, 'inactive', 'Restored', { archivedAt: undefined, archiveReason: undefined });
  },
  setLaboratoryStatus: (laboratoryId: string, status: Laboratory['status'], action: string, patch: Partial<Laboratory> = {}): LaboratoryResult<Laboratory> => {
    const labs = mockLaboratoryService.listLaboratories();
    const target = labs.find(item => item.id === laboratoryId);
    if (!target) return { ok: false, error: 'Laboratory not found.' };
    const updated = { ...target, ...patch, status, updatedAt: today(), updatedBy: 'platform_owner' };
    writeLabs(labs.map(item => item.id === target.id ? updated : item));
    addHistory(updated, action, `${updated.laboratoryNumber} was ${action.toLowerCase()}.`, target.status, status);
    mockLaboratoryService.reconcileSubscriberLaboratoryCounts();
    return { ok: true, data: updated };
  },
  permanentlyDeleteLaboratory: (laboratoryId: string): LaboratoryResult<boolean> => {
    const labs = readLabs();
    const target = labs.find(item => item.id === laboratoryId || item.laboratoryNumber === laboratoryId);
    if (!target) return { ok: false, error: 'Laboratory not found.' };

    // 1. Blacklist permanent deletion to prevent re-provisioning
    const deleted = safeRead<string[]>(DELETED_LABS_KEY, []);
    const keysToAdd = [target.id, target.laboratoryNumber, target.name.trim().toLowerCase()].filter(Boolean);
    safeWrite(DELETED_LABS_KEY, Array.from(new Set([...deleted, ...keysToAdd])));

    // 2. Remove from raw laboratories storage
    const rawLabs = safeRead<Laboratory[]>(LABS_KEY, []);
    const remaining = rawLabs.filter(item => 
      item.id !== target.id && 
      item.laboratoryNumber !== target.laboratoryNumber &&
      item.name.trim().toLowerCase() !== target.name.trim().toLowerCase()
    );
    safeWrite(LABS_KEY, remaining);

    // 3. Remove connections and services
    writeConnections(readConnections().filter(item => item.laboratoryId !== target.id && item.laboratoryId !== target.laboratoryNumber));
    writeServices(readServices().filter(item => item.laboratoryId !== target.id && item.laboratoryId !== target.laboratoryNumber));

    // 4. Clean registration worksWithLab if matching
    const registrations = safeRead<RegistrationLike[]>(REGISTRATIONS_KEY, []);
    const updatedRegistrations = registrations.map(reg => {
      if (reg.labName && reg.labName.trim().toLowerCase() === target.name.trim().toLowerCase()) {
        return { ...reg, worksWithLab: false, labName: undefined };
      }
      return reg;
    });
    safeWrite(REGISTRATIONS_KEY, updatedRegistrations);

    addHistory(target, 'Laboratory Deleted Permanently', `${target.laboratoryNumber} (${target.name}) was permanently deleted from the system.`);
    mockLaboratoryService.reconcileSubscriberLaboratoryCounts();
    return { ok: true, data: true };
  },
  connectLaboratoryToClinic: (laboratoryId: string, clinicId: string, options: Partial<ClinicLaboratoryConnection> = {}): LaboratoryResult<ClinicLaboratoryConnection> => {
    const lab = mockLaboratoryService.getLaboratoryById(laboratoryId);
    const clinic = mockClinicService.getClinicById(clinicId);
    const validation = validateClinicConnection(lab, clinic, readConnections(), Boolean(options.isPreferred));
    if (!validation.valid) return { ok: false, error: validation.message };
    if (options.isPreferred) mockLaboratoryService.setPreferredLaboratory(clinicId, laboratoryId, true);
    const connection: ClinicLaboratoryConnection = { id: makeId('CLC'), subscriberId: lab!.subscriberId, clinicId, laboratoryId, status: 'active', isPreferred: Boolean(options.isPreferred), servicesAllowed: options.servicesAllowed || mockLaboratoryService.getLaboratoryServices(laboratoryId).filter(item => item.status === 'active').map(item => item.id), defaultTurnaroundDays: options.defaultTurnaroundDays || lab!.defaultTurnaroundDays, notes: options.notes || '', connectedAt: today(), connectedBy: 'platform_owner' };
    const connections = options.isPreferred ? readConnections().map(item => item.clinicId === clinicId ? { ...item, isPreferred: false } : item) : readConnections();
    writeConnections([connection, ...connections]);
    addHistory(lab!, 'Clinic Connected', `${clinic!.clinicNumber} connected to ${lab!.laboratoryNumber}.`);
    mockLaboratoryService.reconcileClinicLaboratoryConnections();
    return { ok: true, data: connection };
  },
  disconnectLaboratoryFromClinic: (connectionId: string, reason: string): LaboratoryResult<ClinicLaboratoryConnection> => {
    if (!reason.trim()) return { ok: false, error: 'Disconnection reason is required.' };
    const connections = readConnections();
    const target = connections.find(item => item.id === connectionId);
    if (!target) return { ok: false, error: 'Clinic-laboratory connection not found.' };
    const updated = { ...target, status: 'disconnected' as const, isPreferred: false, disconnectedAt: today(), disconnectedBy: 'platform_owner', disconnectionReason: reason };
    writeConnections(connections.map(item => item.id === target.id ? updated : item));
    const lab = mockLaboratoryService.getLaboratoryById(target.laboratoryId);
    if (lab) addHistory(lab, 'Clinic Disconnected', `${target.clinicId} disconnected from ${lab.laboratoryNumber}.`);
    mockLaboratoryService.reconcileClinicLaboratoryConnections();
    return { ok: true, data: updated };
  },
  setPreferredLaboratory: (clinicId: string, laboratoryId: string, silent = false): LaboratoryResult<ClinicLaboratoryConnection> => {
    const lab = mockLaboratoryService.getLaboratoryById(laboratoryId);
    const clinic = mockClinicService.getClinicById(clinicId);
    if (!lab || !clinic) return { ok: false, error: 'Choose a valid clinic and laboratory.' };
    if (lab.status !== 'active' || clinic.status === 'archived') return { ok: false, error: 'Preferred laboratory requires an active laboratory and non-archived clinic.' };
    const connection = activeConnectionFor(clinicId, laboratoryId);
    if (!connection) return { ok: false, error: 'Create an active clinic connection before setting preferred laboratory.' };
    const updated = readConnections().map(item => item.clinicId === clinicId ? { ...item, isPreferred: item.id === connection.id } : item);
    writeConnections(updated);
    const preferred = updated.find(item => item.id === connection.id)!;
    if (!silent) addHistory(lab, 'Preferred Laboratory Changed', `${lab.laboratoryNumber} is now preferred for ${clinic.clinicNumber}.`);
    return { ok: true, data: preferred };
  },
  createLaboratoryService: (laboratoryId: string, input: LaboratoryService, silent = false): LaboratoryResult<LaboratoryService> => {
    const lab = mockLaboratoryService.getLaboratoryById(laboratoryId);
    if (!lab) return { ok: false, error: 'Laboratory not found.' };
    const existing = mockLaboratoryService.getLaboratoryServices(laboratoryId);
    const validation = validateServiceForm(input, existing);
    if (!validation.valid) return { ok: false, error: validation.message };
    const service = { ...input, id: input.id || makeId('LBS'), laboratoryId, createdAt: today(), updatedAt: today() };
    writeServices([service, ...readServices()]);
    if (!silent) addHistory(lab, 'Service Added', `${service.serviceCode} added to ${lab.laboratoryNumber}.`);
    mockLaboratoryService.reconcileClinicLaboratoryConnections();
    return { ok: true, data: service };
  },
  updateLaboratoryService: (serviceId: string, input: Partial<LaboratoryService>): LaboratoryResult<LaboratoryService> => {
    const services = readServices();
    const target = services.find(item => item.id === serviceId);
    if (!target) return { ok: false, error: 'Laboratory service not found.' };
    const updated = { ...target, ...input, updatedAt: today() };
    const validation = validateServiceForm(updated, services.filter(item => item.laboratoryId === target.laboratoryId), target.id);
    if (!validation.valid) return { ok: false, error: validation.message };
    writeServices(services.map(item => item.id === target.id ? updated : item));
    const lab = mockLaboratoryService.getLaboratoryById(target.laboratoryId);
    if (lab) addHistory(lab, 'Service Changed', `${updated.serviceCode} was updated.`);
    return { ok: true, data: updated };
  },
  activateLaboratoryService: (serviceId: string) => mockLaboratoryService.updateLaboratoryService(serviceId, { status: 'active', archivedAt: undefined }),
  deactivateLaboratoryService: (serviceId: string) => mockLaboratoryService.updateLaboratoryService(serviceId, { status: 'inactive' }),
  archiveLaboratoryService: (serviceId: string) => mockLaboratoryService.updateLaboratoryService(serviceId, { status: 'archived', archivedAt: today() }),
  restoreLaboratoryService: (serviceId: string) => mockLaboratoryService.updateLaboratoryService(serviceId, { status: 'inactive', archivedAt: undefined }),
  reconcileClinicLaboratoryConnections: () => {
    const labs = readLabs();
    const clinics = mockClinicService.listClinics();
    const valid = readConnections().filter(item => labs.some(lab => lab.id === item.laboratoryId) && clinics.some(clinic => clinic.id === item.clinicId));
    const preferredSeen = new Set<string>();
    const normalized = valid.map(item => {
      const key = item.clinicId;
      if (item.isPreferred && preferredSeen.has(key)) return { ...item, isPreferred: false };
      if (item.isPreferred) preferredSeen.add(key);
      return item;
    });
    writeConnections(normalized);
    writeLabs(labs.map(lab => ({ ...lab, clinicIds: normalized.filter(item => item.laboratoryId === lab.id && item.status === 'active').map(item => item.clinicId), serviceIds: readServices().filter(item => item.laboratoryId === lab.id && item.status !== 'archived').map(item => item.id), updatedAt: lab.updatedAt })));
    return normalized;
  },
  reconcileSubscriberLaboratoryCounts: () => {
    const labs = mockLaboratoryService.listLaboratories();
    const subscribers = readSubscribers().map(subscriber => ({ ...subscriber, laboratoryCount: labs.filter(item => item.subscriberId === subscriber.id && item.status !== 'archived').length, updatedAt: today() }));
    writeSubscribers(subscribers);
    return subscribers;
  },
  provisionRegistrationLaboratories: () => {
    const deleted = getDeletedLabKeys();
    const registrations = mockPlatformManagementService.listRegistrations() as RegistrationLike[];
    registrations.filter(reg => reg.worksWithLab && reg.labName && reg.subscriberId).forEach(reg => {
      const labNameClean = String(reg.labName).trim().toLowerCase();
      if (deleted.includes(labNameClean)) return;
      const subscriber = subscriberFor(reg.subscriberId);
      if (!subscriber) return;
      const existing = mockLaboratoryService.getLaboratoriesBySubscriberId(subscriber.id).find(lab => lab.name.trim().toLowerCase() === labNameClean);
      if (existing) return;
      const clinic = mockClinicService.getClinicsBySubscriberId(subscriber.id)[0];
      const result = mockLaboratoryService.createLaboratory({ ...mockLaboratoryService.toFormData(), subscriberId: subscriber.id, name: reg.labName || '', legalBusinessName: reg.labName || '', email: subscriber.email.replace('@', '+lab@'), contactNumber: subscriber.mobileNumber, contactPersonName: reg.ownerName, contactPersonPosition: 'Registration Contact', addressLine1: reg.clinicAddress || subscriber.primaryClinicName, city: 'Manila', province: 'Metro Manila', initialClinicIds: clinic ? [clinic.id] : [] }, false, true);
      if (result.ok && result.data) logActivity('Registration Laboratory Provisioned', `${result.data.laboratoryNumber} was provisioned from ${reg.id}.`);
    });
  },
  searchLaboratories: (records: Laboratory[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    const subscribers = readSubscribers();
    return records.filter(item => [item.laboratoryNumber, item.name, item.legalBusinessName, item.email, item.city, item.province, item.laboratoryType, subscribers.find(sub => sub.id === item.subscriberId)?.businessName].some(value => String(value || '').toLowerCase().includes(term)));
  },
  filterLaboratories: (records: Laboratory[], filters: LaboratoryFilters) => {
    let next = mockLaboratoryService.searchLaboratories(records, filters.search);
    if (filters.tab !== 'all') next = next.filter(item => item.status === filters.tab);
    if (filters.subscriberId !== 'all') next = next.filter(item => item.subscriberId === filters.subscriberId);
    if (filters.laboratoryType !== 'all') next = next.filter(item => item.laboratoryType === filters.laboratoryType);
    if (filters.status !== 'all') next = next.filter(item => item.status === filters.status);
    if (filters.province) next = next.filter(item => item.province.toLowerCase().includes(filters.province.toLowerCase()));
    if (filters.city) next = next.filter(item => item.city.toLowerCase().includes(filters.city.toLowerCase()));
    if (filters.clinicConnection === 'with') next = next.filter(item => item.clinicIds.length > 0);
    if (filters.clinicConnection === 'without') next = next.filter(item => item.clinicIds.length === 0);
    if (filters.preferred === 'preferred') next = next.filter(item => readConnections().some(connection => connection.laboratoryId === item.id && connection.isPreferred && connection.status === 'active'));
    if (filters.serviceAvailability === 'with') next = next.filter(item => mockLaboratoryService.getLaboratoryServices(item.id).some(service => service.status === 'active'));
    if (filters.serviceAvailability === 'without') next = next.filter(item => !mockLaboratoryService.getLaboratoryServices(item.id).some(service => service.status === 'active'));
    if (filters.createdDate) next = next.filter(item => item.createdAt === filters.createdDate);
    return next;
  },
  sortLaboratories: (records: Laboratory[], sort: LaboratorySort) => [...records].sort((a, b) => String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? '')) * (sort.direction === 'asc' ? 1 : -1)),
  paginateLaboratories: (records: Laboratory[], page: number, pageSize: number) => records.slice((page - 1) * pageSize, page * pageSize),
  getLaboratorySummary: () => {
    const labs = mockLaboratoryService.listLaboratories();
    return { total: labs.length, active: labs.filter(item => item.status === 'active').length, draft: labs.filter(item => item.status === 'draft').length, inactive: labs.filter(item => item.status === 'inactive').length, archived: labs.filter(item => item.status === 'archived').length, internal: labs.filter(item => item.laboratoryType === 'internal').length, external: labs.filter(item => ['external', 'partner', 'independent'].includes(item.laboratoryType)).length, withoutClinicConnections: labs.filter(item => item.status !== 'archived' && item.clinicIds.length === 0).length, withoutActiveServices: labs.filter(item => item.status !== 'archived' && !mockLaboratoryService.getLaboratoryServices(item.id).some(service => service.status === 'active')).length };
  },
  toFormData: (laboratory?: Laboratory): LaboratoryFormData => ({
    subscriberId: laboratory?.subscriberId || '',
    laboratoryType: laboratory?.laboratoryType || 'external',
    initialClinicIds: [],
    name: laboratory?.name || '',
    legalBusinessName: laboratory?.legalBusinessName || '',
    email: laboratory?.email || '',
    contactNumber: laboratory?.contactNumber || '',
    alternativeContactNumber: laboratory?.alternativeContactNumber || '',
    contactPersonName: laboratory?.contactPersonName || '',
    contactPersonPosition: laboratory?.contactPersonPosition || '',
    description: laboratory?.description || '',
    logoFileName: laboratory?.logoMetadata?.fileName || '',
    logoFileType: laboratory?.logoMetadata?.fileType || '',
    logoPreviewUrl: laboratory?.logoMetadata?.previewUrl || '',
    addressLine1: laboratory?.addressLine1 || '',
    addressLine2: laboratory?.addressLine2 || '',
    barangay: laboratory?.barangay || '',
    city: laboratory?.city || '',
    province: laboratory?.province || '',
    postalCode: laboratory?.postalCode || '',
    country: laboratory?.country || 'Philippines',
    timezone: laboratory?.timezone || 'Asia/Manila',
    visibility: laboratory?.visibility || 'visible',
    serviceArea: laboratory?.serviceArea || 'Metro Manila',
    defaultTurnaroundDays: laboratory?.defaultTurnaroundDays || 7,
    rushTurnaroundDays: laboratory?.rushTurnaroundDays || 3,
    acceptsRushOrders: laboratory?.acceptsRushOrders ?? true,
    businessHours: laboratory?.businessHours || defaultBusinessHours(),
    initialServices: []
  }),
  formatPrice: (service: LaboratoryService) => service.defaultPrice === undefined ? 'Pending Product Decision' : `Prototype Price PHP ${service.defaultPrice.toLocaleString()}`,
  format
};
