import { mockPlanService } from './mockPlanService';
import type { PlanFormData } from '../types';

const makePlanData = (name = 'Growth'): PlanFormData => ({
  planCode: name.toLowerCase(),
  name,
  slug: name.toLowerCase(),
  shortDescription: `${name} public plan`,
  fullDescription: `${name} mock plan for tests.`,
  monthlyPrice: 1500,
  annualPrice: 15000,
  currency: 'PHP',
  billingCycles: ['monthly', 'annual'],
  status: 'active',
  visibility: 'public',
  isRecommended: false,
  badgeLabel: '',
  displayOrder: 10,
  features: mockPlanService.toFormData().features.map((feature, index) => ({ ...feature, enabled: index < 2 })),
  limits: mockPlanService.toFormData().limits.map(limit => ({ ...limit, type: 'number', value: 1 }))
});

describe('mockPlanService', () => {
  it('seeds Basic, Plus, and Max once only', () => {
    expect(mockPlanService.initializePlans().map(plan => plan.name)).toEqual(['Basic', 'Plus', 'Max']);
    expect(mockPlanService.initializePlans()).toHaveLength(3);
  });

  it('creates, updates, and exposes active public registration plans', () => {
    const created = mockPlanService.createPlan(makePlanData());
    expect(created.ok).toBe(true);
    expect(created.data?.name).toBe('Growth');

    const updated = mockPlanService.updatePlan(created.data!.id, { ...mockPlanService.toFormData(created.data), monthlyPrice: 1800 });
    expect(updated.ok).toBe(true);
    expect(updated.data?.monthlyPrice).toBe(1800);

    const publicPlans = mockPlanService.getPublicRegistrationPlans().map(plan => plan.name);
    expect(publicPlans).toContain('Growth');
  });

  it('blocks permanent deletion while a plan is referenced', () => {
    const created = mockPlanService.createPlan(makePlanData('Clinical'));
    localStorage.setItem('pnj_mock_subscribers', JSON.stringify([{ id: 'SUB-1', email: 'a@example.com', businessName: 'Clinic', planId: created.data!.name }]));

    const result = mockPlanService.permanentlyDeleteUnusedPlan(created.data!.id);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/in use/i);
  });
});
