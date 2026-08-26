import type { ActivityLogLike, PaymentLike, RegistrationLike, Subscriber, SubscriptionStatus } from '../../platformManagement/types';
import { mockPlanService } from '../../plans/services/mockPlanService';
import type { Plan } from '../../plans/types';
import type {
  BillingCycle,
  PriceSnapshot,
  Subscription,
  SubscriptionFilters,
  SubscriptionFormData,
  SubscriptionHistoryRecord,
  SubscriptionLifecycleStatus,
  SubscriptionPaymentStatus,
  SubscriptionResult,
  SubscriptionSort
} from '../types';
import {
  daysBetween,
  deriveSubscriptionStatus,
  getBillingCycleEndDate,
  isOperationalSubscriptionStatus,
  validateSubscriptionForm,
  validateSubscriptionTransition
} from '../validation/subscriptionValidation';

const SUBSCRIPTIONS_KEY = 'pnj_mock_subscriptions';
const SUBSCRIPTION_HISTORY_KEY = 'pnj_mock_subscription_history';
const SUBSCRIBERS_KEY = 'pnj_mock_subscribers';
const ACTIVITY_KEY = 'pnj_mock_activity_logs';
const PAYMENTS_KEY = 'pnj_mock_payments';
const REGISTRATIONS_KEY = 'pnj_mock_registrations';
const DELETED_SUBSCRIPTIONS_KEY = 'pnj_mock_deleted_subscriptions';

const today = () => new Date().toISOString().split('T')[0];
const nowText = () => new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();

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
const getDeletedSubscriptionKeys = (): string[] => safeRead<string[]>(DELETED_SUBSCRIPTIONS_KEY, []).map(s => String(s || '').toLowerCase());

const readSubscribers = () => safeRead<Subscriber[]>(SUBSCRIBERS_KEY, []);
const writeSubscribers = (records: Subscriber[]) => safeWrite(SUBSCRIBERS_KEY, records);
const readRegistrations = () => safeRead<RegistrationLike[]>(REGISTRATIONS_KEY, []);
const readSubscriptions = (): Subscription[] => {
  const deleted = getDeletedSubscriptionKeys();
  const raw = safeRead<Array<Partial<Subscription> & Record<string, unknown>>>(SUBSCRIPTIONS_KEY, []);
  return raw
    .map((item, index) => normalizeSubscription(item, index))
    .filter((item): item is Subscription => item !== null && !deleted.includes(item.id.toLowerCase()) && !deleted.includes(item.subscriptionNumber.toLowerCase()));
};
const writeSubscriptions = (records: Subscription[]) => safeWrite(SUBSCRIPTIONS_KEY, records);
const readHistory = () => safeRead<SubscriptionHistoryRecord[]>(SUBSCRIPTION_HISTORY_KEY, []);
const writeHistory = (records: SubscriptionHistoryRecord[]) => safeWrite(SUBSCRIPTION_HISTORY_KEY, records);

const statusForSubscriber = (status: SubscriptionLifecycleStatus): SubscriptionStatus => {
  if (status === 'draft') return 'pending';
  return status;
};

const paymentForApproved = (value?: string): SubscriptionPaymentStatus => {
  if (value === 'approved') return 'paid';
  if (value === 'rejected') return 'rejected';
  if (value === 'unpaid') return 'unpaid';
  if (value === 'pending_verification') return 'pending_verification';
  return 'paid';
};

const getPlanByAny = (value?: string) => {
  if (!value) return null;
  return mockPlanService.listPlans().find(plan =>
    plan.id === value ||
    plan.name.toLowerCase() === value.toLowerCase() ||
    plan.planCode.toLowerCase() === value.toLowerCase()
  ) || null;
};

const priceSnapshotForPlan = (plan: Plan, billingCycle: BillingCycle): PriceSnapshot => ({
  planId: plan.id,
  planName: plan.name,
  monthlyPrice: plan.monthlyPrice,
  annualPrice: plan.annualPrice,
  billingCycle,
  appliedAmount: billingCycle === 'annual' ? plan.annualPrice : billingCycle === 'custom' ? 0 : plan.monthlyPrice,
  currency: 'PHP'
});

const fallbackPlan = () => mockPlanService.getPlanByCode('plus') || mockPlanService.listPlans()[0];

const normalizeSubscription = (record: Partial<Subscription> & Record<string, unknown>, index: number): Subscription | null => {
  if (!record.id || !record.subscriberId) return null;
  const plan = getPlanByAny(String(record.planId || record.priceSnapshot?.planId || '')) || fallbackPlan();
  if (!plan) return null;
  const startDate = String(record.startDate || record.startedAt || record.createdAt || today());
  const expirationDate = String(record.expirationDate || record.expiresAt || getBillingCycleEndDate(startDate, 'annual'));
  const billingCycle = (record.billingCycle as BillingCycle) || 'annual';
  const status = deriveSubscriptionStatus((record.status as SubscriptionLifecycleStatus) || 'pending', expirationDate);
  const snapshot = record.priceSnapshot && typeof record.priceSnapshot === 'object'
    ? record.priceSnapshot as PriceSnapshot
    : priceSnapshotForPlan(plan, billingCycle);

  return {
    id: String(record.id),
    subscriptionNumber: String(record.subscriptionNumber || `SUBS-${String(index + 1).padStart(6, '0')}`),
    subscriberId: String(record.subscriberId),
    planId: String(record.planId || plan.name),
    registrationId: record.registrationId ? String(record.registrationId) : undefined,
    status,
    billingCycle,
    startDate,
    expirationDate,
    startedAt: startDate,
    expiresAt: expirationDate,
    trialStartDate: record.trialStartDate ? String(record.trialStartDate) : undefined,
    trialEndDate: record.trialEndDate ? String(record.trialEndDate) : undefined,
    renewalDate: record.renewalDate ? String(record.renewalDate) : undefined,
    cancelledAt: record.cancelledAt ? String(record.cancelledAt) : undefined,
    suspendedAt: record.suspendedAt ? String(record.suspendedAt) : undefined,
    reactivatedAt: record.reactivatedAt ? String(record.reactivatedAt) : undefined,
    autoRenew: Boolean(record.autoRenew ?? true),
    paymentStatus: (record.paymentStatus as SubscriptionPaymentStatus) || 'paid',
    priceSnapshot: snapshot,
    currency: 'PHP',
    createdAt: String(record.createdAt || startDate),
    updatedAt: String(record.updatedAt || today()),
    createdBy: String(record.createdBy || 'system'),
    updatedBy: String(record.updatedBy || 'system'),
    notes: record.notes ? String(record.notes) : '',
    cancellationReason: record.cancellationReason ? String(record.cancellationReason) : undefined,
    suspensionReason: record.suspensionReason ? String(record.suspensionReason) : undefined,
    renewalStatus: String(record.renewalStatus || (status === 'expired' ? 'renewal required' : 'current')),
    changeHistory: Array.isArray(record.changeHistory) ? record.changeHistory.map(String) : []
  };
};

const syncSubscriberFromSubscription = (subscription: Subscription) => {
  const subscribers = readSubscribers();
  const target = subscribers.find(item => item.id === subscription.subscriberId);
  if (!target) return;
  const updated: Subscriber = {
    ...target,
    subscriptionId: subscription.id,
    planId: subscription.priceSnapshot.planName || subscription.planId,
    subscriptionStatus: statusForSubscriber(subscription.status),
    paymentStatus: subscription.paymentStatus === 'paid' ? 'approved' : subscription.paymentStatus === 'partially_paid' ? 'pending_verification' : subscription.paymentStatus as Subscriber['paymentStatus'],
    expiresAt: subscription.expirationDate,
    activatedAt: subscription.status === 'active' || subscription.status === 'expiring_soon' ? target.activatedAt || subscription.startDate : target.activatedAt,
    suspendedAt: subscription.suspendedAt,
    updatedAt: today()
  };
  writeSubscribers(subscribers.map(item => item.id === updated.id ? updated : item));
};

const logActivity = (event: string, details: string) => {
  const logs = safeRead<ActivityLogLike[]>(ACTIVITY_KEY, []);
  safeWrite(ACTIVITY_KEY, [{ id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, timestamp: nowText(), event, details, role: 'platform_owner' }, ...logs]);
};

const addHistory = (
  subscriptionId: string,
  type: SubscriptionHistoryRecord['type'],
  action: string,
  details: string,
  patch: Partial<SubscriptionHistoryRecord> = {}
) => {
  const record: SubscriptionHistoryRecord = {
    id: `SH-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    subscriptionId,
    type,
    action,
    details,
    createdAt: nowText(),
    actor: 'platform_owner',
    ...patch
  };
  writeHistory([record, ...readHistory()]);
  logActivity(`Subscription ${action}`, details);
};

const createSubscriptionNumber = (count: number) => `SUBS-${String(count + 1).padStart(6, '0')}`;

const pendingRegistrationSubscriptions = (persisted: Subscription[]): Subscription[] => {
  const persistedRegistrationIds = new Set(persisted.map(item => item.registrationId).filter(Boolean));
  return readRegistrations()
    .filter(registration =>
      !persistedRegistrationIds.has(registration.id) &&
      ['unpaid', 'pending_verification'].includes(registration.paymentStatus)
    )
    .map((registration, index) => {
      const plan = getPlanByAny(registration.plan) || fallbackPlan();
      const startDate = registration.submittedDate || today();
      const status: SubscriptionLifecycleStatus = 'pending';
      return {
        id: `SCP-PENDING-${registration.id}`,
        subscriptionNumber: `PENDING-${String(index + 1).padStart(6, '0')}`,
        subscriberId: `REGISTRATION-${registration.id}`,
        planId: plan?.name || registration.plan || 'Plus',
        registrationId: registration.id,
        status,
        billingCycle: 'annual',
        startDate,
        expirationDate: getBillingCycleEndDate(startDate, 'annual'),
        startedAt: startDate,
        expiresAt: getBillingCycleEndDate(startDate, 'annual'),
        autoRenew: true,
        paymentStatus: registration.paymentStatus === 'pending_verification' ? 'pending_verification' : 'unpaid',
        priceSnapshot: plan ? priceSnapshotForPlan(plan, 'annual') : {
          planId: registration.plan || 'Plus',
          planName: registration.plan || 'Plus',
          monthlyPrice: 0,
          annualPrice: 0,
          billingCycle: 'annual',
          appliedAmount: 0,
          currency: 'PHP'
        },
        currency: 'PHP',
        createdAt: startDate,
        updatedAt: registration.updatedDate || startDate,
        createdBy: 'registration',
        updatedBy: 'registration',
        notes: `Pending registration for ${registration.clinicName}. Awaiting platform payment approval.`,
        renewalStatus: 'awaiting approval',
        changeHistory: [`Registration ${registration.id} is waiting for payment approval.`]
      };
    });
};

export const mockSubscriptionService = {
  initializeSubscriptions: () => {
    const next = mockSubscriptionService.recalculateAllStatuses();
    next.forEach(syncSubscriberFromSubscription);
    return next;
  },

  listSubscriptions: () => {
    const persisted = mockSubscriptionService.recalculateAllStatuses(false);
    return [...persisted, ...pendingRegistrationSubscriptions(persisted)];
  },
  getSubscriptionById: (id: string) => mockSubscriptionService.listSubscriptions().find(item => item.id === id || item.subscriptionNumber === id) || null,
  getSubscriptionBySubscriberId: (subscriberId: string) => mockSubscriptionService.listSubscriptions().filter(item => item.subscriberId === subscriberId),
  getCurrentSubscriptionBySubscriberId: (subscriberId: string) => mockSubscriptionService.getSubscriptionBySubscriberId(subscriberId).find(item => isOperationalSubscriptionStatus(item.status)) || mockSubscriptionService.getSubscriptionBySubscriberId(subscriberId)[0] || null,
  getSubscriptionsByPlanId: (planId: string) => mockSubscriptionService.listSubscriptions().filter(item => {
    const keys = [item.planId, item.priceSnapshot.planId, item.priceSnapshot.planName].map(value => value.toLowerCase());
    return keys.includes(planId.toLowerCase());
  }),
  getSubscriptionHistory: (subscriptionId: string) => readHistory().filter(item => item.subscriptionId === subscriptionId),
  listPaymentsForSubscription: (subscription: Subscription) => {
    const payments = safeRead<PaymentLike[]>(PAYMENTS_KEY, []);
    const subscriber = readSubscribers().find(item => item.id === subscription.subscriberId);
    return payments.filter(payment => payment.registrationId === subscription.registrationId || payment.registrationId === subscriber?.registrationId);
  },

  validateSubscriptionTransition,
  deriveSubscriptionStatus,
  validateSubscriberHasNoConflictingActiveSubscription: (subscriberId: string, currentSubscriptionId?: string) => {
    const conflict = mockSubscriptionService.listSubscriptions().find(item => item.subscriberId === subscriberId && item.id !== currentSubscriptionId && isOperationalSubscriptionStatus(item.status));
    return conflict ? { valid: false, message: 'This subscriber already has an operational subscription.' } : { valid: true };
  },

  recalculateAllStatuses: (write = true): Subscription[] => {
    const subscriptions = readSubscriptions();
    const next = subscriptions.map(item => {
      const status = deriveSubscriptionStatus(item.status, item.expirationDate);
      return status === item.status ? item : { ...item, status, renewalStatus: status === 'expired' ? 'renewal required' : item.renewalStatus, updatedAt: today() };
    });
    if (write) writeSubscriptions(next);
    return next;
  },

  createSubscription: (data: SubscriptionFormData, draft = false): SubscriptionResult<Subscription> => {
    const subscribers = readSubscribers();
    const plans = mockPlanService.listPlans();
    const subscriptions = mockSubscriptionService.listSubscriptions();
    const validation = validateSubscriptionForm({ ...data, status: draft ? 'draft' : data.status }, subscribers, plans, subscriptions);
    if (!validation.valid) return { ok: false, error: validation.message };
    const plan = getPlanByAny(data.planId)!;
    const status = draft ? 'draft' : data.status === 'draft' ? 'pending' : data.status;
    const subscription: Subscription = {
      id: `SCP-${Date.now()}`,
      subscriptionNumber: createSubscriptionNumber(subscriptions.length),
      subscriberId: data.subscriberId,
      planId: plan.name,
      status,
      billingCycle: data.billingCycle,
      startDate: data.startDate,
      expirationDate: data.expirationDate,
      startedAt: data.startDate,
      expiresAt: data.expirationDate,
      autoRenew: data.autoRenew,
      paymentStatus: data.paymentStatus,
      priceSnapshot: priceSnapshotForPlan(plan, data.billingCycle),
      currency: 'PHP',
      createdAt: today(),
      updatedAt: today(),
      createdBy: 'platform_owner',
      updatedBy: 'platform_owner',
      notes: data.notes,
      renewalStatus: 'current',
      changeHistory: ['Subscription created.']
    };
    writeSubscriptions([subscription, ...subscriptions]);
    syncSubscriberFromSubscription(subscription);
    addHistory(subscription.id, 'created', 'Created', `${subscription.subscriptionNumber} was created.`, { nextStatus: subscription.status, priceSnapshot: subscription.priceSnapshot });
    return { ok: true, data: subscription };
  },

  updateSubscription: (subscriptionId: string, patch: Pick<SubscriptionFormData, 'billingCycle' | 'autoRenew' | 'paymentStatus' | 'notes'>): SubscriptionResult<Subscription> => {
    const subscriptions = mockSubscriptionService.listSubscriptions();
    const target = subscriptions.find(item => item.id === subscriptionId);
    if (!target) return { ok: false, error: 'Subscription not found.' };
    const updated = { ...target, ...patch, updatedAt: today(), updatedBy: 'platform_owner' };
    writeSubscriptions(subscriptions.map(item => item.id === target.id ? updated : item));
    syncSubscriberFromSubscription(updated);
    addHistory(updated.id, 'updated', 'Updated', `${updated.subscriptionNumber} editable fields were updated.`);
    return { ok: true, data: updated };
  },

  renewSubscription: (subscriptionId: string, billingCycle: BillingCycle, newExpirationDate: string, planId?: string, paymentStatus: SubscriptionPaymentStatus = 'paid', notes = ''): SubscriptionResult<Subscription> => {
    const subscriptions = mockSubscriptionService.listSubscriptions();
    const target = subscriptions.find(item => item.id === subscriptionId);
    if (!target) return { ok: false, error: 'Subscription not found.' };
    if (target.status === 'draft') return { ok: false, error: 'Draft subscriptions cannot be renewed.' };
    if (target.status === 'cancelled') return { ok: false, error: 'Restore cancelled subscriptions before renewal.' };
    const baseDate = target.status === 'expired' || new Date(target.expirationDate) < new Date(today()) ? today() : target.expirationDate;
    if (new Date(newExpirationDate) <= new Date(baseDate)) return { ok: false, error: 'Renewal expiration must extend beyond the current expiration or today.' };
    const plan = getPlanByAny(planId || target.planId);
    if (!plan) return { ok: false, error: 'Selected plan is no longer available.' };
    if ((planId && plan.status !== 'active')) return { ok: false, error: 'Only active plans can be assigned during renewal.' };
    const updated: Subscription = {
      ...target,
      planId: plan.name,
      billingCycle,
      expirationDate: newExpirationDate,
      expiresAt: newExpirationDate,
      renewalDate: today(),
      status: 'active',
      paymentStatus,
      priceSnapshot: priceSnapshotForPlan(plan, billingCycle),
      notes: notes || target.notes,
      renewalStatus: 'current',
      updatedAt: today(),
      updatedBy: 'platform_owner',
      changeHistory: [...target.changeHistory, `Renewed through ${newExpirationDate}.`]
    };
    writeSubscriptions(subscriptions.map(item => item.id === target.id ? updated : item));
    syncSubscriberFromSubscription(updated);
    addHistory(updated.id, 'renewal', 'Renewed', `${updated.subscriptionNumber} was renewed.`, { previousExpiration: target.expirationDate, nextExpiration: updated.expirationDate, previousStatus: target.status, nextStatus: updated.status, priceSnapshot: updated.priceSnapshot });
    return { ok: true, data: updated };
  },

  changeSubscriptionPlan: (subscriptionId: string, planId: string, notes = ''): SubscriptionResult<Subscription> => {
    const subscriptions = mockSubscriptionService.listSubscriptions();
    const target = subscriptions.find(item => item.id === subscriptionId);
    if (!target) return { ok: false, error: 'Subscription not found.' };
    if (['cancelled', 'draft'].includes(target.status)) return { ok: false, error: 'This subscription status cannot change plans.' };
    const plan = getPlanByAny(planId);
    if (!plan || plan.status !== 'active') return { ok: false, error: 'Choose an active plan.' };
    const updated = { ...target, planId: plan.name, priceSnapshot: priceSnapshotForPlan(plan, target.billingCycle), notes: notes || target.notes, updatedAt: today(), updatedBy: 'platform_owner', changeHistory: [...target.changeHistory, `Plan changed from ${target.priceSnapshot.planName} to ${plan.name}.`] };
    writeSubscriptions(subscriptions.map(item => item.id === target.id ? updated : item));
    syncSubscriberFromSubscription(updated);
    addHistory(updated.id, 'plan_change', 'Plan Changed', `${updated.subscriptionNumber} changed from ${target.priceSnapshot.planName} to ${plan.name}.`, { previousPlanId: target.planId, nextPlanId: plan.name, priceSnapshot: updated.priceSnapshot });
    return { ok: true, data: updated };
  },

  extendExpiration: (subscriptionId: string, newExpirationDate: string, reason: string, note = ''): SubscriptionResult<Subscription> => {
    const subscriptions = mockSubscriptionService.listSubscriptions();
    const target = subscriptions.find(item => item.id === subscriptionId);
    if (!target) return { ok: false, error: 'Subscription not found.' };
    if (new Date(newExpirationDate) <= new Date(target.expirationDate)) return { ok: false, error: 'Extension must move expiration later than the current expiration.' };
    if (!reason.trim()) return { ok: false, error: 'Extension reason is required.' };
    const status = deriveSubscriptionStatus(target.status === 'expired' ? 'active' : target.status, newExpirationDate);
    const updated = { ...target, expirationDate: newExpirationDate, expiresAt: newExpirationDate, status, notes: note || target.notes, updatedAt: today(), updatedBy: 'platform_owner', changeHistory: [...target.changeHistory, `Expiration extended: ${reason}.`] };
    writeSubscriptions(subscriptions.map(item => item.id === target.id ? updated : item));
    syncSubscriberFromSubscription(updated);
    addHistory(updated.id, 'extension', 'Extended', `${updated.subscriptionNumber} expiration was extended. Reason: ${reason}`, { previousExpiration: target.expirationDate, nextExpiration: updated.expirationDate, previousStatus: target.status, nextStatus: updated.status });
    return { ok: true, data: updated };
  },

  suspendSubscription: (subscriptionId: string, reason: string, note = '') => mockSubscriptionService.setStatus(subscriptionId, 'suspended', 'Suspended', reason, note),
  reactivateSubscription: (subscriptionId: string) => {
    const target = mockSubscriptionService.getSubscriptionById(subscriptionId);
    if (!target) return { ok: false, error: 'Subscription not found.' };
    if (new Date(target.expirationDate) < new Date(today())) return { ok: false, error: 'Expired subscriptions must be renewed before reactivation.' };
    return mockSubscriptionService.setStatus(subscriptionId, deriveSubscriptionStatus('active', target.expirationDate), 'Reactivated');
  },
  cancelSubscription: (subscriptionId: string, reason: string, note = '') => mockSubscriptionService.setStatus(subscriptionId, 'cancelled', 'Cancelled', reason, note),
  restoreSubscription: (subscriptionId: string, replacementPlanId?: string) => {
    const target = mockSubscriptionService.getSubscriptionById(subscriptionId);
    if (!target) return { ok: false, error: 'Subscription not found.' };
    if (target.status !== 'cancelled') return { ok: false, error: 'Only cancelled subscriptions can be restored.' };
    const conflict = mockSubscriptionService.validateSubscriberHasNoConflictingActiveSubscription(target.subscriberId, target.id);
    if (!conflict.valid) return { ok: false, error: conflict.message };
    const plan = getPlanByAny(replacementPlanId || target.planId);
    if (!plan || plan.status !== 'active') return { ok: false, error: 'Choose an active replacement plan before restore.' };
    if (new Date(target.expirationDate) < new Date(today())) return { ok: false, error: 'Renew expired cancelled subscriptions before restoring.' };
    return mockSubscriptionService.setStatus(subscriptionId, deriveSubscriptionStatus('active', target.expirationDate), 'Restored', undefined, undefined, plan);
  },

  setStatus: (subscriptionId: string, nextStatus: SubscriptionLifecycleStatus, action: string, reason = '', note = '', replacementPlan?: Plan): SubscriptionResult<Subscription> => {
    const subscriptions = mockSubscriptionService.listSubscriptions();
    const target = subscriptions.find(item => item.id === subscriptionId);
    if (!target) return { ok: false, error: 'Subscription not found.' };
    if (nextStatus === 'suspended' && !reason.trim()) return { ok: false, error: 'Suspension reason is required.' };
    if (nextStatus === 'cancelled' && !reason.trim()) return { ok: false, error: 'Cancellation reason is required.' };
    const transition = validateSubscriptionTransition(target.status, nextStatus);
    if (!transition.valid) return { ok: false, error: transition.message };
    const plan = replacementPlan || getPlanByAny(target.planId);
    const updated: Subscription = {
      ...target,
      status: nextStatus,
      planId: plan?.name || target.planId,
      priceSnapshot: replacementPlan ? priceSnapshotForPlan(replacementPlan, target.billingCycle) : target.priceSnapshot,
      suspendedAt: nextStatus === 'suspended' ? today() : target.suspendedAt,
      suspensionReason: nextStatus === 'suspended' ? reason : target.suspensionReason,
      cancelledAt: nextStatus === 'cancelled' ? today() : target.cancelledAt,
      cancellationReason: nextStatus === 'cancelled' ? reason : target.cancellationReason,
      reactivatedAt: action === 'Reactivated' || action === 'Restored' ? today() : target.reactivatedAt,
      autoRenew: nextStatus === 'cancelled' ? false : target.autoRenew,
      notes: note || target.notes,
      renewalStatus: nextStatus === 'expired' ? 'renewal required' : target.renewalStatus,
      updatedAt: today(),
      updatedBy: 'platform_owner',
      changeHistory: [...target.changeHistory, `${action}${reason ? `: ${reason}` : ''}.`]
    };
    writeSubscriptions(subscriptions.map(item => item.id === target.id ? updated : item));
    syncSubscriberFromSubscription(updated);
    addHistory(updated.id, 'status', action, `${updated.subscriptionNumber} was ${action.toLowerCase()}${reason ? `. Reason: ${reason}` : '.'}`, { previousStatus: target.status, nextStatus: updated.status });
    return { ok: true, data: updated };
  },

  permanentlyDeleteSubscription: (subscriptionId: string): SubscriptionResult<Subscription> => {
    const subscriptions = mockSubscriptionService.listSubscriptions();
    const target = subscriptions.find(s => s.id === subscriptionId);
    if (!target) return { ok: false, error: 'Subscription not found.' };

    // 1. Blacklist
    const deleted = safeRead<string[]>(DELETED_SUBSCRIPTIONS_KEY, []);
    safeWrite(DELETED_SUBSCRIPTIONS_KEY, Array.from(new Set([...deleted, target.id.toLowerCase(), target.subscriptionNumber.toLowerCase()])));

    // 2. Remove from raw storage
    const raw = readSubscriptions();
    writeSubscriptions(raw.filter((s: Subscription) => s.id !== subscriptionId && s.subscriptionNumber !== target.subscriptionNumber));

    // 3. Clear subscriber link if attached
    const subscribers = readSubscribers();
    const subTarget = subscribers.find(item => item.subscriptionId === target.id || item.id === target.subscriberId);
    if (subTarget) {
      writeSubscribers(subscribers.map(item => item.id === subTarget.id ? { ...item, subscriptionId: '', subscriptionStatus: 'cancelled' } : item));
    }

    addHistory(subscriptionId, 'status', 'Permanently Deleted', `${target.subscriptionNumber} was permanently deleted.`);
    return { ok: true, data: target };
  },

  provisionSubscriptionForApprovedRegistration: (subscriber: Subscriber, reg: RegistrationLike): SubscriptionResult<Subscription> => {
    const existing = mockSubscriptionService.getSubscriptionBySubscriberId(subscriber.id).find(item => item.registrationId === reg.id || item.id === subscriber.subscriptionId);
    if (existing) {
      const updatedExisting: Subscription = {
        ...existing,
        registrationId: reg.id,
        status: 'active',
        paymentStatus: 'paid',
        planId: existing.planId || reg.plan,
        startedAt: subscriber.activatedAt || existing.startedAt || today(),
        expiresAt: subscriber.expiresAt || existing.expiresAt || getBillingCycleEndDate(today(), 'annual'),
        expirationDate: subscriber.expiresAt || existing.expirationDate || getBillingCycleEndDate(today(), 'annual'),
        updatedAt: today(),
        changeHistory: Array.from(new Set([...(existing.changeHistory || []), `Provisioned from approved registration ${reg.id}.`]))
      };
      const rawSubscriptions = readSubscriptions().map(item => item.id === existing.id ? updatedExisting : item);
      writeSubscriptions(rawSubscriptions);
      syncSubscriberFromSubscription(updatedExisting);
      return { ok: true, data: updatedExisting };
    }
    const plan = getPlanByAny(reg.plan) || fallbackPlan();
    if (!plan) return { ok: false, error: 'No active mock plan is available for provisioning.' };
    const startDate = subscriber.activatedAt || today();
    const data: SubscriptionFormData = {
      subscriberId: subscriber.id,
      planId: plan.id,
      billingCycle: 'annual',
      startDate,
      expirationDate: subscriber.expiresAt || getBillingCycleEndDate(startDate, 'annual'),
      autoRenew: true,
      paymentStatus: paymentForApproved(reg.paymentStatus),
      notes: `Provisioned from ${reg.id}.`,
      status: reg.paymentStatus === 'approved' ? 'active' : 'pending'
    };
    const created = mockSubscriptionService.createSubscription(data);
    if (created.ok && created.data) {
      const subscription = { ...created.data, id: subscriber.subscriptionId || created.data.id, registrationId: reg.id };
      const subscriptions = mockSubscriptionService.listSubscriptions().map(item => item.id === created.data!.id ? subscription : item);
      writeSubscriptions(subscriptions);
      syncSubscriberFromSubscription(subscription);
      addHistory(subscription.id, 'provisioned', 'Provisioned', `${subscription.subscriptionNumber} was provisioned from approved registration ${reg.id}.`);
      return { ok: true, data: subscription };
    }
    return created;
  },

  searchSubscriptions: (records: Subscription[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    const subscribers = readSubscribers();
    return records.filter(item => {
      const subscriber = subscribers.find(sub => sub.id === item.subscriberId);
      return [item.id, item.subscriptionNumber, item.planId, item.priceSnapshot.planName, item.status, subscriber?.businessName, subscriber?.email]
        .some(value => String(value || '').toLowerCase().includes(term));
    });
  },

  filterSubscriptions: (records: Subscription[], filters: SubscriptionFilters) => {
    let next = mockSubscriptionService.searchSubscriptions(records, filters.search);
    if (filters.tab !== 'all') next = next.filter(item => item.status === filters.tab);
    if (filters.subscriberId !== 'all') next = next.filter(item => item.subscriberId === filters.subscriberId);
    if (filters.planId !== 'all') next = next.filter(item => [item.planId, item.priceSnapshot.planId, item.priceSnapshot.planName].includes(filters.planId));
    if (filters.status !== 'all') next = next.filter(item => item.status === filters.status);
    if (filters.billingCycle !== 'all') next = next.filter(item => item.billingCycle === filters.billingCycle);
    if (filters.paymentStatus !== 'all') next = next.filter(item => item.paymentStatus === filters.paymentStatus);
    if (filters.startDate) next = next.filter(item => item.startDate === filters.startDate);
    if (filters.expirationDate) next = next.filter(item => item.expirationDate === filters.expirationDate);
    if (filters.autoRenew !== 'all') next = next.filter(item => String(item.autoRenew) === filters.autoRenew);
    return next;
  },

  sortSubscriptions: (records: Subscription[], sort: SubscriptionSort) => [...records].sort((a, b) => String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? '')) * (sort.direction === 'asc' ? 1 : -1)),
  paginateSubscriptions: (records: Subscription[], page: number, pageSize: number) => records.slice((page - 1) * pageSize, page * pageSize),
  getDaysRemaining: (subscription: Subscription) => daysBetween(today(), subscription.expirationDate),

  getSubscriptionSummary: () => {
    const records = mockSubscriptionService.listSubscriptions();
    return {
      total: records.length,
      active: records.filter(item => item.status === 'active').length,
      pending: records.filter(item => item.status === 'pending').length,
      expiringSoon: records.filter(item => item.status === 'expiring_soon').length,
      expired: records.filter(item => item.status === 'expired').length,
      suspended: records.filter(item => item.status === 'suspended').length,
      cancelled: records.filter(item => item.status === 'cancelled').length,
      draft: records.filter(item => item.status === 'draft').length
    };
  },

  toFormData: (subscription?: Subscription): SubscriptionFormData => ({
    subscriberId: subscription?.subscriberId || '',
    planId: subscription?.priceSnapshot.planId || subscription?.planId || '',
    billingCycle: subscription?.billingCycle || 'annual',
    startDate: subscription?.startDate || today(),
    expirationDate: subscription?.expirationDate || getBillingCycleEndDate(today(), 'annual'),
    autoRenew: subscription?.autoRenew ?? true,
    paymentStatus: subscription?.paymentStatus || 'paid',
    notes: subscription?.notes || '',
    status: subscription?.status || 'pending'
  })
};
