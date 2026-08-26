import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from './mockSubscriptionService';
import type { SubscriptionFormData } from '../types';

const baseData = (subscriberId: string, planId: string): SubscriptionFormData => ({
  subscriberId,
  planId,
  billingCycle: 'annual',
  startDate: '2026-01-01',
  expirationDate: '2027-01-01',
  autoRenew: true,
  paymentStatus: 'paid',
  notes: 'Test subscription',
  status: 'active'
});

describe('mockSubscriptionService', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPlatformManagementService.ensureSeedData();
    mockPlanService.initializePlans();
  });

  it('seeds missing subscriptions once and derives summary counts', () => {
    const first = mockSubscriptionService.initializeSubscriptions();
    const second = mockSubscriptionService.initializeSubscriptions();

    expect(first.length).toBeGreaterThanOrEqual(5);
    expect(second).toHaveLength(first.length);
    expect(mockSubscriptionService.getSubscriptionSummary().active).toBeGreaterThan(0);
  });

  it('creates, updates, renews, changes plan, extends, suspends, reactivates, cancels, and restores', () => {
    const subscriber = mockPlatformManagementService.listSubscribers()[0];
    localStorage.setItem('pnj_mock_subscriptions', JSON.stringify([]));
    const basic = mockPlanService.getPlanByCode('basic')!;
    const plus = mockPlanService.getPlanByCode('plus')!;

    const created = mockSubscriptionService.createSubscription(baseData(subscriber.id, basic.id));
    expect(created.ok).toBe(true);
    expect(created.data?.priceSnapshot.planName).toBe('Basic');

    const updated = mockSubscriptionService.updateSubscription(created.data!.id, { billingCycle: 'monthly', autoRenew: false, paymentStatus: 'overdue', notes: 'Updated' });
    expect(updated.data?.autoRenew).toBe(false);

    const renewed = mockSubscriptionService.renewSubscription(created.data!.id, 'annual', '2028-01-01');
    expect(renewed.data?.status).toBe('active');
    expect(renewed.data?.priceSnapshot.planName).toBe('Basic');

    const changed = mockSubscriptionService.changeSubscriptionPlan(created.data!.id, plus.id);
    expect(changed.data?.priceSnapshot.planName).toBe('Plus');

    const extended = mockSubscriptionService.extendExpiration(created.data!.id, '2028-02-01', 'Courtesy extension');
    expect(extended.data?.expirationDate).toBe('2028-02-01');

    const suspended = mockSubscriptionService.suspendSubscription(created.data!.id, 'Billing review');
    expect(suspended.data?.status).toBe('suspended');

    const reactivated = mockSubscriptionService.reactivateSubscription(created.data!.id);
    expect(reactivated.data?.status).toBe('active');

    const cancelled = mockSubscriptionService.cancelSubscription(created.data!.id, 'Clinic closed');
    expect(cancelled.data?.status).toBe('cancelled');

    const restored = mockSubscriptionService.restoreSubscription(created.data!.id, plus.id);
    expect(restored.data?.status).toBe('active');
  });

  it('blocks invalid transitions and conflicting operational subscriptions', () => {
    const subscriber = mockPlatformManagementService.listSubscribers()[0];
    localStorage.setItem('pnj_mock_subscriptions', JSON.stringify([]));
    const plan = mockPlanService.getPlanByCode('basic')!;
    const created = mockSubscriptionService.createSubscription(baseData(subscriber.id, plan.id));

    expect(mockSubscriptionService.createSubscription(baseData(subscriber.id, plan.id)).ok).toBe(false);
    expect(mockSubscriptionService.suspendSubscription(created.data!.id, '').ok).toBe(false);
    expect(mockSubscriptionService.validateSubscriptionTransition('cancelled', 'suspended').valid).toBe(false);
  });

  it('derives expiring soon and expired without overriding suspended', () => {
    expect(mockSubscriptionService.deriveSubscriptionStatus('active', '2026-08-10', '2026-07-26')).toBe('expiring_soon');
    expect(mockSubscriptionService.deriveSubscriptionStatus('active', '2026-07-01', '2026-07-26')).toBe('expired');
    expect(mockSubscriptionService.deriveSubscriptionStatus('suspended', '2026-07-01', '2026-07-26')).toBe('suspended');
  });

  it('preserves previous price snapshots in history after plan price changes', () => {
    const subscriber = mockPlatformManagementService.listSubscribers()[0];
    localStorage.setItem('pnj_mock_subscriptions', JSON.stringify([]));
    const plan = mockPlanService.getPlanByCode('plus')!;
    const created = mockSubscriptionService.createSubscription(baseData(subscriber.id, plan.id));
    const originalMonthly = created.data!.priceSnapshot.monthlyPrice;
    const form = mockPlanService.toFormData(plan);
    mockPlanService.updatePlan(plan.id, { ...form, monthlyPrice: originalMonthly + 5000 });
    mockSubscriptionService.renewSubscription(created.data!.id, 'annual', '2028-01-01');
    const history = mockSubscriptionService.getSubscriptionHistory(created.data!.id);

    expect(history.some(item => item.priceSnapshot?.monthlyPrice === originalMonthly)).toBe(true);
  });
});
