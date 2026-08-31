import { handleAssociateUpdate } from './logic.ts';

function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message = 'Values are not equal'): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
}

const actorId = '10000000-0000-4000-8000-000000000001';
const membershipId = '20000000-0000-4000-8000-000000000001';
const clinicId = '30000000-0000-4000-8000-000000000001';

const payload = () => ({
  membershipId, firstName: 'Ava', middleName: 'Q', lastName: 'Dentist', mobileNumber: '+63 917 000 0000', address: 'Test address',
  licenseNumber: 'LIC-TEST', ptrNumber: 'PTR-TEST', s2LicenseNumber: 'S2-TEST', designation: 'Associate Dentist',
  specialization: 'General Dentistry', calendarColor: '#2563eb', certificatesAndQualifications: 'Test qualification', clinicIds: [clinicId],
});

class FakeAdmin {
  calls: Array<{ name: string; params: Record<string, unknown> }> = [];
  reply: { data?: unknown; error?: unknown } = { data: { updated: true } };
  async rpc(name: string, params: Record<string, unknown>) {
    this.calls.push({ name, params: structuredClone(params) });
    return this.reply;
  }
}

async function invoke(admin: FakeAdmin, body: unknown, userId: unknown = actorId) {
  const request = new Request('http://localhost/update-associate-dentist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const result = await handleAssociateUpdate(request, { userClaims: userId === null ? null : { id: userId }, supabaseAdmin: admin });
  return { status: result.status, body: await result.json() };
}

Deno.test('Associate update requires authentication before calling the service-only RPC', async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, payload(), null);
  assertEquals(result.status, 401);
  assertEquals(result.body.error.code, 'AUTH_REQUIRED');
  assertEquals(admin.calls, []);
});

Deno.test('Associate update rejects browser authority and immutable identity fields', async () => {
  for (const key of ['email', 'subscriberId', 'role', 'userId', 'accountStatus', 'temporaryPassword', 'associateNumber']) {
    const admin = new FakeAdmin();
    const result = await invoke(admin, { ...payload(), [key]: 'browser-controlled' });
    assertEquals(result.status, 422, `${key} must fail`);
    assertEquals(result.body.error.code, 'INVALID_ASSOCIATE_INPUT');
    assertEquals(admin.calls, []);
  }
});

Deno.test('Associate update forwards only the exact membership ID, authenticated actor, and normalized editable allowlist', async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, payload());
  assertEquals(result.status, 200);
  assertEquals(result.body, { updated: true, membershipId });
  assertEquals(admin.calls.length, 1);
  const call = admin.calls[0];
  assertEquals(call.name, 'update_my_associate_dentist');
  assertEquals(call.params.p_actor_user_id, actorId);
  assertEquals(call.params.p_membership_id, membershipId);
  assertEquals(Object.keys(call.params.p_input as Record<string, unknown>).sort(), [
    'address', 'calendarColor', 'certificatesAndQualifications', 'clinicIds', 'designation', 'firstName', 'lastName',
    'licenseNumber', 'middleName', 'mobileNumber', 'ptrNumber', 's2LicenseNumber', 'specialization',
  ].sort());
  assertEquals((call.params.p_input as Record<string, unknown>).clinicIds, [clinicId]);
  assert(!JSON.stringify(call.params).toLowerCase().includes('password'));
});

Deno.test('Associate update maps backend failures to a safe response without raw database details', async () => {
  const admin = new FakeAdmin();
  admin.reply = { error: { message: 'PT404: ASSOCIATE_NOT_FOUND raw PostgreSQL details' } };
  const result = await invoke(admin, payload());
  assertEquals(result.status, 404);
  assertEquals(result.body.error.code, 'ASSOCIATE_NOT_FOUND');
  assert(!JSON.stringify(result.body).includes('PostgreSQL'));
});
