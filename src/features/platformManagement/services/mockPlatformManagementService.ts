import type {
  AccountStatus,
  ActivityLogLike,
  MockClinic,
  MockSubscription,
  PaymentLike,
  PlatformUser,
  RegistrationLike,
  ServiceResult,
  SortState,
  Subscriber,
  SubscriberFilters,
  SubscriptionStatus,
  UserFilters
} from '../types';

const SUBSCRIBERS_KEY = 'pnj_mock_subscribers';
const PLATFORM_USERS_KEY = 'pnj_mock_platform_users';
const CLINICS_KEY = 'pnj_mock_clinics';
const SUBSCRIPTIONS_KEY = 'pnj_mock_subscriptions';
const REGISTRATIONS_KEY = 'pnj_mock_registrations';
const PAYMENTS_KEY = 'pnj_mock_payments';
const ACTIVITY_KEY = 'pnj_mock_activity_logs';
const AUTH_USERS_KEY = 'pnj_mock_users';

export const generateSecureTemporaryPassword = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return `Temp-${code}!`;
};

const today = () => new Date().toISOString().split('T')[0];
const addDays = (date: string, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next.toISOString().split('T')[0];
};

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

const logActivity = (event: string, details: string, role = 'platform_owner') => {
  const logs = safeRead<ActivityLogLike[]>(ACTIVITY_KEY, []);
  const newLog: ActivityLogLike = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString(),
    event,
    details,
    role
  };
  safeWrite(ACTIVITY_KEY, [newLog, ...logs]);
};

const normalizePlan = (plan: string): string => plan || 'Plus';

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] || 'Clinic',
    lastName: parts.slice(1).join(' ') || 'Owner'
  };
};

const makeSubscriberNumber = (seed: number) => `SUB-${String(seed).padStart(6, '0')}`;
const makeUserNumber = (seed: number) => `USR-${String(seed).padStart(6, '0')}`;
const makeClinicNumber = (seed: number) => `CLN-${String(seed).padStart(6, '0')}`;

const getSubscribersRaw = () => safeRead<Subscriber[]>(SUBSCRIBERS_KEY, []);
const setSubscribersRaw = (records: Subscriber[]) => safeWrite(SUBSCRIBERS_KEY, records);
const getUsersRaw = () => safeRead<PlatformUser[]>(PLATFORM_USERS_KEY, []);
const setUsersRaw = (records: PlatformUser[]) => safeWrite(PLATFORM_USERS_KEY, records);
const getClinicsRaw = () => safeRead<MockClinic[]>(CLINICS_KEY, []);
const setClinicsRaw = (records: MockClinic[]) => safeWrite(CLINICS_KEY, records);
const getSubscriptionsRaw = () => safeRead<MockSubscription[]>(SUBSCRIPTIONS_KEY, []);
const setSubscriptionsRaw = (records: MockSubscription[]) => safeWrite(SUBSCRIPTIONS_KEY, records);
const getRegistrations = () => safeRead<RegistrationLike[]>(REGISTRATIONS_KEY, []);
const getPayments = () => safeRead<PaymentLike[]>(PAYMENTS_KEY, []);
const readLegacyPaymentField = (payment: PaymentLike, key: string) =>
  (payment as unknown as Record<string, unknown>)[key];

const saveAuthUserStatus = (email: string, status: AccountStatus, mustChangePassword?: boolean) => {
  const authUsers = safeRead<Array<Record<string, unknown>>>(AUTH_USERS_KEY, []);
  const mapped = authUsers.map(user => {
    if (String(user.email || '').toLowerCase() !== email.toLowerCase()) return user;
    return {
      ...user,
      status: status === 'active' ? 'active' : 'suspended',
      mustChangePassword: mustChangePassword ?? user.mustChangePassword
    };
  });
  safeWrite(AUTH_USERS_KEY, mapped);
};

const isValidSubscriber = (record: Subscriber) => Boolean(record.id && record.email && record.businessName);

const makeSubscriberFromRegistration = (reg: RegistrationLike): Subscriber => {
  const existingCount = getSubscribersRaw().length + 1;
  const id = reg.subscriberId || `SUB-${reg.id.replace('REG-', '')}`;
  const registeredAt = reg.submittedDate || today();
  const activatedAt = today();
  return {
    id,
    subscriberNumber: reg.subscriberId || makeSubscriberNumber(existingCount),
    registrationId: reg.id,
    ownerUserId: reg.userId || `USR-${reg.id.replace('REG-', '')}`,
    businessName: reg.clinicName,
    primaryClinicName: reg.clinicName,
    email: reg.ownerEmail,
    mobileNumber: reg.ownerMobile,
    planId: normalizePlan(reg.plan),
    subscriptionId: `SCP-${id}`,
    paymentStatus: reg.paymentStatus,
    subscriptionStatus: reg.paymentStatus === 'approved' ? 'active' : 'pending',
    accountStatus: reg.paymentStatus === 'approved' ? 'active' : 'pending',
    clinicCount: reg.locationsCount || 1,
    laboratoryCount: reg.worksWithLab ? 1 : 0,
    associateCount: Math.max(0, (reg.dentistsCount || 1) - 1),
    staffCount: reg.staffCount || 0,
    registeredAt,
    activatedAt: reg.paymentStatus === 'approved' ? activatedAt : undefined,
    expiresAt: reg.paymentStatus === 'approved' ? addDays(activatedAt, 365) : undefined,
    createdAt: registeredAt,
    updatedAt: today()
  };
};

const makePendingSubscriberFromRegistration = (reg: RegistrationLike): Subscriber => {
  const pseudoId = reg.subscriberId || `REGISTRATION-${reg.id}`;
  return {
    id: pseudoId,
    subscriberNumber: reg.subscriberId || `PENDING-${reg.id.replace(/^REG-/, '')}`,
    registrationId: reg.id,
    ownerUserId: reg.userId || '',
    businessName: reg.clinicName,
    primaryClinicName: reg.clinicName,
    email: reg.ownerEmail,
    mobileNumber: reg.ownerMobile,
    planId: normalizePlan(reg.plan),
    subscriptionId: `SCP-PENDING-${reg.id}`,
    paymentStatus: reg.paymentStatus,
    subscriptionStatus: 'pending',
    accountStatus: 'pending',
    clinicCount: Math.max(1, reg.locationsCount || 1),
    laboratoryCount: reg.worksWithLab ? 1 : 0,
    associateCount: Math.max(0, (reg.dentistsCount || 1) - 1),
    staffCount: reg.staffCount || 0,
    registeredAt: reg.submittedDate || today(),
    createdAt: reg.submittedDate || today(),
    updatedAt: reg.updatedDate || reg.submittedDate || today()
  };
};

const createLinkedRecordsForSubscriber = (subscriber: Subscriber, reg?: RegistrationLike) => {
  const clinics = getClinicsRaw();
  if (!clinics.some(clinic => clinic.subscriberId === subscriber.id)) {
    setClinicsRaw([
      ...clinics,
      {
        id: `CLN-${subscriber.id}`,
        clinicNumber: makeClinicNumber(clinics.length + 1),
        subscriberId: subscriber.id,
        name: subscriber.primaryClinicName,
        email: reg?.clinicEmail || subscriber.email,
        contactNumber: reg?.clinicMobile || subscriber.mobileNumber,
        address: reg?.clinicAddress || 'Mock clinic address pending setup',
        status: subscriber.accountStatus,
        createdAt: subscriber.createdAt,
        updatedAt: today()
      }
    ]);
  }

  const subscriptions = getSubscriptionsRaw();
  if (!subscriptions.some(subscription => subscription.id === subscriber.subscriptionId)) {
    setSubscriptionsRaw([
      ...subscriptions,
      {
        id: subscriber.subscriptionId,
        subscriberId: subscriber.id,
        planId: subscriber.planId,
        status: subscriber.subscriptionStatus,
        startedAt: subscriber.activatedAt || subscriber.registeredAt,
        expiresAt: subscriber.expiresAt || addDays(today(), 365),
        renewalStatus: subscriber.subscriptionStatus === 'active' ? 'current' : 'pending',
        createdAt: subscriber.createdAt,
        updatedAt: today(),
        changeHistory: [`${subscriber.planId} subscription provisioned from mock approval.`]
      }
    ]);
  }
};

const createOwnerUserForSubscriber = (subscriber: Subscriber, reg: RegistrationLike) => {
  const users = getUsersRaw();
  const name = splitName(reg.ownerName);
  const clinic = getClinicsRaw().find(item => item.subscriberId === subscriber.id);
  const existingUser = users.find(user => user.email.toLowerCase() === reg.ownerEmail.toLowerCase());
  const authUsers = safeRead<Array<Record<string, unknown>>>(AUTH_USERS_KEY, []);
  const existingAuth = authUsers.find(u => String(u.email || '').toLowerCase() === reg.ownerEmail.toLowerCase());
  const shouldIssueTemporaryPassword = !existingAuth || existingAuth.mustChangePassword !== false;
  const owner: PlatformUser = {
    id: existingUser?.id || subscriber.ownerUserId || reg.userId || `USR-${subscriber.id}`,
    userNumber: existingUser?.userNumber || makeUserNumber(users.length + 1),
    subscriberId: subscriber.id,
    clinicIds: clinic ? [clinic.id] : existingUser?.clinicIds || [],
    fullName: reg.ownerName,
    firstName: name.firstName,
    lastName: name.lastName,
    email: reg.ownerEmail,
    mobileNumber: reg.ownerMobile,
    role: 'clinic_owner',
    position: 'Clinic Owner',
    accountStatus: subscriber.accountStatus,
    mustChangePassword: shouldIssueTemporaryPassword,
    registeredAt: existingUser?.registeredAt || reg.submittedDate || today(),
    createdAt: existingUser?.createdAt || reg.submittedDate || today(),
    updatedAt: today()
  };
  setUsersRaw(existingUser
    ? users.map(user => user.email.toLowerCase() === reg.ownerEmail.toLowerCase() ? { ...user, ...owner } : user)
    : [...users, owner]
  );

  const tempPassword = shouldIssueTemporaryPassword
    ? generateSecureTemporaryPassword()
    : String(existingAuth.passwordHash || reg.tempPassword || generateSecureTemporaryPassword());
  reg.tempPassword = shouldIssueTemporaryPassword ? tempPassword : '';
  if (existingAuth) {
    safeWrite(AUTH_USERS_KEY, authUsers.map(u => String(u.email || '').toLowerCase() === reg.ownerEmail.toLowerCase() ? {
      ...u,
      role: 'clinic_owner',
      status: subscriber.accountStatus || 'active',
      name: reg.ownerName,
      clinicName: subscriber.businessName,
      planName: subscriber.planId,
      passwordHash: shouldIssueTemporaryPassword ? tempPassword : (String(u.passwordHash || '') || tempPassword),
      mustChangePassword: shouldIssueTemporaryPassword
    } : u));
  } else {
    const newAuth = {
      email: reg.ownerEmail,
      passwordHash: tempPassword,
      role: 'clinic_owner',
      status: subscriber.accountStatus || 'active',
      name: reg.ownerName,
      clinicName: subscriber.businessName,
      planName: subscriber.planId,
      mustChangePassword: true
    };
    safeWrite(AUTH_USERS_KEY, [...authUsers, newAuth]);
  }
};

const syncRegistrationProvisioning = (subscriber: Subscriber, reg: RegistrationLike) => {
  const records = getRegistrations();
  const ownerUser = getUsersRaw().find(user => user.email.toLowerCase() === reg.ownerEmail.toLowerCase());
  const authUser = safeRead<Array<Record<string, unknown>>>(AUTH_USERS_KEY, [])
    .find(user => String(user.email || '').toLowerCase() === reg.ownerEmail.toLowerCase());
  const tempPassword = authUser?.mustChangePassword === false
    ? ''
    : reg.tempPassword || String(authUser?.passwordHash || '') || generateSecureTemporaryPassword();
  safeWrite(REGISTRATIONS_KEY, records.map(item => item.id === reg.id ? {
    ...item,
    paymentStatus: 'approved',
    registrationStatus: 'account_ready',
    tempPassword: tempPassword,
    subscriberId: subscriber.id,
    userId: ownerUser?.id || subscriber.ownerUserId || reg.userId || `USR-${subscriber.id}`,
    updatedDate: today()
  } : item));
};

const applySubscriberAction = (
  subscriberId: string,
  update: Partial<Subscriber>,
  event: string,
  details: string
): ServiceResult<Subscriber> => {
  const subscribers = getSubscribersRaw();
  const target = subscribers.find(item => item.id === subscriberId);
  if (!target) return { ok: false, error: 'Subscriber record not found.' };
  const updated: Subscriber = { ...target, ...update, updatedAt: today() };
  if (!isValidSubscriber(updated)) return { ok: false, error: 'Subscriber record is malformed.' };
  setSubscribersRaw(subscribers.map(item => item.id === subscriberId ? updated : item));
  const subscriptions = getSubscriptionsRaw();
  setSubscriptionsRaw(subscriptions.map(item => item.id === updated.subscriptionId ? {
    ...item,
    planId: updated.planId,
    status: updated.subscriptionStatus,
    expiresAt: updated.expiresAt || item.expiresAt,
    updatedAt: today(),
    changeHistory: [...(item.changeHistory || []), event]
  } : item));
  logActivity(event, details);
  return { ok: true, data: updated };
};

const compareValue = (a: unknown, b: unknown) => String(a ?? '').localeCompare(String(b ?? ''));

const DENTISTS_STORAGE_KEY = 'clinic_owner_associate_dentists_v1';
const STAFF_STORAGE_KEY = 'pnj_mock_staff_members';
const DELETED_SUBSCRIBERS_KEY = 'pnj_mock_deleted_subscribers';

const getDeletedSubscriberIds = () => safeRead<string[]>(DELETED_SUBSCRIBERS_KEY, []);
const getDentistsRaw = () => safeRead<Array<Record<string, unknown>>>(DENTISTS_STORAGE_KEY, []);
const setDentistsRaw = (records: Array<Record<string, unknown>>) => safeWrite(DENTISTS_STORAGE_KEY, records);
const getStaffRaw = () => safeRead<Array<Record<string, unknown>>>(STAFF_STORAGE_KEY, []);
const setStaffRaw = (records: Array<Record<string, unknown>>) => safeWrite(STAFF_STORAGE_KEY, records);

const purgeDeletedSubscriberArtifacts = () => {
  const deleted = new Set(getDeletedSubscriberIds().map(value => String(value || '').trim().toLowerCase()).filter(Boolean));
  if (!deleted.size) return;

  const registrations = getRegistrations();
  const removedRegistrationIds = new Set(
    registrations
      .filter(registration =>
        deleted.has(String(registration.id || '').toLowerCase()) ||
        deleted.has(String(registration.subscriberId || '').toLowerCase()) ||
        deleted.has(String(registration.userId || '').toLowerCase()) ||
        deleted.has(String(registration.ownerEmail || '').trim().toLowerCase())
      )
      .map(registration => registration.id)
  );

  const removedSubscriberIds = new Set<string>();
  getSubscribersRaw().forEach(subscriber => {
    const email = String(subscriber.email || '').trim().toLowerCase();
    if (
      deleted.has(String(subscriber.id || '').toLowerCase()) ||
      deleted.has(String(subscriber.subscriberNumber || '').toLowerCase()) ||
      deleted.has(String(subscriber.registrationId || '').toLowerCase()) ||
      deleted.has(email) ||
      removedRegistrationIds.has(String(subscriber.registrationId || ''))
    ) {
      removedSubscriberIds.add(String(subscriber.id || ''));
      removedSubscriberIds.add(String(subscriber.subscriberNumber || ''));
    }
  });

  safeWrite(REGISTRATIONS_KEY, registrations.filter(registration =>
    !removedRegistrationIds.has(registration.id) &&
    !removedSubscriberIds.has(String(registration.subscriberId || '')) &&
    !deleted.has(String(registration.ownerEmail || '').trim().toLowerCase())
  ));

  safeWrite(PAYMENTS_KEY, getPayments().filter(payment => {
    const paymentEmail = String(readLegacyPaymentField(payment, 'payerEmail') || '').trim().toLowerCase();
    const paymentSubscriberId = String(readLegacyPaymentField(payment, 'subscriberId') || '');
    return (
      !removedRegistrationIds.has(String(payment.registrationId || '')) &&
      !removedSubscriberIds.has(paymentSubscriberId) &&
      !deleted.has(paymentEmail)
    );
  }));

  setSubscribersRaw(getSubscribersRaw().filter(subscriber =>
    !removedSubscriberIds.has(String(subscriber.id || '')) &&
    !removedSubscriberIds.has(String(subscriber.subscriberNumber || '')) &&
    !removedRegistrationIds.has(String(subscriber.registrationId || '')) &&
    !deleted.has(String(subscriber.email || '').trim().toLowerCase())
  ));

  setUsersRaw(getUsersRaw().filter(user =>
    !removedSubscriberIds.has(String(user.subscriberId || '')) &&
    !deleted.has(String(user.email || '').trim().toLowerCase())
  ));

  safeWrite(
    AUTH_USERS_KEY,
    safeRead<Array<Record<string, unknown>>>(AUTH_USERS_KEY, []).filter(user =>
      !deleted.has(String(user.email || '').trim().toLowerCase())
    )
  );

  setClinicsRaw(getClinicsRaw().filter(clinic =>
    !removedSubscriberIds.has(String(clinic.subscriberId || ''))
  ));

  setSubscriptionsRaw(getSubscriptionsRaw().filter(subscription =>
    !removedSubscriberIds.has(String(subscription.subscriberId || ''))
  ));

  setDentistsRaw(getDentistsRaw().filter(dentist =>
    !removedSubscriberIds.has(String(dentist.subscriberId || '')) &&
    !deleted.has(String(dentist.email || '').trim().toLowerCase())
  ));

  setStaffRaw(getStaffRaw().filter(staff =>
    !removedSubscriberIds.has(String(staff.subscriberId || '')) &&
    !deleted.has(String(staff.email || '').trim().toLowerCase())
  ));
};

export const mockPlatformManagementService = {
  ensureSeedData: () => {
    // Do not run destructive, email-specific cleanup during normal reads or
    // approval provisioning. Cleanup must be an explicit admin action so a
    // newly registered account cannot disappear when a dashboard refreshes.
    purgeDeletedSubscriberArtifacts();
    const deletedIds = getDeletedSubscriberIds();
    const currentSubscribers = getSubscribersRaw().filter(sub => {
      const isMock = sub.id.startsWith('SUB-MOCK-') || sub.email.includes('@example.com') || sub.id === 'SUB-000001';
      const isDeleted = deletedIds.includes(sub.id) || deletedIds.includes(sub.subscriberNumber) || deletedIds.includes(sub.email.toLowerCase());
      return !isMock && !isDeleted;
    });
    setSubscribersRaw(currentSubscribers);

    const currentUsers = getUsersRaw().filter(usr =>
      !usr.id.startsWith('USR-MOCK-') &&
      !usr.email.includes('@example.com') &&
      usr.email !== 'maria.santos@angelodental.com' &&
      usr.email !== 'ana.bautista@angelodental.com' &&
      usr.id !== 'USR-000101' &&
      usr.id !== 'USR-000201' &&
      usr.id !== 'USR-000202' &&
      (!usr.subscriberId || !deletedIds.includes(usr.subscriberId)) &&
      !deletedIds.includes(usr.email.toLowerCase())
    );
    setUsersRaw(currentUsers);

    const currentClinics = getClinicsRaw().filter(cln =>
      !cln.id.startsWith('CLN-MOCK-') &&
      !cln.email?.includes('@example.com') &&
      cln.id !== 'CLN-SUB-396924' &&
      cln.id !== 'CLN-1787478722569-296' &&
      (!cln.subscriberId || !deletedIds.includes(cln.subscriberId))
    );
    setClinicsRaw(currentClinics);

    const currentSubscriptions = getSubscriptionsRaw().filter(scp =>
      !scp.id.startsWith('SCP-MOCK-') &&
      scp.id !== 'SCP-000101' &&
      (!scp.subscriberId || !deletedIds.includes(scp.subscriberId))
    );
    setSubscriptionsRaw(currentSubscriptions);
  },

  listSubscribers: () => {
    mockPlatformManagementService.ensureSeedData();
    const deletedIds = getDeletedSubscriberIds();
    const rawSubscribers = getSubscribersRaw().filter(sub =>
      !deletedIds.includes(sub.id) &&
      !deletedIds.includes(sub.subscriberNumber) &&
      !deletedIds.includes(sub.email.toLowerCase())
    );
    const allClinics = getClinicsRaw();
    const allDentists = getDentistsRaw();
    const allStaff = getStaffRaw();
    const registrations = getRegistrations();
    const existingRegistrationIds = new Set(rawSubscribers.map(sub => sub.registrationId).filter(Boolean));
    const existingEmails = new Set(rawSubscribers.map(sub => sub.email.toLowerCase()));
    const projectedPendingSubscribers = registrations
      .filter(reg =>
        ['unpaid', 'pending_verification'].includes(reg.paymentStatus) &&
        !existingRegistrationIds.has(reg.id) &&
        !existingEmails.has(reg.ownerEmail.toLowerCase()) &&
        !deletedIds.includes(reg.id) &&
        !deletedIds.includes(reg.ownerEmail.toLowerCase())
      )
      .map(makePendingSubscriberFromRegistration);

    // Dynamically calculate live facility and personnel counts strictly by subscriberId
    return [...rawSubscribers, ...projectedPendingSubscribers].map(sub => {
      const clinicCount = allClinics.filter(c => c.subscriberId === sub.id).length;
      const associateCount = allDentists.filter(d => d.subscriberId === sub.id).length;
      const staffCount = allStaff.filter(s => s.subscriberId === sub.id).length;
      return {
        ...sub,
        clinicCount: clinicCount || sub.clinicCount || 0,
        associateCount: associateCount,
        staffCount: staffCount
      };
    });
  },

  getSubscriberById: (subscriberId: string) => mockPlatformManagementService.listSubscribers().find(item => item.id === subscriberId || item.subscriberNumber === subscriberId) || null,
  getSubscriberByRegistrationId: (registrationId: string) => mockPlatformManagementService.listSubscribers().find(item => item.registrationId === registrationId) || null,

  createSubscriberFromApprovedRegistration: (reg: RegistrationLike): ServiceResult<Subscriber> => {
    if (reg.paymentStatus !== 'approved') return { ok: false, error: 'Registration payment is not approved.' };

    // Explicitly un-blacklist approved registration and owner email from deleted list
    const deletedIds = getDeletedSubscriberIds();
    const filteredDeleted = deletedIds.filter(id =>
      id !== reg.id &&
      id !== (reg.subscriberId || '') &&
      id !== (reg.ownerEmail?.toLowerCase() || '')
    );
    if (filteredDeleted.length !== deletedIds.length) {
      safeWrite(DELETED_SUBSCRIBERS_KEY, filteredDeleted);
    }

    const subscribers = getSubscribersRaw();
    const existing = subscribers.find(item => item.registrationId === reg.id || item.email.toLowerCase() === reg.ownerEmail.toLowerCase());
    if (existing) {
      createLinkedRecordsForSubscriber(existing, reg);
      createOwnerUserForSubscriber(existing, reg);
      syncRegistrationProvisioning(existing, reg);
      return { ok: true, data: existing };
    }
    const subscriber = makeSubscriberFromRegistration(reg);
    if (!isValidSubscriber(subscriber)) return { ok: false, error: 'Approved registration is missing subscriber fields.' };
    setSubscribersRaw([...subscribers, subscriber]);
    createLinkedRecordsForSubscriber(subscriber, reg);
    createOwnerUserForSubscriber(subscriber, reg);
    syncRegistrationProvisioning(subscriber, reg);
    logActivity('Subscriber Provisioned', `${subscriber.businessName} was provisioned from ${reg.id}.`);
    return { ok: true, data: subscriber };
  },

  updateSubscriber: (subscriberId: string, update: Partial<Subscriber>) => applySubscriberAction(
    subscriberId,
    update,
    'Subscriber Updated',
    `Subscriber ${subscriberId} profile was updated.`
  ),

  suspendSubscriber: (subscriberId: string, reason: string, note?: string) => applySubscriberAction(
    subscriberId,
    { accountStatus: 'suspended', subscriptionStatus: 'suspended', suspendedAt: today(), suspensionReason: `${reason}${note ? ` (${note})` : ''}` },
    'Subscriber Suspended',
    `Subscriber ${subscriberId} was suspended. Reason: ${reason}`
  ),

  reactivateSubscriber: (subscriberId: string) => applySubscriberAction(
    subscriberId,
    { accountStatus: 'active', subscriptionStatus: 'active', suspendedAt: undefined, suspensionReason: undefined },
    'Subscriber Reactivated',
    `Subscriber ${subscriberId} was reactivated.`
  ),

  deactivateSubscriber: (subscriberId: string, reason: string) => applySubscriberAction(
    subscriberId,
    { accountStatus: 'deactivated', subscriptionStatus: 'cancelled', deactivatedAt: today(), deactivationReason: reason },
    'Subscriber Deactivated',
    `Subscriber ${subscriberId} was soft-deactivated. Reason: ${reason}`
  ),

  changeSubscriberPlanMock: (subscriberId: string, planId: string) => applySubscriberAction(
    subscriberId,
    { planId },
    'Subscriber Plan Changed',
    `Subscriber ${subscriberId} changed to ${planId} in mock mode.`
  ),

  renewSubscriberMock: (subscriberId: string, days: number) => {
    const subscriber = mockPlatformManagementService.getSubscriberById(subscriberId);
    if (!subscriber) return { ok: false, error: 'Subscriber record not found.' };
    const baseDate = subscriber.expiresAt && new Date(subscriber.expiresAt) > new Date() ? subscriber.expiresAt : today();
    return applySubscriberAction(
      subscriberId,
      { accountStatus: 'active', subscriptionStatus: 'active', expiresAt: addDays(baseDate, days) },
      'Subscriber Subscription Renewed',
      `Subscriber ${subscriberId} was renewed for ${days} days.`
    );
  },

  deleteSubscriber: (subscriberId: string): ServiceResult<Subscriber> => {
    const subscribers = getSubscribersRaw();
    const target = subscribers.find(item => item.id === subscriberId || item.subscriberNumber === subscriberId);
    if (!target) return { ok: false, error: 'Subscriber record not found.' };

    // 1. Add to permanent deleted blacklist
    const deletedIds = getDeletedSubscriberIds();
    const idsToBlacklist = [
      target.id,
      target.subscriberNumber,
      target.registrationId,
      target.ownerUserId,
      target.email.toLowerCase()
    ].filter(Boolean) as string[];
    
    safeWrite(DELETED_SUBSCRIBERS_KEY, Array.from(new Set([...deletedIds, ...idsToBlacklist])));

    // 2. Remove from subscribers
    setSubscribersRaw(subscribers.filter(item => item.id !== target.id && item.subscriberNumber !== target.subscriberNumber));

    // 3. Remove or prune from registrations
    const registrations = getRegistrations();
    safeWrite(REGISTRATIONS_KEY, registrations.filter(r => r.id !== target.registrationId && r.subscriberId !== target.id && r.subscriberId !== target.subscriberNumber && r.ownerEmail?.toLowerCase() !== target.email.toLowerCase()));

    // 4. Remove associated platform users
    const users = getUsersRaw();
    setUsersRaw(users.filter(u => u.subscriberId !== target.id && u.subscriberId !== target.subscriberNumber && u.id !== target.ownerUserId && u.email.toLowerCase() !== target.email.toLowerCase()));

    // 5. Remove from auth users (pnj_mock_users) so credentials can never log in
    const authUsers = safeRead<Array<Record<string, unknown>>>(AUTH_USERS_KEY, []);
    safeWrite(AUTH_USERS_KEY, authUsers.filter(u => String(u.email || '').toLowerCase() !== target.email.toLowerCase()));

    // 6. Remove associate dentists
    const dentists = getDentistsRaw();
    setDentistsRaw(dentists.filter(d => d.subscriberId !== target.id && d.subscriberId !== target.subscriberNumber && String(d.email || '').toLowerCase() !== target.email.toLowerCase()));

    // 7. Remove staff
    const staff = getStaffRaw();
    setStaffRaw(staff.filter(s => s.subscriberId !== target.id && s.subscriberId !== target.subscriberNumber && String(s.email || '').toLowerCase() !== target.email.toLowerCase()));

    // 8. Remove associated clinics
    const clinics = getClinicsRaw();
    setClinicsRaw(clinics.filter(c => c.subscriberId !== target.id && c.subscriberId !== target.subscriberNumber));

    // 9. Remove associated subscriptions
    const subscriptions = getSubscriptionsRaw();
    setSubscriptionsRaw(subscriptions.filter(s => s.subscriberId !== target.id && s.subscriberId !== target.subscriberNumber && s.id !== target.subscriptionId));

    // 10. Remove associated payments
    const payments = safeRead<Array<Record<string, unknown>>>(PAYMENTS_KEY, []);
    safeWrite(PAYMENTS_KEY, payments.filter(p => p.subscriberId !== target.id && p.subscriberId !== target.subscriberNumber && p.registrationId !== target.registrationId && String(p.payerEmail || '').toLowerCase() !== target.email.toLowerCase()));

    // 11. Log activity
    logActivity(
      'Subscriber Permanently Deleted',
      `${target.businessName} (${target.subscriberNumber || target.id}) and all linked clinic accounts were permanently removed.`
    );

    return { ok: true, data: target };
  },

  getSubscriberSummary: () => {
    const subscribers = mockPlatformManagementService.listSubscribers();
    const registrations = getRegistrations();
    return {
      total: subscribers.length,
      active: subscribers.filter(item => item.accountStatus === 'active').length,
      pendingRegistrations: registrations.filter(reg => reg.paymentStatus === 'pending_verification' || reg.paymentStatus === 'unpaid').length,
      suspended: subscribers.filter(item => item.accountStatus === 'suspended').length,
      expired: subscribers.filter(item => item.subscriptionStatus === 'expired').length,
      rejectedRegistrations: registrations.filter(reg => reg.paymentStatus === 'rejected').length
    };
  },

  searchSubscribers: (records: Subscriber[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter(item => [
      item.subscriberNumber,
      item.businessName,
      item.primaryClinicName,
      item.email,
      item.planId
    ].some(value => value.toLowerCase().includes(term)));
  },

  filterSubscribers: (records: Subscriber[], filters: SubscriberFilters, registrations: RegistrationLike[]) => {
    let next = records;
    if (filters.tab === 'active') next = next.filter(item => item.accountStatus === 'active' && item.subscriptionStatus !== 'expired');
    if (filters.tab === 'suspended') next = next.filter(item => item.accountStatus === 'suspended');
    if (filters.tab === 'expired') next = next.filter(item => item.subscriptionStatus === 'expired');
    if (filters.tab === 'rejected') return [];
    next = mockPlatformManagementService.searchSubscribers(next, filters.search);
    if (filters.plan !== 'all') next = next.filter(item => item.planId === filters.plan);
    if (filters.paymentStatus !== 'all') next = next.filter(item => item.paymentStatus === filters.paymentStatus);
    if (filters.subscriptionStatus !== 'all') next = next.filter(item => item.subscriptionStatus === filters.subscriptionStatus);
    if (filters.accountStatus !== 'all') next = next.filter(item => item.accountStatus === filters.accountStatus);
    if (filters.registeredDate) next = next.filter(item => item.registeredAt === filters.registeredDate);
    if (filters.tab === 'pending') {
      const pendingIds = new Set(registrations.filter(reg => reg.paymentStatus === 'pending_verification' || reg.paymentStatus === 'unpaid').map(reg => reg.id));
      next = next.filter(item => item.accountStatus === 'pending' || (item.registrationId && pendingIds.has(item.registrationId)));
    }
    return next;
  },

  sortSubscribers: (records: Subscriber[], sort: SortState) => [...records].sort((a, b) => {
    const direction = sort.direction === 'asc' ? 1 : -1;
    return compareValue(a[sort.field as keyof Subscriber], b[sort.field as keyof Subscriber]) * direction;
  }),

  paginateSubscribers: (records: Subscriber[], page: number, pageSize: number) => records.slice((page - 1) * pageSize, page * pageSize),

  listRegistrations: () => getRegistrations(),
  listPayments: () => getPayments(),
  listClinics: () => getClinicsRaw(),
  listSubscriptions: () => getSubscriptionsRaw(),
  listActivity: () => safeRead<ActivityLogLike[]>(ACTIVITY_KEY, []),

  listUsers: (): PlatformUser[] => {
    mockPlatformManagementService.ensureSeedData();
    const deletedIds = getDeletedSubscriberIds();
    const platformUsers = getUsersRaw();
    const dentists = getDentistsRaw();
    const staff = getStaffRaw();
    const subscribers = getSubscribersRaw();
    const validSubscriberIds = new Set(subscribers.map(subscriber => subscriber.id));
    const validClinicIds = new Set(getClinicsRaw().map(clinic => clinic.id));

    // 1. Map Associate Dentists to PlatformUser
    const mappedDentists: PlatformUser[] = dentists
      .filter(d =>
        !deletedIds.includes(String(d.id || '')) &&
        !deletedIds.includes(String(d.associateNumber || '')) &&
        Boolean(d.subscriberId) &&
        validSubscriberIds.has(String(d.subscriberId))
      )
      .map(d => {
        const subId = String(d.subscriberId);
        const authClinics = Array.isArray(d.authorizedClinics) ? d.authorizedClinics : [];
        const clinicIds = Array.isArray(d.clinicIds) ? d.clinicIds : [];
        const clinicsList = getClinicsRaw().filter(c =>
          c.subscriberId === subId &&
          (
            clinicIds.includes(c.id) ||
            authClinics.some((name: string) => String(name).toLowerCase() === c.name.toLowerCase())
          )
        );
        const scopedClinicIds = clinicIds.filter(id => validClinicIds.has(String(id)));
        return {
          id: String(d.id),
          userNumber: String(d.associateNumber || d.id),
          subscriberId: subId,
          clinicIds: clinicsList.length > 0 ? clinicsList.map(c => c.id) : scopedClinicIds,
          fullName: `${String(d.firstName || '')} ${String(d.lastName || '')}`.trim() || 'Associate Dentist',
          firstName: String(d.firstName || ''),
          lastName: String(d.lastName || ''),
          email: String(d.email || ''),
          mobileNumber: String(d.mobileNumber || d.phone || '0958343052'),
          role: 'associate',
          position: d.specialization ? `Associate Dentist (${d.specialization})` : String(d.designation || 'Associate Dentist'),
          accountStatus: (d.status === 'suspended' ? 'suspended' : d.status === 'inactive' ? 'deactivated' : 'active') as AccountStatus,
          mustChangePassword: Boolean(d.mustChangePassword),
          registeredAt: String(d.createdAt ? String(d.createdAt).split('T')[0] : '2026-08-01'),
          lastLoginAt: String(d.lastLoginAt || 'Recent'),
          createdAt: String(d.createdAt ? String(d.createdAt).split('T')[0] : '2026-08-01'),
          updatedAt: String(d.updatedAt ? String(d.updatedAt).split('T')[0] : today())
        };
      });

    // 2. Map Staff Members to PlatformUser
    const mappedStaff: PlatformUser[] = staff
      .filter(s =>
        !deletedIds.includes(String(s.id || '')) &&
        !deletedIds.includes(String(s.staffNumber || '')) &&
        Boolean(s.subscriberId) &&
        validSubscriberIds.has(String(s.subscriberId))
      )
      .map(s => {
        const subId = String(s.subscriberId);
        const authClinics = Array.isArray(s.authorizedClinics) ? s.authorizedClinics : [];
        const clinicIds = Array.isArray(s.clinicIds) ? s.clinicIds.map(String) : [];
        const clinicsList = getClinicsRaw().filter(c =>
          c.subscriberId === subId &&
          authClinics.some((name: string) => String(name).toLowerCase() === c.name.toLowerCase())
        );
        const scopedClinicIds = clinicIds.filter(id => validClinicIds.has(id));
        return {
          id: String(s.id),
          userNumber: String(s.staffNumber || s.id),
          subscriberId: subId,
          clinicIds: clinicsList.length > 0 ? clinicsList.map(c => c.id) : scopedClinicIds,
          fullName: `${String(s.firstName || '')} ${String(s.lastName || '')}`.trim() || 'Staff Member',
          firstName: String(s.firstName || ''),
          lastName: String(s.lastName || ''),
          email: String(s.email || ''),
          mobileNumber: String(s.mobileNumber || s.phoneNumber || '09163315602'),
          role: 'staff',
          position: String(s.role || 'Staff Member'),
          accountStatus: (s.status === 'suspended' ? 'suspended' : s.status === 'inactive' ? 'deactivated' : 'active') as AccountStatus,
          mustChangePassword: Boolean(s.mustChangePassword),
          registeredAt: String(s.createdAt ? String(s.createdAt).split('T')[0] : '2026-08-01'),
          lastLoginAt: String(s.lastLoginAt || 'Recent'),
          createdAt: String(s.createdAt ? String(s.createdAt).split('T')[0] : '2026-08-01'),
          updatedAt: String(s.updatedAt ? String(s.updatedAt).split('T')[0] : today())
        };
      });

    const existingEmails = new Set<string>();
    const allMerged: PlatformUser[] = [];

    [...mappedDentists, ...mappedStaff, ...platformUsers].forEach(u => {
      if (!u.email || existingEmails.has(u.email.toLowerCase())) return;
      if (deletedIds.includes(u.id) || deletedIds.includes(u.userNumber)) return;
      existingEmails.add(u.email.toLowerCase());
      allMerged.push(u);
    });

    return allMerged;
  },

  getUserById: (userId: string) => mockPlatformManagementService.listUsers().find(item => item.id === userId || item.userNumber === userId) || null,
  getUsersBySubscriberId: (subscriberId: string) => mockPlatformManagementService.listUsers().filter(item => item.subscriberId === subscriberId),
  getUsersByClinicId: (clinicId: string) => mockPlatformManagementService.listUsers().filter(item => item.clinicIds.includes(clinicId)),

  updateUser: (userId: string, update: Partial<PlatformUser>): ServiceResult<PlatformUser> => {
    const users = mockPlatformManagementService.listUsers();
    const target = users.find(item => item.id === userId || item.userNumber === userId);
    if (!target) return { ok: false, error: 'User record not found.' };

    const updated = { ...target, ...update, updatedAt: today() };

    // Update in platform_users if present
    const rawUsers = getUsersRaw();
    if (rawUsers.some(u => u.id === userId || u.userNumber === userId)) {
      setUsersRaw(rawUsers.map(item => (item.id === userId || item.userNumber === userId) ? updated : item));
    }

    // Update in dentists store if present
    const dentists = getDentistsRaw();
    if (dentists.some(d => d.id === userId || d.associateNumber === userId)) {
      setDentistsRaw(dentists.map(d => {
        if (d.id === userId || d.associateNumber === userId) {
          return {
            ...d,
            status: update.accountStatus === 'suspended' ? 'suspended' : update.accountStatus === 'deactivated' ? 'inactive' : 'active',
            clinicIds: update.clinicIds || d.clinicIds,
            email: update.email || d.email,
            mobileNumber: update.mobileNumber || d.mobileNumber,
            updatedAt: new Date().toISOString()
          };
        }
        return d;
      }));
    }

    // Update in staff store if present
    const staff = getStaffRaw();
    if (staff.some(s => s.id === userId || s.staffNumber === userId)) {
      setStaffRaw(staff.map(s => {
        if (s.id === userId || s.staffNumber === userId) {
          return {
            ...s,
            status: update.accountStatus === 'suspended' ? 'suspended' : update.accountStatus === 'deactivated' ? 'inactive' : 'active',
            email: update.email || s.email,
            mobileNumber: update.mobileNumber || s.mobileNumber,
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      }));
    }

    logActivity('User Updated', `${updated.fullName} was updated.`);
    return { ok: true, data: updated };
  },

  completePasswordChangeByEmail: (email: string): ServiceResult<PlatformUser> => {
    const target = mockPlatformManagementService.listUsers().find(item => item.email.toLowerCase() === email.toLowerCase());
    if (!target) return { ok: false, error: 'User record not found for password completion.' };

    const result = mockPlatformManagementService.updateUser(target.id, {
      mustChangePassword: false,
      resetRequired: false,
      lastLoginAt: new Date().toISOString()
    });

  if (result.ok) {
      saveAuthUserStatus(email, target.accountStatus, false);
      const normalizedEmail = email.toLowerCase();
      safeWrite(REGISTRATIONS_KEY, getRegistrations().map(registration =>
        String(registration.ownerEmail || '').toLowerCase() === normalizedEmail
          ? { ...registration, tempPassword: '', registrationStatus: 'account_ready', updatedDate: today() }
          : registration
      ));
      logActivity('Password Change Completed', `${target.fullName} completed first-login password setup.`);
    }

    return result;
  },

  activateUser: (userId: string) => mockPlatformManagementService.updateUser(userId, { accountStatus: 'active' }),
  suspendUser: (userId: string, reason: string) => {
    const user = mockPlatformManagementService.getUserById(userId);
    if (!user) return { ok: false, error: 'User record not found.' };
    const result = mockPlatformManagementService.updateUser(userId, { accountStatus: 'suspended', suspendedAt: today(), suspensionReason: reason });
    if (result.ok) {
      saveAuthUserStatus(user.email, 'suspended');
      logActivity('User Suspended', `${user.fullName} was suspended. Reason: ${reason}`);
    }
    return result;
  },

  reactivateUser: (userId: string) => {
    const user = mockPlatformManagementService.getUserById(userId);
    if (!user) return { ok: false, error: 'User record not found.' };
    const result = mockPlatformManagementService.updateUser(userId, { accountStatus: 'active', suspendedAt: undefined, suspensionReason: undefined });
    if (result.ok) {
      saveAuthUserStatus(user.email, 'active');
      logActivity('User Reactivated', `${user.fullName} was reactivated.`);
    }
    return result;
  },

  deactivateUser: (userId: string, reason: string) => {
    const user = mockPlatformManagementService.getUserById(userId);
    if (!user) return { ok: false, error: 'User record not found.' };
    const result = mockPlatformManagementService.updateUser(userId, { accountStatus: 'deactivated', deactivatedAt: today(), deactivationReason: reason });
    if (result.ok) {
      saveAuthUserStatus(user.email, 'suspended');
      logActivity('User Deactivated', `${user.fullName} was soft-deactivated. Reason: ${reason}`);
    }
    return result;
  },

  initiateMockPasswordReset: (userId: string) => {
    const user = mockPlatformManagementService.getUserById(userId);
    if (!user) return { ok: false, error: 'User record not found.' };
    const result = mockPlatformManagementService.updateUser(userId, { mustChangePassword: true, resetRequired: true });
    if (result.ok) {
      saveAuthUserStatus(user.email, user.accountStatus, true);
      logActivity('Mock Password Reset Initiated', `A development-only password reset was initiated for ${user.fullName}.`);
    }
    return result;
  },

  deleteUser: (userId: string): ServiceResult<PlatformUser> => {
    const users = mockPlatformManagementService.listUsers();
    const target = users.find(item => item.id === userId || item.userNumber === userId);
    if (!target) return { ok: false, error: 'User record not found.' };

    // 1. Remove from platform users
    setUsersRaw(getUsersRaw().filter(item => item.id !== target.id && item.userNumber !== target.userNumber));
    
    // 2. Remove from dentists store
    setDentistsRaw(getDentistsRaw().filter(d => d.id !== target.id && d.associateNumber !== target.userNumber));

    // 3. Remove from staff store
    setStaffRaw(getStaffRaw().filter(s => s.id !== target.id && s.staffNumber !== target.userNumber));

    // 4. Also clean from auth users
    const authUsers = safeRead<Array<Record<string, unknown>>>(AUTH_USERS_KEY, []);
    safeWrite(AUTH_USERS_KEY, authUsers.filter(u => String(u.email || '').toLowerCase() !== target.email.toLowerCase()));

    logActivity('User Permanently Deleted', `${target.fullName} (${target.position || target.role}) was permanently removed.`);
    return { ok: true, data: target };
  },

  searchUsers: (records: PlatformUser[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter(item => [
      item.userNumber,
      item.fullName,
      item.email,
      item.position,
      item.role
    ].some(value => value.toLowerCase().includes(term)));
  },

  filterUsers: (records: PlatformUser[], filters: UserFilters) => {
    let next = mockPlatformManagementService.searchUsers(records, filters.search);
    if (filters.role !== 'all') next = next.filter(item => item.role === filters.role);
    if (filters.subscriberId !== 'all') next = next.filter(item => item.subscriberId === filters.subscriberId);
    if (filters.clinicId !== 'all') next = next.filter(item => item.clinicIds.includes(filters.clinicId));
    if (filters.accountStatus !== 'all') next = next.filter(item => item.accountStatus === filters.accountStatus);
    if (filters.registeredDate) next = next.filter(item => item.registeredAt === filters.registeredDate);
    return next;
  },

  sortUsers: (records: PlatformUser[], sort: SortState) => [...records].sort((a, b) => {
    const direction = sort.direction === 'asc' ? 1 : -1;
    return compareValue(a[sort.field as keyof PlatformUser], b[sort.field as keyof PlatformUser]) * direction;
  }),

  paginateUsers: (records: PlatformUser[], page: number, pageSize: number) => records.slice((page - 1) * pageSize, page * pageSize),

  getUserSummary: () => {
    const users = mockPlatformManagementService.listUsers();
    return {
      total: users.length,
      owners: users.filter(item => item.role === 'clinic_owner').length,
      associates: users.filter(item => item.role === 'associate').length,
      staff: users.filter(item => item.role === 'staff').length,
      active: users.filter(item => item.accountStatus === 'active').length,
      suspended: users.filter(item => item.accountStatus === 'suspended').length
    };
  },

  getStatusBadgeClass: (status: AccountStatus | SubscriptionStatus | string) => {
    if (status === 'active' || status === 'approved') return 'success';
    if (status === 'suspended' || status === 'rejected' || status === 'deactivated' || status === 'cancelled') return 'danger';
    if (status === 'expired') return 'danger';
    if (status === 'pending' || status === 'pending_verification' || status === 'unpaid' || status === 'expiring_soon') return 'warning';
    return 'info';
  }
};
