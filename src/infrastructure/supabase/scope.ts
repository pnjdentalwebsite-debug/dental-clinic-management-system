export interface SubscriberScope {
  subscriberId: string;
}

export interface ClinicScope extends SubscriberScope {
  clinicId: string;
}

function requiredId(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} is required for a scoped Supabase operation.`);
  return normalized;
}

/**
 * Every branch operational query must receive this scope. Database RLS is the
 * security boundary; this client guard prevents accidental unscoped queries.
 */
export function createClinicScope(subscriberId: string, clinicId: string): ClinicScope {
  return {
    subscriberId: requiredId(subscriberId, 'subscriberId'),
    clinicId: requiredId(clinicId, 'clinicId'),
  };
}

export function createSubscriberScope(subscriberId: string): SubscriberScope {
  return { subscriberId: requiredId(subscriberId, 'subscriberId') };
}
