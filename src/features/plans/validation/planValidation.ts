import type { Plan, PlanFormData } from '../types';

export interface PlanValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validatePlanForm(data: PlanFormData, existingPlans: Plan[], currentPlanId?: string): PlanValidationResult {
  const errors: Record<string, string> = {};
  const normalizedCode = data.planCode.trim().toLowerCase();
  const normalizedSlug = data.slug.trim().toLowerCase();

  if (!data.name.trim()) errors.name = 'Plan name is required.';
  if (!normalizedCode) errors.planCode = 'Plan code is required.';
  if (!normalizedSlug) errors.slug = 'Slug is required.';
  if (data.monthlyPrice < 0) errors.monthlyPrice = 'Monthly price cannot be negative.';
  if (data.annualPrice < 0) errors.annualPrice = 'Annual price cannot be negative.';
  if (!Number.isFinite(data.displayOrder) || data.displayOrder < 0) errors.displayOrder = 'Display order must be zero or greater.';
  if (data.status === 'active' && data.visibility === 'public' && (!data.shortDescription.trim() || data.billingCycles.length === 0)) {
    errors.activePublic = 'Active public plans require a short description and at least one billing cycle.';
  }

  data.limits.forEach(limit => {
    if (limit.type === 'number' && (limit.value == null || limit.value < 0)) {
      errors[`limit_${limit.key}`] = `${limit.label} must be zero or greater.`;
    }
  });

  if (existingPlans.some(plan => plan.id !== currentPlanId && plan.planCode.toLowerCase() === normalizedCode)) {
    errors.planCode = 'Plan code must be unique.';
  }

  if (existingPlans.some(plan => plan.id !== currentPlanId && plan.slug.toLowerCase() === normalizedSlug)) {
    errors.slug = 'Plan slug must be unique.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
