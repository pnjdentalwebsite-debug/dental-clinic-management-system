import type { Plan } from '../../plans/types';
import type { Subscriber } from '../../platformManagement/types';
import type { BillingCycle, Subscription, SubscriptionFormData, SubscriptionLifecycleStatus } from '../types';

export const EXPIRING_SOON_WARNING_DAYS = 30;

const operationalStatuses: SubscriptionLifecycleStatus[] = ['pending', 'active', 'expiring_soon', 'suspended'];

const allowedTransitions: Record<SubscriptionLifecycleStatus, SubscriptionLifecycleStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['active', 'cancelled'],
  active: ['expiring_soon', 'expired', 'suspended', 'cancelled'],
  expiring_soon: ['active', 'expired', 'suspended', 'cancelled'],
  expired: ['active', 'cancelled'],
  suspended: ['active', 'cancelled'],
  cancelled: ['active', 'pending']
};

export const isOperationalSubscriptionStatus = (status: SubscriptionLifecycleStatus) => operationalStatuses.includes(status);

export const daysBetween = (fromDate: string, toDate: string) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return Math.ceil((to.getTime() - from.getTime()) / 86400000);
};

export const deriveSubscriptionStatus = (
  status: SubscriptionLifecycleStatus,
  expirationDate: string,
  todayValue = new Date().toISOString().split('T')[0]
): SubscriptionLifecycleStatus => {
  if (['draft', 'pending', 'suspended', 'cancelled'].includes(status)) return status;
  const remaining = daysBetween(todayValue, expirationDate);
  if (remaining < 0) return 'expired';
  if (remaining <= EXPIRING_SOON_WARNING_DAYS) return 'expiring_soon';
  return 'active';
};

export const getBillingCycleEndDate = (startDate: string, billingCycle: BillingCycle) => {
  const date = new Date(startDate);
  if (billingCycle === 'monthly') date.setMonth(date.getMonth() + 1);
  if (billingCycle === 'quarterly') date.setMonth(date.getMonth() + 3);
  if (billingCycle === 'semi_annual') date.setMonth(date.getMonth() + 6);
  if (billingCycle === 'annual') date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
};

export const validateSubscriptionTransition = (
  currentStatus: SubscriptionLifecycleStatus,
  nextStatus: SubscriptionLifecycleStatus
) => {
  if (currentStatus === nextStatus) return { valid: false, message: `Subscription is already ${nextStatus.replace('_', ' ')}.` };
  if (!allowedTransitions[currentStatus]?.includes(nextStatus)) {
    return { valid: false, message: `Cannot move a ${currentStatus.replace('_', ' ')} subscription to ${nextStatus.replace('_', ' ')}.` };
  }
  return { valid: true };
};

export const validateSubscriptionForm = (
  data: SubscriptionFormData,
  subscribers: Subscriber[],
  plans: Plan[],
  existingSubscriptions: Subscription[],
  currentSubscriptionId?: string
) => {
  const subscriber = subscribers.find(item => item.id === data.subscriberId);
  const plan = plans.find(item => item.id === data.planId || item.name === data.planId || item.planCode === data.planId);
  if (!subscriber) return { valid: false, message: 'Choose a valid subscriber.' };
  if (subscriber.accountStatus === 'deactivated') return { valid: false, message: 'Deactivated subscribers cannot receive new subscriptions.' };
  if (!plan) return { valid: false, message: 'Choose a valid plan.' };
  if (plan.status !== 'active') return { valid: false, message: 'Only active plans can be assigned to a subscription.' };
  if (!data.startDate) return { valid: false, message: 'Start date is required.' };
  if (!data.expirationDate) return { valid: false, message: 'Expiration date is required.' };
  if (new Date(data.expirationDate) <= new Date(data.startDate)) return { valid: false, message: 'Expiration date must be later than start date.' };
  if (!['monthly', 'quarterly', 'semi_annual', 'annual', 'custom'].includes(data.billingCycle)) return { valid: false, message: 'Choose a valid billing cycle.' };
  const conflict = existingSubscriptions.find(item =>
    item.id !== currentSubscriptionId &&
    item.subscriberId === data.subscriberId &&
    isOperationalSubscriptionStatus(item.status)
  );
  if (conflict) return { valid: false, message: 'This subscriber already has an operational subscription. Use renew, change plan, or cancel the existing subscription first.' };
  return { valid: true };
};
