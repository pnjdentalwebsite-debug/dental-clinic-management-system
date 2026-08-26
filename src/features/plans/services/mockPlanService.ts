import type { MockSubscription, Subscriber } from '../../platformManagement/types';
import type { Plan, PlanFilters, PlanFormData, PlanHistoryRecord, PlanResult, PlanSort } from '../types';
import { validatePlanForm } from '../validation/planValidation';

const PLANS_KEY = 'pnj_mock_plans';
const PLAN_HISTORY_KEY = 'pnj_mock_plan_history';
const ACTIVITY_KEY = 'pnj_mock_activity_logs';
const SUBSCRIBERS_KEY = 'pnj_mock_subscribers';
const SUBSCRIPTIONS_KEY = 'pnj_mock_subscriptions';
const DELETED_PLANS_KEY = 'pnj_mock_deleted_plans';

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
const getDeletedPlanKeys = (): string[] => safeRead<string[]>(DELETED_PLANS_KEY, []).map(s => String(s || '').toLowerCase());

export const featureCatalog = [
  ['patient_management', 'Patient Management', 'Manage patient records and notes.'],
  ['appointment_management', 'Appointment Management', 'Create and manage appointments.'],
  ['calendar', 'Calendar', 'Clinic calendar visibility.'],
  ['recalls', 'Recalls', 'Recall workflow support.'],
  ['waitlist', 'Waitlist', 'Appointment waitlist management.'],
  ['laboratories', 'Laboratories', 'Laboratory relationship tracking.'],
  ['billing', 'Billing', 'Billing workflows.'],
  ['payments', 'Payments', 'Payment tracking.'],
  ['basic_reports', 'Basic Reports', 'Standard operational reports.'],
  ['advanced_reports', 'Advanced Reports', 'Expanded clinic reporting.'],
  ['analytics', 'Analytics', 'Platform analytics and metrics.'],
  ['online_booking', 'Online Booking', 'Public booking intake.'],
  ['google_calendar', 'Google Calendar', 'Calendar integration placeholder.'],
  ['notifications', 'Notifications', 'Notification center access.'],
  ['data_restore', 'Data Restore', 'Restore workflow access.'],
  ['priority_support', 'Priority Support', 'Priority support marker.'],
  ['realtime_updates', 'Realtime Updates', 'Realtime UI capability placeholder.']
] as const;

export const limitCatalog = [
  ['clinics', 'Clinics'],
  ['laboratories', 'Laboratories'],
  ['clinic_owners', 'Clinic Owners'],
  ['associates', 'Associate Dentists'],
  ['staff', 'Staff'],
  ['total_users', 'Total Users'],
  ['storage_mb', 'Storage MB'],
  ['monthly_appointments', 'Monthly Appointments'],
  ['reports', 'Reports'],
  ['online_bookings', 'Online Bookings']
] as const;

const makeFeatures = (enabledKeys: string[]) => featureCatalog.map(([key, label, description]) => ({
  key,
  label,
  description,
  enabled: enabledKeys.includes(key),
  availabilityNote: enabledKeys.includes(key) ? 'Included in plan.' : 'Not included in this tier.'
}));

const makeLimits = (plan: 'basic' | 'plus' | 'max') => limitCatalog.map(([key, label]) => {
  const byPlan: Record<string, number | 'unlimited' | 'pending' | 'not_included'> = plan === 'basic'
    ? { clinics: 1, laboratories: 'not_included', clinic_owners: 1, associates: 1, staff: 3, total_users: 5, storage_mb: 1024, monthly_appointments: 300, reports: 3, online_bookings: 'not_included' }
    : plan === 'plus'
      ? { clinics: 3, laboratories: 2, clinic_owners: 2, associates: 6, staff: 20, total_users: 28, storage_mb: 5120, monthly_appointments: 1500, reports: 10, online_bookings: 'pending' }
      : { clinics: 'unlimited', laboratories: 'unlimited', clinic_owners: 'unlimited', associates: 'unlimited', staff: 'unlimited', total_users: 'unlimited', storage_mb: 51200, monthly_appointments: 'unlimited', reports: 'unlimited', online_bookings: 'unlimited' };
  const value = byPlan[key];
  if (typeof value === 'number') return { key, label, type: 'number' as const, value };
  return { key, label, type: value as 'unlimited' | 'pending' | 'not_included' };
});

const seedPlans: Plan[] = [
  {
    id: 'PLAN-BASIC',
    planCode: 'basic',
    name: 'Basic',
    slug: 'basic',
    shortDescription: 'Minimum essential features for small or starting dental clinics.',
    fullDescription: 'Basic provides essential patient charting and appointment management for early-stage dental clinic operations.',
    monthlyPrice: 5000,
    annualPrice: 50000,
    currency: 'PHP',
    billingCycles: ['monthly', 'annual'],
    status: 'active',
    visibility: 'public',
    isRecommended: false,
    badgeLabel: 'Starter',
    displayOrder: 1,
    features: makeFeatures(['patient_management', 'appointment_management', 'calendar', 'basic_reports']),
    limits: makeLimits('basic'),
    subscriberCount: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'PLAN-PLUS',
    planCode: 'plus',
    name: 'Plus',
    slug: 'plus',
    shortDescription: 'More features and higher limits than Basic.',
    fullDescription: 'Plus expands clinic operations with laboratory network support, patient recalls, waitlist queue, billing, and richer financial reports.',
    monthlyPrice: 8500,
    annualPrice: 85000,
    currency: 'PHP',
    billingCycles: ['monthly', 'annual'],
    status: 'active',
    visibility: 'public',
    isRecommended: true,
    badgeLabel: 'Most Popular',
    displayOrder: 2,
    features: makeFeatures(['patient_management', 'appointment_management', 'calendar', 'recalls', 'waitlist', 'laboratories', 'billing', 'payments', 'basic_reports', 'advanced_reports', 'notifications']),
    limits: makeLimits('plus'),
    subscriberCount: 0,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'PLAN-MAX',
    planCode: 'max',
    name: 'Max',
    slug: 'max',
    shortDescription: 'All currently available system features and the highest prototype limits.',
    fullDescription: 'Max enables every platform feature, unlimited clinic branches, unlimited associates and staff, priority technical support, and complete multi-location data isolation.',
    monthlyPrice: 10000,
    annualPrice: 100000,
    currency: 'PHP',
    billingCycles: ['monthly', 'annual'],
    status: 'active',
    visibility: 'public',
    isRecommended: false,
    badgeLabel: 'Enterprise',
    displayOrder: 3,
    features: makeFeatures(featureCatalog.map(([key]) => key)),
    limits: makeLimits('max'),
    subscriberCount: 1,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    createdBy: 'system',
    updatedBy: 'system'
  }
];

const logActivity = (event: string, details: string) => {
  const logs = safeRead<Array<{ id: string; timestamp: string; event: string; details: string; role: string }>>(ACTIVITY_KEY, []);
  safeWrite(ACTIVITY_KEY, [{ id: `LOG-${Date.now()}`, timestamp: nowText(), event, details, role: 'platform_owner' }, ...logs]);
};

const addHistory = (planId: string, action: string, details: string) => {
  const history = safeRead<PlanHistoryRecord[]>(PLAN_HISTORY_KEY, []);
  safeWrite(PLAN_HISTORY_KEY, [{ id: `PH-${Date.now()}`, planId, action, details, createdAt: nowText(), actor: 'platform_owner' }, ...history]);
  logActivity(`Plan ${action}`, details);
};

const readPlans = () => {
  const deleted = getDeletedPlanKeys();
  const raw = safeRead<Plan[]>(PLANS_KEY, []);
  return raw.filter(p => !deleted.includes(p.id.toLowerCase()) && !deleted.includes(p.planCode.toLowerCase()));
};
const writePlans = (plans: Plan[]) => safeWrite(PLANS_KEY, plans);
const planMatches = (plan: Plan, value: string) => [plan.name, plan.planCode, plan.slug, plan.shortDescription, plan.status, plan.visibility].some(item => item.toLowerCase().includes(value));

const countReferences = (plan: Plan) => {
  const subscribers = safeRead<Subscriber[]>(SUBSCRIBERS_KEY, []);
  const subscriptions = safeRead<MockSubscription[]>(SUBSCRIPTIONS_KEY, []);
  const planKeys = new Set([plan.id, plan.name, plan.planCode]);
  return {
    subscribers: subscribers.filter(item => planKeys.has(item.planId)).length,
    subscriptions: subscriptions.filter(item => planKeys.has(item.planId)).length
  };
};

const withSubscriberCount = (plan: Plan): Plan => ({ ...plan, subscriberCount: countReferences(plan).subscribers });

export const mockPlanService = {
  initializePlans: () => {
    const existing = readPlans();
    if (existing.length === 0) {
      writePlans(seedPlans);
      return seedPlans.map(withSubscriberCount);
    }
    // Update default system plan prices/descriptions if existing records have legacy values
    const updated = existing.map(plan => {
      const seed = seedPlans.find(s => s.planCode === plan.planCode || s.id === plan.id);
      if (seed && (plan.monthlyPrice === 0 || plan.monthlyPrice === 3490 || plan.monthlyPrice === 7990)) {
        return {
          ...plan,
          monthlyPrice: seed.monthlyPrice,
          annualPrice: seed.annualPrice,
          shortDescription: seed.shortDescription,
          features: seed.features,
          limits: seed.limits
        };
      }
      return plan;
    });
    const codes = new Set(updated.map(plan => plan.planCode.toLowerCase()));
    const next = [...updated, ...seedPlans.filter(plan => !codes.has(plan.planCode))];
    writePlans(next);
    return next.map(withSubscriberCount);
  },

  listPlans: () => mockPlanService.initializePlans().sort((a, b) => a.displayOrder - b.displayOrder),
  getPlanById: (id: string) => mockPlanService.listPlans().find(plan => plan.id === id) || null,
  getPlanByCode: (code: string) => mockPlanService.listPlans().find(plan => plan.planCode.toLowerCase() === code.toLowerCase() || plan.name.toLowerCase() === code.toLowerCase()) || null,
  getPlanHistory: (planId: string) => safeRead<PlanHistoryRecord[]>(PLAN_HISTORY_KEY, []).filter(item => item.planId === planId),

  validateUniqueCode: (code: string, currentPlanId?: string) => !mockPlanService.listPlans().some(plan => plan.id !== currentPlanId && plan.planCode.toLowerCase() === code.toLowerCase()),
  validateUniqueSlug: (slug: string, currentPlanId?: string) => !mockPlanService.listPlans().some(plan => plan.id !== currentPlanId && plan.slug.toLowerCase() === slug.toLowerCase()),

  createPlan: (data: PlanFormData, draft = false): PlanResult<Plan> => {
    const plans = mockPlanService.listPlans();
    const payload = { ...data, status: draft ? 'draft' as const : data.status };
    const validation = validatePlanForm(payload, plans);
    if (!validation.valid) return { ok: false, error: Object.values(validation.errors)[0] };
    const plan: Plan = {
      ...payload,
      id: `PLAN-${Date.now()}`,
      planCode: payload.planCode.trim().toLowerCase(),
      slug: payload.slug.trim().toLowerCase(),
      subscriberCount: 0,
      createdAt: today(),
      updatedAt: today(),
      createdBy: 'platform_owner',
      updatedBy: 'platform_owner'
    };
    writePlans([...plans, plan]);
    addHistory(plan.id, 'Created', `${plan.name} was created.`);
    return { ok: true, data: plan };
  },

  updatePlan: (planId: string, data: PlanFormData): PlanResult<Plan> => {
    const plans = mockPlanService.listPlans();
    const target = plans.find(plan => plan.id === planId);
    if (!target) return { ok: false, error: 'Plan not found.' };
    const validation = validatePlanForm(data, plans, planId);
    if (!validation.valid) return { ok: false, error: Object.values(validation.errors)[0] };
    const updated: Plan = { ...target, ...data, planCode: data.planCode.trim().toLowerCase(), slug: data.slug.trim().toLowerCase(), updatedAt: today(), updatedBy: 'platform_owner' };
    writePlans(plans.map(plan => plan.id === planId ? updated : plan));
    addHistory(planId, 'Edited', `${updated.name} was updated.`);
    return { ok: true, data: updated };
  },

  duplicatePlan: (planId: string): PlanResult<Plan> => {
    const source = mockPlanService.getPlanById(planId);
    if (!source) return { ok: false, error: 'Plan not found.' };
    const codeBase = `${source.planCode}-copy`;
    let suffix = 1;
    let code = codeBase;
    while (!mockPlanService.validateUniqueCode(code)) code = `${codeBase}-${suffix++}`;
    const copyData: PlanFormData = {
      ...source,
      name: `${source.name} Copy`,
      planCode: code,
      slug: code,
      status: 'draft',
      isRecommended: false,
      badgeLabel: 'Copy'
    };
    return mockPlanService.createPlan(copyData, true);
  },

  activatePlan: (planId: string) => mockPlanService.setPlanStatus(planId, 'active', 'Activated'),
  deactivatePlan: (planId: string) => mockPlanService.setPlanStatus(planId, 'inactive', 'Deactivated'),
  archivePlan: (planId: string) => mockPlanService.setPlanStatus(planId, 'archived', 'Archived'),
  restorePlan: (planId: string) => mockPlanService.setPlanStatus(planId, 'inactive', 'Restored'),

  setPlanStatus: (planId: string, status: Plan['status'], action: string): PlanResult<Plan> => {
    const plans = mockPlanService.listPlans();
    const target = plans.find(plan => plan.id === planId);
    if (!target) return { ok: false, error: 'Plan not found.' };
    const updated: Plan = { ...target, status, archivedAt: status === 'archived' ? today() : undefined, updatedAt: today(), updatedBy: 'platform_owner' };
    writePlans(plans.map(plan => plan.id === planId ? updated : plan));
    addHistory(planId, action, `${target.name} was ${action.toLowerCase()}.`);
    return { ok: true, data: updated };
  },

  permanentlyDeleteUnusedPlan: (planId: string): PlanResult<Plan> => {
    const plans = mockPlanService.listPlans();
    const target = plans.find(plan => plan.id === planId);
    if (!target) return { ok: false, error: 'Plan not found.' };
    const refs = countReferences(target);
    if (refs.subscribers > 0 || refs.subscriptions > 0) return { ok: false, error: 'Plan is currently in use by active subscribers and cannot be permanently deleted.' };

    // 1. Blacklist
    const deleted = safeRead<string[]>(DELETED_PLANS_KEY, []);
    safeWrite(DELETED_PLANS_KEY, Array.from(new Set([...deleted, target.id.toLowerCase(), target.planCode.toLowerCase()])));

    // 2. Remove from raw storage
    const raw = safeRead<Plan[]>(PLANS_KEY, []);
    writePlans(raw.filter(plan => plan.id !== planId && plan.planCode.toLowerCase() !== target.planCode.toLowerCase()));

    addHistory(planId, 'Permanently Deleted', `${target.name} was permanently deleted.`);
    return { ok: true, data: target };
  },

  getPublicRegistrationPlans: () => mockPlanService.listPlans().filter(plan => plan.status === 'active' && plan.visibility === 'public'),
  getSelectableSubscriberPlans: () => mockPlanService.listPlans().filter(plan => plan.status === 'active'),
  getPlanSubscribers: (plan: Plan) => {
    const subscribers = safeRead<Subscriber[]>(SUBSCRIBERS_KEY, []);
    const keys = new Set([plan.id, plan.name, plan.planCode]);
    return subscribers.filter(item => keys.has(item.planId));
  },
  getPlanSubscriptions: (plan: Plan) => {
    const subscriptions = safeRead<MockSubscription[]>(SUBSCRIPTIONS_KEY, []);
    const keys = new Set([plan.id, plan.name, plan.planCode]);
    return subscriptions.filter(item => keys.has(item.planId));
  },

  searchPlans: (plans: Plan[], search: string) => {
    const term = search.trim().toLowerCase();
    return term ? plans.filter(plan => planMatches(plan, term)) : plans;
  },

  filterPlans: (plans: Plan[], filters: PlanFilters) => {
    let next = mockPlanService.searchPlans(plans, filters.search);
    if (filters.tab !== 'all') next = next.filter(plan => plan.status === filters.tab);
    if (filters.status !== 'all') next = next.filter(plan => plan.status === filters.status);
    if (filters.visibility !== 'all') next = next.filter(plan => plan.visibility === filters.visibility);
    return next;
  },

  sortPlans: (plans: Plan[], sort: PlanSort) => [...plans].sort((a, b) => {
    const direction = sort.direction === 'asc' ? 1 : -1;
    return String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? '')) * direction;
  }),

  getPlanSummary: () => {
    const plans = mockPlanService.listPlans();
    return {
      total: plans.length,
      active: plans.filter(plan => plan.status === 'active').length,
      draft: plans.filter(plan => plan.status === 'draft').length,
      inactive: plans.filter(plan => plan.status === 'inactive').length,
      archived: plans.filter(plan => plan.status === 'archived').length,
      subscriberUsage: plans.reduce((sum, plan) => sum + plan.subscriberCount, 0)
    };
  },

  toFormData: (plan?: Plan): PlanFormData => ({
    planCode: plan?.planCode || '',
    name: plan?.name || '',
    slug: plan?.slug || '',
    shortDescription: plan?.shortDescription || '',
    fullDescription: plan?.fullDescription || '',
    monthlyPrice: plan?.monthlyPrice || 0,
    annualPrice: plan?.annualPrice || 0,
    currency: 'PHP',
    billingCycles: plan?.billingCycles || ['monthly', 'annual'],
    status: plan?.status || 'draft',
    visibility: plan?.visibility || 'internal',
    isRecommended: plan?.isRecommended || false,
    badgeLabel: plan?.badgeLabel || '',
    displayOrder: plan?.displayOrder || 0,
    features: plan?.features || makeFeatures([]),
    limits: plan?.limits || limitCatalog.map(([key, label]) => ({ key, label, type: 'pending' as const }))
  })
};
