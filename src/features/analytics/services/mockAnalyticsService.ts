import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { mockPaymentService } from '../../payments/services/mockPaymentService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type { PlatformUser, RegistrationLike, Subscriber } from '../../platformManagement/types';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { makeSafeCsvFileName } from '../export/csvExport';
import { metricDefinitionByKey } from '../metricDefinitions';
import type { AnalyticsDateRange, AnalyticsFilter, AnalyticsReport, AnalyticsReportKey, AnalyticsWarning, ChartDataPoint, ChartSeries, DataQualitySeverity, ExportDefinition, MetricCardData, ReportDrilldownRow, ReportTableColumn, SavedReportView } from '../types';

const SAVED_VIEWS_KEY = 'pnj_mock_saved_report_views';
const FILTER_STATE_KEY = 'pnj_mock_analytics_filter_state';
const ANNOUNCEMENTS_KEY = 'pnj_mock_announcements';
const ANNOUNCEMENT_RECIPIENTS_KEY = 'pnj_mock_announcement_recipients';
const NOTIFICATIONS_KEY = 'pnj_mock_notifications';
const AUDIT_LOGS_KEY = 'pnj_mock_audit_logs';

const today = () => new Date().toISOString().split('T')[0];
const nowText = () => new Date().toLocaleTimeString('en-PH') + ' ' + new Date().toLocaleDateString('en-PH');
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const php = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(value);
const number = (value: number) => new Intl.NumberFormat('en-PH', { maximumFractionDigits: 2 }).format(value);
const percent = (value: number) => `${number(value)}%`;
const formatStatus = (value: string) => value.replaceAll('_', ' ');
const activePaymentStates = ['approved', 'partially_allocated', 'fully_allocated', 'partially_refunded', 'refunded'];

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

const asDate = (value?: string) => value ? new Date(`${value}T00:00:00`) : null;
const inRange = (value: string | undefined, range: AnalyticsDateRange) => {
  const date = asDate(value);
  if (!date) return false;
  return date >= asDate(range.startDate)! && date <= asDate(range.endDate)!;
};
const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const dateString = (date: Date) => date.toISOString().split('T')[0];

const dateRangeForPreset = (preset: AnalyticsDateRange['preset']): AnalyticsDateRange => {
  const current = new Date(`${today()}T00:00:00`);
  const startOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
  const startOfQuarter = new Date(current.getFullYear(), Math.floor(current.getMonth() / 3) * 3, 1);
  if (preset === 'today') return { preset, startDate: today(), endDate: today() };
  if (preset === 'last_7_days') return { preset, startDate: dateString(addDays(current, -6)), endDate: today() };
  if (preset === 'last_30_days') return { preset, startDate: dateString(addDays(current, -29)), endDate: today() };
  if (preset === 'this_month') return { preset, startDate: dateString(startOfMonth), endDate: today() };
  if (preset === 'previous_month') return { preset, startDate: dateString(new Date(current.getFullYear(), current.getMonth() - 1, 1)), endDate: dateString(new Date(current.getFullYear(), current.getMonth(), 0)) };
  if (preset === 'this_quarter') return { preset, startDate: dateString(startOfQuarter), endDate: today() };
  if (preset === 'this_year') return { preset, startDate: `${current.getFullYear()}-01-01`, endDate: today() };
  return { preset, startDate: dateString(addDays(current, -29)), endDate: today() };
};

const defaultFilters = (): AnalyticsFilter => ({
  dateRange: dateRangeForPreset('this_year'),
  comparison: 'previous_period',
  subscriberId: 'all',
  planId: 'all',
  subscriptionStatus: 'all',
  paymentStatus: 'all',
  clinicId: 'all',
  laboratoryId: 'all',
  userRole: 'all'
});

const countBy = <T,>(records: T[], getKey: (record: T) => string | undefined): ChartDataPoint[] => {
  const map = new Map<string, number>();
  records.forEach(record => {
    const key = getKey(record) || 'Unknown';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries()).map(([label, value]) => ({ label: formatStatus(label), value, formattedValue: number(value) }));
};

const countByDate = <T,>(records: T[], getDate: (record: T) => string | undefined): ChartDataPoint[] => {
  const map = new Map<string, number>();
  records.forEach(record => {
    const date = getDate(record);
    if (!date) return;
    map.set(date, (map.get(date) || 0) + 1);
  });
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value, formattedValue: number(value) }));
};

const chart = (id: string, title: string, description: string, data: ChartDataPoint[]): ChartSeries => ({ id, title, description, data, emptyMessage: 'No matching prototype records.' });
const metric = (id: string, value: number | string, formattedValue: string, status: MetricCardData['status'] = 'neutral', sourceModules: string[] = []): MetricCardData => {
  const definition = metricDefinitionByKey(id);
  return {
    id,
    label: definition?.label || id.split('_').map(item => item[0].toUpperCase() + item.slice(1)).join(' '),
    value,
    formattedValue,
    trend: 'neutral',
    status,
    description: definition?.description || 'Calculated from centralized mock services.',
    sourceModules: sourceModules.length ? sourceModules : definition?.sourceRecords || [],
    lastCalculatedAt: nowText()
  };
};

const filterSources = (filters: AnalyticsFilter) => {
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockPaymentService.initializePayments();
  mockClinicService.initializeClinics();
  mockLaboratoryService.initializeLaboratories();
  let subscribers = mockPlatformManagementService.listSubscribers();
  let users = mockPlatformManagementService.listUsers();
  let registrations = mockPlatformManagementService.listRegistrations() as RegistrationLike[];
  let subscriptions = mockSubscriptionService.listSubscriptions();
  let payments = mockPaymentService.listPayments();
  let clinics = mockClinicService.listClinics();
  let laboratories = mockLaboratoryService.listLaboratories();

  const planMatches = (value?: string) => {
    if (filters.planId === 'all') return true;
    const plan = mockPlanService.getPlanById(filters.planId) || mockPlanService.listPlans().find(item => [item.name, item.planCode].includes(filters.planId));
    const accepted = [filters.planId, plan?.id, plan?.name, plan?.planCode].filter(Boolean).map(item => String(item).toLowerCase());
    return accepted.includes(String(value || '').toLowerCase());
  };
  if (filters.subscriberId !== 'all') {
    subscribers = subscribers.filter(item => item.id === filters.subscriberId);
    users = users.filter(item => item.subscriberId === filters.subscriberId);
    subscriptions = subscriptions.filter(item => item.subscriberId === filters.subscriberId);
    payments = payments.filter(item => item.subscriberId === filters.subscriberId);
    clinics = clinics.filter(item => item.subscriberId === filters.subscriberId);
    laboratories = laboratories.filter(item => item.subscriberId === filters.subscriberId);
  }
  if (filters.planId !== 'all') {
    subscribers = subscribers.filter(item => planMatches(item.planId));
    subscriptions = subscriptions.filter(item => planMatches(item.planId) || planMatches(item.priceSnapshot.planId) || planMatches(item.priceSnapshot.planName));
    payments = payments.filter(item => item.planId === filters.planId);
    registrations = registrations.filter(item => item.plan === filters.planId || mockPlanService.getPlanByCode(item.plan)?.id === filters.planId);
  }
  if (filters.subscriptionStatus !== 'all') subscriptions = subscriptions.filter(item => item.status === filters.subscriptionStatus);
  if (filters.paymentStatus !== 'all') payments = payments.filter(item => item.status === filters.paymentStatus || item.verificationStatus === filters.paymentStatus);
  if (filters.clinicId !== 'all') clinics = clinics.filter(item => item.id === filters.clinicId);
  if (filters.laboratoryId !== 'all') laboratories = laboratories.filter(item => item.id === filters.laboratoryId);
  if (filters.userRole !== 'all') users = users.filter(item => item.role === filters.userRole);

  return { subscribers, users, registrations, subscriptions, payments, clinics, laboratories };
};

const rowsForSubscribers = (subscribers: Subscriber[], users: PlatformUser[]): ReportDrilldownRow[] => subscribers.map(subscriber => {
  const owner = users.find(user => user.id === subscriber.ownerUserId || (user.subscriberId === subscriber.id && user.role === 'clinic_owner'));
  return { id: subscriber.id, cells: { subscriber: subscriber.businessName, owner: owner?.fullName || 'Unassigned', plan: subscriber.planId, accountStatus: formatStatus(subscriber.accountStatus), subscriptionStatus: formatStatus(subscriber.subscriptionStatus), clinics: subscriber.clinicCount, laboratories: subscriber.laboratoryCount, users: users.filter(user => user.subscriberId === subscriber.id).length, registeredAt: subscriber.registeredAt }, actionRoute: `/platform/subscribers/${subscriber.id}`, secondaryRoute: `/platform/subscriptions/${subscriber.subscriptionId}` };
});

const subscriberColumns: ReportTableColumn[] = [
  { key: 'subscriber', label: 'Subscriber' }, { key: 'owner', label: 'Clinic Owner' }, { key: 'plan', label: 'Plan' }, { key: 'accountStatus', label: 'Account Status' }, { key: 'subscriptionStatus', label: 'Subscription Status' }, { key: 'clinics', label: 'Clinics', align: 'right' }, { key: 'laboratories', label: 'Laboratories', align: 'right' }, { key: 'users', label: 'Users', align: 'right' }, { key: 'registeredAt', label: 'Registration Date' }
];

const paymentColumns: ReportTableColumn[] = [
  { key: 'payment', label: 'Payment' }, { key: 'subscriber', label: 'Subscriber or Registration' }, { key: 'plan', label: 'Plan' }, { key: 'amount', label: 'Amount', align: 'right' }, { key: 'allocated', label: 'Allocated', align: 'right' }, { key: 'refunded', label: 'Refunded', align: 'right' }, { key: 'net', label: 'Net', align: 'right' }, { key: 'method', label: 'Method' }, { key: 'status', label: 'Status' }, { key: 'paymentDate', label: 'Payment Date' }
];

const buildWarnings = (sources: ReturnType<typeof filterSources>): AnalyticsWarning[] => {
  const warnings: AnalyticsWarning[] = [];
  const push = (severity: DataQualitySeverity, module: string, recordId: string, description: string, suggestedCorrection: string, route?: string) => warnings.push({ id: `${module}-${recordId}-${warnings.length}`, severity, module, recordId, description, suggestedCorrection, route });
  const subscribers = mockPlatformManagementService.listSubscribers();
  const subscriberIds = new Set(subscribers.map(item => item.id));
  const subscriptions = mockSubscriptionService.listSubscriptions();
  const payments = mockPaymentService.listPayments();
  const clinics = mockClinicService.listClinics();
  const laboratories = mockLaboratoryService.listLaboratories();
  const plans = mockPlanService.listPlans();

  subscribers.forEach(subscriber => {
    if (!mockSubscriptionService.getCurrentSubscriptionBySubscriberId(subscriber.id)) push('high', 'Subscribers', subscriber.id, 'Subscriber has no operational subscription.', 'Create, restore, or renew a subscription.', `/platform/subscribers/${subscriber.id}`);
    const primary = clinics.filter(clinic => clinic.subscriberId === subscriber.id && clinic.isPrimaryClinic && clinic.status !== 'archived');
    if (primary.length === 0) push('medium', 'Clinics', subscriber.id, 'Subscriber has no primary clinic.', 'Set one active clinic as primary.', `/platform/subscribers/${subscriber.id}`);
    if (primary.length > 1) push('high', 'Clinics', subscriber.id, 'Subscriber has more than one primary clinic.', 'Keep only one primary clinic.', `/platform/subscribers/${subscriber.id}`);
  });
  subscriptions.forEach(subscription => {
    if (!subscriberIds.has(subscription.subscriberId)) push('critical', 'Subscriptions', subscription.id, 'Subscription has no matching subscriber.', 'Reassign or archive the subscription.', `/platform/subscriptions/${subscription.id}`);
    if (!plans.some(plan => [plan.id, plan.name, plan.planCode].includes(subscription.planId) || plan.id === subscription.priceSnapshot.planId)) push('high', 'Subscriptions', subscription.id, 'Subscription references a missing plan.', 'Choose an active plan.', `/platform/subscriptions/${subscription.id}`);
  });
  payments.forEach(payment => {
    if (!payment.subscriberId && !payment.registrationId) push('high', 'Payments', payment.id, 'Payment is not linked to a subscriber or registration.', 'Allocate or relink the payment.', `/platform/payments/${payment.id}`);
    if (payment.amount < 0) push('critical', 'Payments', payment.id, 'Payment has an invalid negative amount.', 'Correct the amount in the payment record.', `/platform/payments/${payment.id}`);
    if (activePaymentStates.includes(payment.status) && payment.allocatedAmount <= 0) push('medium', 'Payments', payment.id, 'Approved payment has no valid allocation.', 'Allocate the payment to a registration, subscriber, or subscription.', `/platform/payments/${payment.id}`);
  });
  clinics.forEach(clinic => {
    if (!subscriberIds.has(clinic.subscriberId)) push('critical', 'Clinics', clinic.id, 'Clinic has no matching subscriber.', 'Reassign or archive the clinic.', `/platform/clinics/${clinic.id}`);
  });
  laboratories.forEach(lab => {
    if (!subscriberIds.has(lab.subscriberId)) push('critical', 'Laboratories', lab.id, 'Laboratory has no matching subscriber.', 'Reassign or archive the laboratory.', `/platform/laboratories/${lab.id}`);
    mockLaboratoryService.getLaboratoryConnections(lab.id).forEach(connection => {
      const clinic = mockClinicService.getClinicById(connection.clinicId);
      if (clinic && clinic.subscriberId !== lab.subscriberId) push('critical', 'Laboratories', connection.id, 'Laboratory is connected to a cross-subscriber clinic.', 'Disconnect and reconnect under the correct subscriber.', `/platform/laboratories/${lab.id}`);
    });
  });
  const planCodes = new Set<string>();
  plans.forEach(plan => {
    if (planCodes.has(plan.planCode)) push('medium', 'Plans', plan.id, 'Duplicate plan code detected.', 'Edit one plan code to be unique.', `/platform/plans/${plan.id}`);
    planCodes.add(plan.planCode);
  });
  return warnings.filter(warning => sources.subscribers.some(sub => warning.recordId.includes(sub.id)) || sources.subscribers.length === subscribers.length || warning.module !== 'Subscribers');
};

const buildReport = (key: AnalyticsReportKey, filters: AnalyticsFilter): AnalyticsReport => {
  const sources = filterSources(filters);
  const { subscribers, users, registrations, subscriptions, payments, clinics, laboratories } = sources;
  const generatedAt = nowText();
  const paymentSummary = mockPaymentService.getPaymentSummary();
  const collected = payments.filter(item => activePaymentStates.includes(item.status)).reduce((sum, item) => sum + item.amount - item.refundedAmount, 0);
  const approvedAmount = payments.filter(item => activePaymentStates.includes(item.status)).reduce((sum, item) => sum + item.amount, 0);
  const refundedAmount = payments.reduce((sum, item) => sum + item.refundedAmount, 0);
  const conversionCount = registrations.filter(item => item.paymentStatus === 'approved' || ['account_ready', 'registration_completed'].includes(item.registrationStatus)).length;
  const warnings = buildWarnings(sources);
  const announcements = safeRead<Array<{ status?: string; priority?: string; createdAt?: string; publishedAt?: string }>>(ANNOUNCEMENTS_KEY, []);
  const announcementRecipients = safeRead<Array<{ readAt?: string; acknowledgedAt?: string; deliveryStatus?: string }>>(ANNOUNCEMENT_RECIPIENTS_KEY, []);
  const notifications = safeRead<Array<{ status?: string; priority?: string; category?: string }>>(NOTIFICATIONS_KEY, []);
  const auditEvents = safeRead<Array<{ timestamp?: string; module?: string; result?: string; severity?: string; action?: string; actorName?: string }>>(AUDIT_LOGS_KEY, []);
  const deliveredRecipients = announcementRecipients.filter(item => ['generated', 'delivered_in_app'].includes(item.deliveryStatus || '')).length;
  const readRecipients = announcementRecipients.filter(item => item.readAt).length;
  const acknowledgedRecipients = announcementRecipients.filter(item => item.acknowledgedAt).length;

  if (key === 'subscribers') {
    return { key, title: 'Subscriber Analytics', subtitle: 'Analyze subscriber growth, plans, account status, and usage density.', metrics: [metric('total_subscribers', subscribers.length, number(subscribers.length), 'positive'), metric('new_subscribers', subscribers.filter(item => inRange(item.registeredAt, filters.dateRange)).length, number(subscribers.filter(item => inRange(item.registeredAt, filters.dateRange)).length), 'positive'), metric('active_subscribers', subscribers.filter(item => item.accountStatus === 'active').length, number(subscribers.filter(item => item.accountStatus === 'active').length), 'positive'), metric('suspended_subscribers', subscribers.filter(item => item.accountStatus === 'suspended').length, number(subscribers.filter(item => item.accountStatus === 'suspended').length), 'warning'), metric('average_clinics', subscribers.length ? clinics.length / subscribers.length : 0, number(subscribers.length ? clinics.length / subscribers.length : 0)), metric('average_laboratories', subscribers.length ? laboratories.length / subscribers.length : 0, number(subscribers.length ? laboratories.length / subscribers.length : 0))], charts: [chart('subscriber-growth', 'Subscriber Growth', 'New subscriber registrations over time.', countByDate(subscribers, item => item.registeredAt)), chart('subscriber-status', 'Subscriber Status Distribution', 'Subscribers grouped by account status.', countBy(subscribers, item => item.accountStatus)), chart('subscriber-plan', 'Subscriber Distribution by Plan', 'Subscribers grouped by plan.', countBy(subscribers, item => item.planId))], tableTitle: 'Subscriber Drilldown', columns: subscriberColumns, rows: rowsForSubscribers(subscribers, users), warnings, generatedAt };
  }

  if (key === 'subscriptions') {
    const rows = subscriptions.map(subscription => ({ id: subscription.id, cells: { subscription: subscription.subscriptionNumber, subscriber: subscribers.find(item => item.id === subscription.subscriberId)?.businessName || subscription.subscriberId, plan: subscription.priceSnapshot.planName, status: formatStatus(subscription.status), startDate: subscription.startDate, expirationDate: subscription.expirationDate, daysRemaining: mockSubscriptionService.getDaysRemaining(subscription), billingCycle: formatStatus(subscription.billingCycle), paymentStatus: formatStatus(subscription.paymentStatus) }, actionRoute: `/platform/subscriptions/${subscription.id}`, secondaryRoute: `/platform/subscribers/${subscription.subscriberId}` }));
    return { key, title: 'Subscription Analytics', subtitle: 'Review subscription lifecycle, renewal, plan, and billing-cycle patterns.', metrics: ['total', 'active', 'pending', 'expiring_soon', 'expired', 'suspended', 'cancelled'].map(status => metric(status === 'total' ? 'total_subscriptions' : `${status}_subscriptions`, status === 'total' ? subscriptions.length : subscriptions.filter(item => item.status === status).length, number(status === 'total' ? subscriptions.length : subscriptions.filter(item => item.status === status).length), ['expired', 'suspended', 'cancelled'].includes(status) ? 'warning' : 'positive')), charts: [chart('subscription-created', 'Subscription Creation Over Time', 'Subscriptions grouped by creation date.', countByDate(subscriptions, item => item.createdAt)), chart('subscription-status', 'Status Distribution', 'Subscriptions grouped by lifecycle status.', countBy(subscriptions, item => item.status)), chart('subscription-plan', 'Plan Distribution', 'Subscriptions grouped by plan.', countBy(subscriptions, item => item.priceSnapshot.planName))], tableTitle: 'Subscription Drilldown', columns: [{ key: 'subscription', label: 'Subscription' }, { key: 'subscriber', label: 'Subscriber' }, { key: 'plan', label: 'Plan' }, { key: 'status', label: 'Status' }, { key: 'startDate', label: 'Start Date' }, { key: 'expirationDate', label: 'Expiration Date' }, { key: 'daysRemaining', label: 'Days Remaining', align: 'right' }, { key: 'billingCycle', label: 'Billing Cycle' }, { key: 'paymentStatus', label: 'Payment Status' }], rows, warnings, generatedAt };
  }

  if (key === 'revenue') {
    const rows = payments.map(payment => ({ id: payment.id, cells: { payment: payment.paymentNumber, subscriber: subscribers.find(item => item.id === payment.subscriberId)?.businessName || payment.registrationId || 'Unlinked', plan: payment.planId || 'Unknown', amount: php(payment.amount), allocated: php(payment.allocatedAmount), refunded: php(payment.refundedAmount), net: php(activePaymentStates.includes(payment.status) ? payment.amount - payment.refundedAmount : 0), method: formatStatus(payment.paymentMethod), status: formatStatus(payment.status), paymentDate: payment.paymentDate }, actionRoute: `/platform/payments/${payment.id}`, secondaryRoute: payment.subscriberId ? `/platform/subscribers/${payment.subscriberId}` : undefined }));
    return { key, title: 'Revenue and Payment Reports', subtitle: 'Review mock payment verification, allocation, refund, and revenue formulas.', notice: 'Prototype financial figures only. Not suitable for accounting, tax, or legal reporting.', metrics: [metric('total_submitted_amount', payments.reduce((sum, item) => sum + item.amount, 0), php(payments.reduce((sum, item) => sum + item.amount, 0))), metric('total_approved_amount', approvedAmount, php(approvedAmount), 'positive'), metric('total_allocated_amount', payments.reduce((sum, item) => sum + item.allocatedAmount, 0), php(payments.reduce((sum, item) => sum + item.allocatedAmount, 0))), metric('total_unallocated_amount', payments.reduce((sum, item) => sum + item.unallocatedAmount, 0), php(payments.reduce((sum, item) => sum + item.unallocatedAmount, 0)), 'warning'), metric('refunded_amount', refundedAmount, php(refundedAmount), 'warning'), metric('mock_net_revenue', collected, php(collected), 'positive'), metric('pending_verification_amount', payments.filter(item => item.verificationStatus === 'pending').reduce((sum, item) => sum + item.amount, 0), php(payments.filter(item => item.verificationStatus === 'pending').reduce((sum, item) => sum + item.amount, 0)), 'warning'), metric('payment_approval_rate', payments.length ? (payments.filter(item => activePaymentStates.includes(item.status)).length / payments.length) * 100 : 0, percent(payments.length ? (payments.filter(item => activePaymentStates.includes(item.status)).length / payments.length) * 100 : 0), 'positive')], charts: [chart('approved-over-time', 'Approved Payments Over Time', 'Approved payment count by payment date.', countByDate(payments.filter(item => activePaymentStates.includes(item.status)), item => item.paymentDate)), chart('payment-method', 'Payment Method Distribution', 'Payments grouped by method.', countBy(payments, item => item.paymentMethod)), chart('payment-status', 'Payment Status Distribution', 'Payments grouped by status.', countBy(payments, item => item.status))], tableTitle: 'Payment Drilldown', columns: paymentColumns, rows, warnings, generatedAt };
  }

  if (key === 'users') {
    const rows = users.map(user => ({ id: user.id, cells: { user: user.fullName, role: formatStatus(user.role), subscriber: subscribers.find(item => item.id === user.subscriberId)?.businessName || 'Unassigned', clinics: user.clinicIds.length, status: formatStatus(user.accountStatus), registeredAt: user.registeredAt, lastLogin: user.lastLoginAt || 'Never' }, actionRoute: `/platform/users/${user.id}`, secondaryRoute: user.subscriberId ? `/platform/subscribers/${user.subscriberId}` : undefined }));
    return { key, title: 'User Analytics', subtitle: 'Inspect platform users by role, account status, clinic assignments, and activity.', metrics: [metric('total_users', users.length, number(users.length)), metric('clinic_owners', users.filter(item => item.role === 'clinic_owner').length, number(users.filter(item => item.role === 'clinic_owner').length)), metric('associate_dentists', users.filter(item => item.role === 'associate').length, number(users.filter(item => item.role === 'associate').length)), metric('staff', users.filter(item => item.role === 'staff').length, number(users.filter(item => item.role === 'staff').length)), metric('active_users', users.filter(item => item.accountStatus === 'active').length, number(users.filter(item => item.accountStatus === 'active').length), 'positive'), metric('users_without_clinic', users.filter(item => item.clinicIds.length === 0).length, number(users.filter(item => item.clinicIds.length === 0).length), 'warning'), metric('never_logged_in', users.filter(item => !item.lastLoginAt).length, number(users.filter(item => !item.lastLoginAt).length), 'warning')], charts: [chart('users-role', 'Users by Role', 'Users grouped by role.', countBy(users, item => item.role)), chart('users-status', 'Users by Status', 'Users grouped by account status.', countBy(users, item => item.accountStatus)), chart('users-registered', 'User Registrations Over Time', 'Users grouped by registration date.', countByDate(users, item => item.registeredAt))], tableTitle: 'User Drilldown', columns: [{ key: 'user', label: 'User' }, { key: 'role', label: 'Role' }, { key: 'subscriber', label: 'Subscriber' }, { key: 'clinics', label: 'Assigned Clinics', align: 'right' }, { key: 'status', label: 'Status' }, { key: 'registeredAt', label: 'Registration Date' }, { key: 'lastLogin', label: 'Last Login' }], rows, warnings, generatedAt };
  }

  if (key === 'clinics') {
    const rows = clinics.map(clinic => ({ id: clinic.id, cells: { clinic: clinic.name, subscriber: subscribers.find(item => item.id === clinic.subscriberId)?.businessName || clinic.subscriberId, plan: subscribers.find(item => item.id === clinic.subscriberId)?.planId || 'Unknown', location: `${clinic.city}, ${clinic.province}`, status: formatStatus(clinic.status), dentists: clinic.dentistUserIds.length, staff: clinic.staffUserIds.length, laboratories: mockLaboratoryService.getClinicLaboratories(clinic.id).filter(item => item.connection.status === 'active').length, primary: clinic.isPrimaryClinic ? 'Primary' : 'Secondary', createdAt: clinic.createdAt }, actionRoute: `/platform/clinics/${clinic.id}`, secondaryRoute: `/platform/subscribers/${clinic.subscriberId}` }));
    const summary = mockClinicService.getClinicSummary();
    return { key, title: 'Clinic Analytics', subtitle: 'Measure clinic growth, status, staffing completeness, and subscriber density.', metrics: [metric('total_clinics', summary.total, number(summary.total)), metric('active_clinics', summary.active, number(summary.active), 'positive'), metric('inactive_clinics', summary.inactive, number(summary.inactive), 'warning'), metric('draft_clinics', summary.draft, number(summary.draft)), metric('archived_clinics', summary.archived, number(summary.archived)), metric('primary_clinics', summary.primary, number(summary.primary)), metric('clinics_without_dentists', summary.withoutDentists, number(summary.withoutDentists), 'warning'), metric('clinics_without_staff', summary.withoutStaff, number(summary.withoutStaff), 'warning')], charts: [chart('clinic-created', 'Clinic Creation Over Time', 'Clinics grouped by creation date.', countByDate(clinics, item => item.createdAt)), chart('clinic-province', 'Clinics by Province', 'Clinics grouped by province.', countBy(clinics, item => item.province)), chart('clinic-status', 'Clinic Status Distribution', 'Clinics grouped by status.', countBy(clinics, item => item.status))], tableTitle: 'Clinic Drilldown', columns: [{ key: 'clinic', label: 'Clinic' }, { key: 'subscriber', label: 'Subscriber' }, { key: 'plan', label: 'Plan' }, { key: 'location', label: 'City and Province' }, { key: 'status', label: 'Status' }, { key: 'dentists', label: 'Dentists', align: 'right' }, { key: 'staff', label: 'Staff', align: 'right' }, { key: 'laboratories', label: 'Laboratories', align: 'right' }, { key: 'primary', label: 'Primary Status' }, { key: 'createdAt', label: 'Created Date' }], rows, warnings, generatedAt };
  }

  if (key === 'laboratories') {
    const rows = laboratories.map(lab => ({ id: lab.id, cells: { laboratory: lab.name, subscriber: subscribers.find(item => item.id === lab.subscriberId)?.businessName || lab.subscriberId, type: formatStatus(lab.laboratoryType), location: `${lab.city}, ${lab.province}`, status: formatStatus(lab.status), clinics: lab.clinicIds.length, services: mockLaboratoryService.getLaboratoryServices(lab.id).filter(service => service.status === 'active').length, preferred: mockLaboratoryService.getLaboratoryConnections(lab.id).filter(connection => connection.isPreferred && connection.status === 'active').length, createdAt: lab.createdAt }, actionRoute: `/platform/laboratories/${lab.id}`, secondaryRoute: `/platform/subscribers/${lab.subscriberId}` }));
    const summary = mockLaboratoryService.getLaboratorySummary();
    return { key, title: 'Laboratory Analytics', subtitle: 'Measure laboratory growth, type mix, service availability, and clinic connectivity.', metrics: [metric('total_laboratories', summary.total, number(summary.total)), metric('active_laboratories', summary.active, number(summary.active), 'positive'), metric('inactive_laboratories', summary.inactive, number(summary.inactive), 'warning'), metric('draft_laboratories', summary.draft, number(summary.draft)), metric('archived_laboratories', summary.archived, number(summary.archived)), metric('internal_laboratories', summary.internal, number(summary.internal)), metric('external_laboratories', summary.external, number(summary.external)), metric('laboratories_without_clinics', summary.withoutClinicConnections, number(summary.withoutClinicConnections), 'warning'), metric('laboratories_without_services', summary.withoutActiveServices, number(summary.withoutActiveServices), 'warning')], charts: [chart('lab-created', 'Laboratory Creation Over Time', 'Laboratories grouped by creation date.', countByDate(laboratories, item => item.createdAt)), chart('lab-type', 'Laboratories by Type', 'Laboratories grouped by type.', countBy(laboratories, item => item.laboratoryType)), chart('lab-status', 'Laboratory Status Distribution', 'Laboratories grouped by status.', countBy(laboratories, item => item.status))], tableTitle: 'Laboratory Drilldown', columns: [{ key: 'laboratory', label: 'Laboratory' }, { key: 'subscriber', label: 'Subscriber' }, { key: 'type', label: 'Type' }, { key: 'location', label: 'City and Province' }, { key: 'status', label: 'Status' }, { key: 'clinics', label: 'Connected Clinics', align: 'right' }, { key: 'services', label: 'Active Services', align: 'right' }, { key: 'preferred', label: 'Preferred Connections', align: 'right' }, { key: 'createdAt', label: 'Created Date' }], rows, warnings, generatedAt };
  }

  if (key === 'registrations') {
    const rows = registrations.map(reg => ({ id: reg.id, cells: { registration: reg.id, owner: reg.ownerName, clinic: reg.clinicName, plan: reg.plan, stage: formatStatus(reg.registrationStatus), emailStatus: reg.emailVerified ? 'Verified' : 'Pending', paymentStatus: formatStatus(reg.paymentStatus), accountStatus: reg.subscriberId ? 'Provisioned' : 'Not provisioned', submittedDate: reg.submittedDate }, actionRoute: `/platform/registrations/${reg.id}`, secondaryRoute: reg.subscriberId ? `/platform/subscribers/${reg.subscriberId}` : undefined }));
    const total = registrations.length;
    return { key, title: 'Registration Funnel Analytics', subtitle: 'Track mock onboarding progress from registration through account readiness.', metrics: [metric('total_registrations', total, number(total)), metric('email_verification_rate', total ? registrations.filter(item => item.emailVerified).length / total * 100 : 0, percent(total ? registrations.filter(item => item.emailVerified).length / total * 100 : 0), 'positive'), metric('payment_submission_rate', total ? registrations.filter(item => item.paymentStatus !== 'unpaid').length / total * 100 : 0, percent(total ? registrations.filter(item => item.paymentStatus !== 'unpaid').length / total * 100 : 0), 'positive'), metric('payment_approval_rate', total ? registrations.filter(item => item.paymentStatus === 'approved').length / total * 100 : 0, percent(total ? registrations.filter(item => item.paymentStatus === 'approved').length / total * 100 : 0), 'positive'), metric('registration_conversion_rate', total ? conversionCount / total * 100 : 0, percent(total ? conversionCount / total * 100 : 0), 'positive'), metric('rejection_rate', total ? registrations.filter(item => item.paymentStatus === 'rejected').length / total * 100 : 0, percent(total ? registrations.filter(item => item.paymentStatus === 'rejected').length / total * 100 : 0), 'warning')], charts: [chart('registration-funnel', 'Registration Funnel', 'Registrations counted by currently observed stage.', [{ label: 'Started', value: total }, { label: 'Submitted', value: total }, { label: 'Email Verified', value: registrations.filter(item => item.emailVerified).length }, { label: 'Payment Submitted', value: registrations.filter(item => item.paymentStatus !== 'unpaid').length }, { label: 'Payment Approved', value: registrations.filter(item => item.paymentStatus === 'approved').length }, { label: 'Account Provisioned', value: registrations.filter(item => item.subscriberId).length }]), chart('registrations-over-time', 'Registrations Over Time', 'Registrations grouped by submitted date.', countByDate(registrations, item => item.submittedDate)), chart('registration-status', 'Registration Status Distribution', 'Registrations grouped by status.', countBy(registrations, item => item.registrationStatus))], tableTitle: 'Registration Drilldown', columns: [{ key: 'registration', label: 'Registration' }, { key: 'owner', label: 'Clinic Owner' }, { key: 'clinic', label: 'Clinic' }, { key: 'plan', label: 'Plan' }, { key: 'stage', label: 'Current Stage' }, { key: 'emailStatus', label: 'Email Status' }, { key: 'paymentStatus', label: 'Payment Status' }, { key: 'accountStatus', label: 'Account Status' }, { key: 'submittedDate', label: 'Submitted Date' }], rows, warnings, generatedAt };
  }

  if (key === 'facilities') {
    const rows = clinics.map(clinic => ({
      id: clinic.id,
      cells: {
        clinic: clinic.name,
        subscriber: subscribers.find(item => item.id === clinic.subscriberId)?.businessName || clinic.subscriberId,
        location: `${clinic.city}, ${clinic.province}`,
        status: formatStatus(clinic.status),
        dentists: clinic.dentistUserIds.length,
        staff: clinic.staffUserIds.length,
        laboratories: mockLaboratoryService.getClinicLaboratories(clinic.id).filter(item => item.connection.status === 'active').length,
        primary: clinic.isPrimaryClinic ? 'Primary HQ' : 'Satellite Branch',
        createdAt: clinic.createdAt
      },
      actionRoute: `/platform/clinics/${clinic.id}`,
      secondaryRoute: `/platform/subscribers/${clinic.subscriberId}`
    }));
    return {
      key,
      title: 'Multi-Branch Facilities Analytics',
      subtitle: 'Measure branch expansion, operatory chairs, and dental lab partner logistics.',
      metrics: [
        metric('total_clinics', clinics.length, number(clinics.length), 'positive'),
        metric('active_clinics', clinics.filter(c => c.status === 'active').length, number(clinics.filter(c => c.status === 'active').length), 'positive'),
        metric('total_laboratories', laboratories.length, number(laboratories.length), 'positive')
      ],
      charts: [
        chart('clinic-province', 'Clinics by Province', 'Clinics grouped by province.', countBy(clinics, item => item.province))
      ],
      tableTitle: 'Facility Directory Drilldown',
      columns: [
        { key: 'clinic', label: 'Facility Name' },
        { key: 'subscriber', label: 'Subscriber' },
        { key: 'location', label: 'Location' },
        { key: 'status', label: 'Status' },
        { key: 'dentists', label: 'Dentists', align: 'right' },
        { key: 'staff', label: 'Staff', align: 'right' },
        { key: 'laboratories', label: 'Connected Labs', align: 'right' },
        { key: 'primary', label: 'Branch Type' }
      ],
      rows,
      warnings,
      generatedAt
    };
  }

  if (key === 'clinical') {
    const rows = [
      { id: 'proc-1', cells: { procedure: 'Light-Cure Composite Resin Fillings', category: 'Restorative', count: '48 procedures', revenue: '₱58,500.00', status: 'Completed' }, actionRoute: `/platform/analytics-reports/clinical` },
      { id: 'proc-2', cells: { procedure: 'Zirconia & Porcelain Crown Fitting', category: 'Prosthetics', count: '34 procedures', revenue: '₱112,000.00', status: 'Completed' }, actionRoute: `/platform/analytics-reports/clinical` },
      { id: 'proc-3', cells: { procedure: 'Oral Prophylaxis & Ultrasonic Scaling', category: 'Preventive', count: '29 procedures', revenue: '₱42,000.00', status: 'Completed' }, actionRoute: `/platform/analytics-reports/clinical` },
      { id: 'proc-4', cells: { procedure: 'Endodontic Root Canal Therapy', category: 'Endodontics', count: '18 procedures', revenue: '₱28,000.00', status: 'Completed' }, actionRoute: `/platform/analytics-reports/clinical` },
      { id: 'proc-5', cells: { procedure: 'Surgical & Simple Extractions', category: 'Oral Surgery', count: '15 procedures', revenue: '₱18,500.00', status: 'Completed' }, actionRoute: `/platform/analytics-reports/clinical` }
    ];
    return {
      key,
      title: 'Clinical & Patient Procedure Analytics',
      subtitle: 'Analyze procedure volume, tooth numbering adoption, and treatment production.',
      metrics: [
        metric('total_procedures', 148, number(148), 'positive'),
        metric('restorative_volume', 48, number(48), 'positive'),
        metric('prosthetics_volume', 34, number(34), 'positive')
      ],
      charts: [
        chart('procedure-category', 'Procedures by Category', 'Breakdown of clinical cases.', [{ label: 'Restorative', value: 48 }, { label: 'Prosthetics', value: 34 }, { label: 'Preventive', value: 29 }, { label: 'Endodontics', value: 18 }, { label: 'Surgery', value: 15 }])
      ],
      tableTitle: 'Top Clinical Procedures Drilldown',
      columns: [
        { key: 'procedure', label: 'Dental Procedure' },
        { key: 'category', label: 'Specialty Category' },
        { key: 'count', label: 'Volume (Visits)', align: 'right' },
        { key: 'revenue', label: 'Total Billed', align: 'right' },
        { key: 'status', label: 'Status' }
      ],
      rows,
      warnings,
      generatedAt
    };
  }

  if (key === 'audits') {
    const rows = auditEvents.map((evt, idx) => ({
      id: `audit-${idx}`,
      cells: {
        timestamp: evt.timestamp?.replace('T', ' ').slice(0, 19) || 'Just now',
        action: evt.action || 'system.event',
        actor: evt.actorName || 'System Service',
        module: evt.module || 'auth',
        severity: formatStatus(evt.severity || 'low'),
        result: formatStatus(evt.result || 'success')
      },
      actionRoute: `/platform/audit-logs`
    }));
    return {
      key,
      title: 'Personnel & System Audit Reports',
      subtitle: 'Review clinician and staff productivity, authentication history, and security log integrity.',
      metrics: [
        metric('total_users', users.length, number(users.length)),
        metric('clinic_owners', users.filter(item => item.role === 'clinic_owner').length, number(users.filter(item => item.role === 'clinic_owner').length)),
        metric('associate_dentists', users.filter(item => item.role === 'associate').length, number(users.filter(item => item.role === 'associate').length)),
        metric('staff_accounts', users.filter(item => item.role === 'staff').length, number(users.filter(item => item.role === 'staff').length)),
        metric('successful_logins', auditEvents.filter(item => item.action === 'auth.login.success').length, number(auditEvents.filter(item => item.action === 'auth.login.success').length), 'positive'),
        metric('failed_logins', auditEvents.filter(item => item.action === 'auth.login.failure').length, number(auditEvents.filter(item => item.action === 'auth.login.failure').length), 'warning')
      ],
      charts: [
        chart('users-role', 'Users by Role', 'Users grouped by role.', countBy(users, item => item.role)),
        chart('audit-events-over-time', 'Audit Events Over Time', 'Audit events grouped by date.', countByDate(auditEvents, item => item.timestamp?.split('T')[0]))
      ],
      tableTitle: 'Audit Logs & Security Ledger',
      columns: [
        { key: 'timestamp', label: 'Timestamp' },
        { key: 'action', label: 'Action Event' },
        { key: 'actor', label: 'Actor / User' },
        { key: 'module', label: 'Module' },
        { key: 'severity', label: 'Severity' },
        { key: 'result', label: 'Result' }
      ],
      rows,
      warnings,
      generatedAt
    };
  }

  if (key === 'data-quality') {
    const rows = warnings.map(warning => ({ id: warning.id, cells: { severity: formatStatus(warning.severity), module: warning.module, record: warning.recordId, description: warning.description, correction: warning.suggestedCorrection }, actionRoute: warning.route }));
    return { key, title: 'Data Quality Report', subtitle: 'Identify mock-data issues without silently modifying source records.', metrics: [metric('data_quality_issues', warnings.length, number(warnings.length), warnings.length ? 'warning' : 'positive'), metric('critical_issues', warnings.filter(item => item.severity === 'critical').length, number(warnings.filter(item => item.severity === 'critical').length), 'warning'), metric('high_issues', warnings.filter(item => item.severity === 'high').length, number(warnings.filter(item => item.severity === 'high').length), 'warning')], charts: [chart('issues-severity', 'Issues by Severity', 'Data-quality issues grouped by severity.', countBy(warnings, item => item.severity)), chart('issues-module', 'Issues by Module', 'Data-quality issues grouped by source module.', countBy(warnings, item => item.module))], tableTitle: 'Data Quality Issues', columns: [{ key: 'severity', label: 'Severity' }, { key: 'module', label: 'Module' }, { key: 'record', label: 'Record' }, { key: 'description', label: 'Description' }, { key: 'correction', label: 'Suggested Correction' }], rows, warnings, generatedAt };
  }

  const overviewMetrics = [metric('total_subscribers', subscribers.length, number(subscribers.length)), metric('active_subscribers', subscribers.filter((item: any) => item.accountStatus === 'active').length, number(subscribers.filter((item: any) => item.accountStatus === 'active').length), 'positive'), metric('new_registrations', registrations.filter((item: any) => inRange(item.submittedDate, filters.dateRange)).length, number(registrations.filter((item: any) => inRange(item.submittedDate, filters.dateRange)).length)), metric('registration_conversion_rate', registrations.length ? conversionCount / registrations.length * 100 : 0, percent(registrations.length ? conversionCount / registrations.length * 100 : 0), 'positive'), metric('active_subscriptions', subscriptions.filter((item: any) => item.status === 'active').length, number(subscriptions.filter((item: any) => item.status === 'active').length), 'positive'), metric('expiring_soon', subscriptions.filter((item: any) => item.status === 'expiring_soon').length, number(subscriptions.filter((item: any) => item.status === 'expiring_soon').length), 'warning'), metric('expired_subscriptions', subscriptions.filter((item: any) => item.status === 'expired').length, number(subscriptions.filter((item: any) => item.status === 'expired').length), 'warning'), metric('total_approved_payments', paymentSummary.approved + paymentSummary.partiallyAllocated + paymentSummary.fullyAllocated, number(paymentSummary.approved + paymentSummary.partiallyAllocated + paymentSummary.fullyAllocated), 'positive'), metric('mock_net_revenue', collected, php(collected), 'positive'), metric('refunded_amount', refundedAmount, php(refundedAmount), 'warning'), metric('total_clinics', clinics.length, number(clinics.length)), metric('total_laboratories', laboratories.length, number(laboratories.length)), metric('total_users', users.length, number(users.length)), metric('suspended_accounts', subscribers.filter((item: any) => item.accountStatus === 'suspended').length + users.filter((item: any) => item.accountStatus === 'suspended').length, number(subscribers.filter((item: any) => item.accountStatus === 'suspended').length + users.filter((item: any) => item.accountStatus === 'suspended').length), 'warning'), metric('published_announcements', announcements.filter((item: any) => item.status === 'published').length, number(announcements.filter((item: any) => item.status === 'published').length), 'positive', ['announcements']), metric('scheduled_announcements', announcements.filter((item: any) => item.status === 'scheduled').length, number(announcements.filter((item: any) => item.status === 'scheduled').length), 'neutral', ['announcements']), metric('announcement_read_rate', deliveredRecipients ? (readRecipients / deliveredRecipients) * 100 : 0, percent(deliveredRecipients ? (readRecipients / deliveredRecipients) * 100 : 0), deliveredRecipients && readRecipients < deliveredRecipients ? 'warning' : 'positive', ['announcements']), metric('announcement_acknowledgement_rate', deliveredRecipients ? (acknowledgedRecipients / deliveredRecipients) * 100 : 0, percent(deliveredRecipients ? (acknowledgedRecipients / deliveredRecipients) * 100 : 0), 'neutral', ['announcements']), metric('unread_notifications', notifications.filter((item: any) => item.status === 'unread').length, number(notifications.filter((item: any) => item.status === 'unread').length), notifications.some((item: any) => item.status === 'unread') ? 'warning' : 'positive', ['notifications']), metric('urgent_notifications', notifications.filter((item: any) => item.priority === 'urgent').length, number(notifications.filter((item: any) => item.priority === 'urgent').length), notifications.some((item: any) => item.priority === 'urgent') ? 'warning' : 'positive', ['notifications']), metric('high_risk_audit_events', auditEvents.filter((item: any) => ['high', 'critical'].includes(item.severity || '')).length, number(auditEvents.filter((item: any) => ['high', 'critical'].includes(item.severity || '')).length), auditEvents.some((item: any) => ['high', 'critical'].includes(item.severity || '')) ? 'warning' : 'positive', ['audit']), metric('failed_authentication_events', auditEvents.filter((item: any) => item.action === 'auth.login.failure').length, number(auditEvents.filter((item: any) => item.action === 'auth.login.failure').length), 'warning', ['audit'])];
  return { key: 'overview', title: 'Analytics & Reports', subtitle: 'Review platform growth, subscriptions, payments, users, facilities, and system activity.', metrics: overviewMetrics, charts: [chart('subscriber-growth', 'Subscriber Growth', 'New and activated subscribers over time.', countByDate(subscribers, (item: any) => item.registeredAt)), chart('subscription-distribution', 'Subscription Distribution', 'Subscribers grouped by plan.', countBy(subscribers, (item: any) => item.planId)), chart('subscription-status', 'Subscription Status', 'Subscriptions grouped by lifecycle status.', countBy(subscriptions, (item: any) => item.status)), chart('payment-summary', 'Payment Summary', 'Payments grouped by status.', countBy(payments, (item: any) => item.status)), chart('facility-growth', 'Facility Growth', 'Clinics and laboratories created by date.', [...countByDate(clinics, (item: any) => item.createdAt), ...countByDate(laboratories, (item: any) => item.createdAt)]), chart('user-distribution', 'User Distribution', 'Users grouped by role.', countBy(users, (item: any) => item.role)), chart('announcement-status', 'Announcements by Status', 'Announcements grouped by lifecycle status.', countBy(announcements, (item: any) => item.status)), chart('notification-category', 'Notifications by Category', 'Notifications grouped by category.', countBy(notifications, (item: any) => item.category)), chart('audit-events-over-time', 'Audit Events Over Time', 'Audit events grouped by timestamp date.', countByDate(auditEvents, (item: any) => item.timestamp ? String(item.timestamp).split('T')[0] : '')), chart('audit-severity', 'Audit Severity Distribution', 'Audit events grouped by severity.', countBy(auditEvents, (item: any) => item.severity)), chart('audit-result', 'Audit Result Distribution', 'Audit events grouped by result.', countBy(auditEvents, (item: any) => item.result))], tableTitle: 'Overview Drilldown', columns: subscriberColumns, rows: rowsForSubscribers(subscribers, users), warnings, generatedAt };
};

export const mockAnalyticsService = {
  getDefaultFilters: defaultFilters,
  getDateRangeForPreset: dateRangeForPreset,
  getPersistedFilters: () => safeRead<AnalyticsFilter>(FILTER_STATE_KEY, defaultFilters()),
  persistFilters: (filters: AnalyticsFilter) => safeWrite(FILTER_STATE_KEY, filters),
  getReport: (key: AnalyticsReportKey, filters: AnalyticsFilter = defaultFilters()) => buildReport(key === 'overview' ? 'overview' : key, filters),
  getDashboardMetrics: () => {
    const report = buildReport('overview', defaultFilters());
    const get = (id: string) => report.metrics.find(item => item.id === id)?.value || 0;
    return {
      totalSubscribers: Number(get('total_subscribers')),
      activeSubscribers: Number(get('active_subscribers')),
      pendingRegistrations: mockPlatformManagementService.listRegistrations().filter(item => item.paymentStatus === 'pending_verification' || item.registrationStatus === 'payment_under_review').length,
      pendingPayments: mockPaymentService.getPaymentSummary().pendingVerification,
      expiredSubscriptions: Number(get('expired_subscriptions')),
      suspendedAccounts: Number(get('suspended_accounts')),
      totalClinics: Number(get('total_clinics')),
      totalLaboratories: Number(get('total_laboratories')),
      mockMonthlyRevenue: Number(get('mock_net_revenue'))
    };
  },
  listSavedViews: () => safeRead<SavedReportView[]>(SAVED_VIEWS_KEY, []),
  saveCurrentView: (name: string, reportKey: AnalyticsReportKey, filters: AnalyticsFilter, visibleColumns: string[] = [], sort = 'default') => {
    if (!name.trim()) return { ok: false, error: 'Saved view name is required.' };
    const view: SavedReportView = { id: makeId('ARV'), name: name.trim(), reportKey, filters, dateRange: filters.dateRange, comparison: filters.comparison, visibleColumns, sort, createdAt: today(), updatedAt: today() };
    safeWrite(SAVED_VIEWS_KEY, [view, ...mockAnalyticsService.listSavedViews()]);
    return { ok: true, data: view };
  },
  renameSavedView: (id: string, name: string) => {
    if (!name.trim()) return { ok: false, error: 'Saved view name is required.' };
    const views = mockAnalyticsService.listSavedViews();
    const target = views.find(item => item.id === id);
    if (!target) return { ok: false, error: 'Saved view not found.' };
    const updated = { ...target, name: name.trim(), updatedAt: today() };
    safeWrite(SAVED_VIEWS_KEY, views.map(item => item.id === id ? updated : item));
    return { ok: true, data: updated };
  },
  duplicateSavedView: (id: string) => {
    const target = mockAnalyticsService.listSavedViews().find(item => item.id === id);
    if (!target) return { ok: false, error: 'Saved view not found.' };
    return mockAnalyticsService.saveCurrentView(`${target.name} Copy`, target.reportKey, target.filters, target.visibleColumns, target.sort);
  },
  deleteSavedView: (id: string) => {
    const views = mockAnalyticsService.listSavedViews();
    safeWrite(SAVED_VIEWS_KEY, views.filter(item => item.id !== id));
    return { ok: true };
  },
  getExportDefinition: (report: AnalyticsReport, rows: ReportDrilldownRow[]): ExportDefinition => ({ fileName: makeSafeCsvFileName(report.key), columns: report.columns, rows })
};
