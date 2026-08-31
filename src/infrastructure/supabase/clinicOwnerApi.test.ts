import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ClinicOwnerApiError,
  getClinicOwnerBootstrap,
  normalizeClinicOwnerPlanLimits,
} from './clinicOwnerApi';

const ownerMembership = {
  membershipId: 'membership-owner',
  role: 'clinic_owner',
  accountStatus: 'active',
  mustChangePassword: false,
};

afterEach(() => localStorage.clear());

type QueryLog = { table: string; filters: Array<[string, unknown]>; head: boolean };

function clientFixture(options: {
  memberships?: unknown[];
  subscriptionRows?: unknown[];
  plan?: Record<string, unknown> | null;
  failTable?: string;
} = {}) {
  const logs: QueryLog[] = [];
  const memberships = options.memberships ?? [ownerMembership];
  const rows: Record<string, unknown> = {
    subscriber_memberships: {
      id: 'membership-owner', subscriber_id: 'subscriber-authoritative', user_id: 'auth-user', role: 'clinic_owner', account_status: 'active', must_change_password: false,
    },
    profiles: { id: 'auth-user', email: 'owner@example.com', display_name: 'Real Owner', first_name: 'Real', middle_name: null, last_name: 'Owner', mobile_number: '09170000000' },
    subscribers: { id: 'subscriber-authoritative', subscriber_number: 'SUB-001', business_name: 'Real Dental Group', account_status: 'active', created_at: '2026-08-01T00:00:00Z', activated_at: '2026-08-02T00:00:00Z' },
    plans: options.plan === undefined ? {
      id: 'plan-plus', plan_code: 'plus', name: 'Plus', monthly_amount_centavos: 850000, annual_amount_centavos: 8670000,
      limits: [
        { key: 'clinics', type: 'number', value: 3 },
        { key: 'laboratories', type: 'number', value: 2 },
        { key: 'associates', type: 'number', value: 6 },
        { key: 'staff', type: 'number', value: 20 },
      ],
      features: [],
    } : options.plan,
  };
  const lists: Record<string, unknown[]> = {
    subscriptions: options.subscriptionRows ?? [{ id: 'subscription-1', subscriber_id: 'subscriber-authoritative', plan_id: 'plan-plus', status: 'active', billing_cycle: 'monthly', amount_centavos: 850000, starts_at: '2026-08-01T00:00:00Z', expires_at: '2026-09-01T00:00:00Z' }],
    clinics: [
      { id: 'clinic-1', subscriber_id: 'subscriber-authoritative', clinic_number: 'CLN-001', branch_type: 'main', name: 'Main Clinic', is_primary: true, status: 'active', email: 'clinic@example.com', contact_number: '0917', address_line_1: 'One Street', address_line_2: null, barangay: null, city: 'Bacoor', province: 'Cavite', postal_code: null, created_at: '2026-08-02T00:00:00Z' },
      { id: 'clinic-2', subscriber_id: 'subscriber-authoritative', clinic_number: 'CLN-002', branch_type: 'satellite', name: 'Inactive Clinic', is_primary: false, status: 'inactive', email: null, contact_number: null, address_line_1: 'Two Street', address_line_2: null, barangay: null, city: 'Imus', province: 'Cavite', postal_code: null, created_at: '2026-08-03T00:00:00Z' },
    ],
    audit_events: [
      { id: 'audit-1', subscriber_id: 'subscriber-authoritative', clinic_id: 'clinic-1', event_type: 'platform.registration.approved', entity_type: 'registration', entity_id: 'registration-1', created_at: '2026-08-02T00:00:00Z' },
    ],
  };
  const counts: Record<string, number> = { laboratories: 1, associate: 2, staff: 4 };

  const from = vi.fn((table: string) => {
    const log: QueryLog = { table, filters: [], head: false };
    logs.push(log);
    const builder: any = {
      select: vi.fn((_columns?: string, config?: { head?: boolean }) => { log.head = config?.head === true; return builder; }),
      eq: vi.fn((column: string, value: unknown) => { log.filters.push([column, value]); return builder; }),
      in: vi.fn((column: string, value: unknown) => { log.filters.push([column, value]); return builder; }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      maybeSingle: vi.fn(async () => ({ data: rows[table] ?? null, error: options.failTable === table ? { message: 'failed' } : null })),
      then: (resolve: (value: unknown) => unknown) => {
        let data: unknown = lists[table] ?? [];
        let count: number | null = null;
        if (log.head) {
          const role = log.filters.find(([column]) => column === 'role')?.[1];
          count = counts[String(role ?? table)] ?? counts[table] ?? 0;
          data = null;
        }
        return Promise.resolve(resolve({ data, count, error: options.failTable === table ? { message: 'failed' } : null }));
      },
    };
    return builder;
  });

  return {
    client: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-user', email: 'owner@example.com' } }, error: null }) },
      rpc: vi.fn().mockResolvedValue({ data: { memberships }, error: null }),
      from,
    } as any,
    logs,
  };
}

describe('Clinic Owner authoritative read adapter', () => {
  it('derives subscriber scope only from the authenticated active owner membership', async () => {
    localStorage.setItem('pnj_mock_platform_users', JSON.stringify([{ email: 'owner@example.com', subscriberId: 'attacker-subscriber' }]));
    const { client, logs } = clientFixture();
    const result = await getClinicOwnerBootstrap(client);

    expect(client.auth.getUser).toHaveBeenCalledTimes(1);
    expect(client.rpc).toHaveBeenCalledWith('get_my_first_login_state');
    expect(result.subscriber.id).toBe('subscriber-authoritative');
    expect(result.owner.displayName).toBe('Real Owner');
    expect(logs.filter((log) => log.table !== 'profiles' && log.table !== 'plans').some((log) => log.filters.some(([column, value]) => column === 'subscriber_id' && value === 'subscriber-authoritative'))).toBe(true);
    expect(JSON.stringify(logs)).not.toContain('attacker-subscriber');
  });

  it('fails safely for zero, multiple, and password-gated owner memberships before tenant reads', async () => {
    for (const [memberships, code] of [
      [[], 'NO_ACTIVE_CLINIC_OWNER_MEMBERSHIP'],
      [[ownerMembership, { ...ownerMembership, membershipId: 'membership-2' }], 'MULTIPLE_ACTIVE_CLINIC_OWNER_MEMBERSHIPS'],
      [[{ ...ownerMembership, mustChangePassword: true }], 'PASSWORD_CHANGE_REQUIRED'],
    ] as const) {
      const { client } = clientFixture({ memberships: [...memberships] });
      await expect(getClinicOwnerBootstrap(client)).rejects.toMatchObject({ code });
      expect(client.from).not.toHaveBeenCalled();
    }
  });

  it('loads the real current subscription, plan, tenant clinics, and active usage counts', async () => {
    const { client } = clientFixture();
    const result = await getClinicOwnerBootstrap(client);
    expect(result.subscription).toMatchObject({ id: 'subscription-1', amountCentavos: 850000, status: 'active' });
    expect(result.plan).toMatchObject({ code: 'plus', name: 'Plus', monthlyAmountCentavos: 850000 });
    expect(result.clinics).toHaveLength(2);
    expect(result.clinics[0]).toMatchObject({ clinicNumber: 'CLN-001', branchType: 'main', isPrimary: true });
    expect(result.auditEvents).toEqual([
      expect.objectContaining({ id: 'audit-1', eventType: 'platform.registration.approved', clinicId: 'clinic-1' }),
    ]);
    expect(result.resourceCounts).toEqual({ activeClinics: 1, activeLaboratories: 1, activeAssociates: 2, activeStaff: 4 });
    expect(result.quotas.associates).toEqual({ key: 'associates', limit: { kind: 'number', value: 6 }, activeUsage: 2 });
  });

  it('does not silently select a first subscription', async () => {
    const { client } = clientFixture({ subscriptionRows: [
      { id: 'subscription-1', subscriber_id: 'subscriber-authoritative', plan_id: 'plan-plus', status: 'active' },
      { id: 'subscription-2', subscriber_id: 'subscriber-authoritative', plan_id: 'plan-plus', status: 'pending' },
    ] });
    await expect(getClinicOwnerBootstrap(client)).rejects.toMatchObject({ code: 'DATA_UNAVAILABLE' });
  });

  it('keeps unknown limits unavailable instead of converting them to Max or unlimited', () => {
    expect(normalizeClinicOwnerPlanLimits([{ key: 'clinics', type: 'mystery', value: 100 }])).toEqual({
      clinics: { kind: 'unavailable' },
      laboratories: { kind: 'unavailable' },
      associates: { kind: 'unavailable' },
      staff: { kind: 'unavailable' },
    });
  });

  it('does not substitute mock data after an RLS/backend failure', async () => {
    const { client } = clientFixture({ failTable: 'clinics' });
    await expect(getClinicOwnerBootstrap(client)).rejects.toEqual(new ClinicOwnerApiError('DATA_UNAVAILABLE'));
  });
});
