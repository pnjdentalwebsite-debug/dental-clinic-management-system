import { handleAssociateProvisioning } from './logic.ts';

type RpcReply = { data?: unknown; error?: unknown };

function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEquals(actual: unknown, expected: unknown, message = 'Values are not equal'): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}: ${JSON.stringify(actual)} !== ${JSON.stringify(expected)}`);
  }
}

const actorId = '10000000-0000-4000-8000-000000000001';
const clinicA = '20000000-0000-4000-8000-000000000001';
const clinicB = '20000000-0000-4000-8000-000000000002';
const attemptId = '30000000-0000-4000-8000-000000000001';
const authUserId = '40000000-0000-4000-8000-000000000001';
const membershipId = '50000000-0000-4000-8000-000000000001';

const createPayload = () => ({
  email: 'associate@test.invalid',
  firstName: 'Ava',
  middleName: 'Q',
  lastName: 'Dentist',
  mobileNumber: '+63 917 000 0000',
  address: 'Test address',
  licenseNumber: 'LIC-TEST',
  ptrNumber: 'PTR-TEST',
  s2LicenseNumber: 'S2-TEST',
  designation: 'Associate Dentist',
  specialization: 'General Dentistry',
  calendarColor: '#2563eb',
  certificatesAndQualifications: 'Test qualification',
  clinicIds: [clinicA, clinicB],
});

class FakeAdmin {
  rpcCalls: Array<{ name: string; params: Record<string, unknown> }> = [];
  createdPayloads: Array<Record<string, unknown>> = [];
  updatedPayloads: Array<{ id: string; payload: Record<string, unknown> }> = [];
  deletedIds: string[] = [];
  users: Array<{ id: string; email: string }> = [];
  replies = new Map<string, RpcReply>();
  authCreateError = false;

  auth = {
    admin: {
      listUsers: async () => ({ data: { users: this.users }, error: null }),
      createUser: async (payload: Record<string, unknown>) => {
        this.createdPayloads.push(structuredClone(payload));
        return this.authCreateError
          ? { data: { user: null }, error: { message: 'test Auth create failure' } }
          : { data: { user: { id: authUserId } }, error: null };
      },
      updateUserById: async (id: string, payload: Record<string, unknown>) => {
        this.updatedPayloads.push({ id, payload: structuredClone(payload) });
        return { data: { user: { id } }, error: null };
      },
      deleteUser: async (id: string) => {
        this.deletedIds.push(id);
        return { data: null, error: null };
      },
    },
  };

  async rpc(name: string, params: Record<string, unknown>): Promise<RpcReply> {
    this.rpcCalls.push({ name, params: structuredClone(params) });
    return this.replies.get(name) ?? { data: null, error: null };
  }
}

function request(payload: unknown): Request {
  return new Request('http://localhost/provision-associate-dentist', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function invoke(admin: FakeAdmin, payload: unknown, userId: unknown = actorId) {
  const result = await handleAssociateProvisioning(request(payload), {
    userClaims: userId === null ? null : { id: userId },
    supabaseAdmin: admin,
  });
  return { status: result.status, body: await result.json() };
}

function configureCreate(admin: FakeAdmin): void {
  admin.replies.set('begin_associate_provisioning', {
    data: [{
      attempt_id: attemptId,
      attempt_status: 'claimed',
      operation: 'create',
      auth_user_id: null,
      membership_id: null,
      credential_delivery_status: 'pending',
    }],
  });
  admin.replies.set('record_associate_provisioning_auth_identity', { data: null });
  admin.replies.set('complete_associate_provisioning', {
    data: [{
      membership_id: membershipId,
      associate_number: 'DEN-SERVEROWNED',
      credential_delivery_status: 'pending',
    }],
  });
  admin.replies.set('record_associate_credential_delivery', {
    data: [{
      membership_id: membershipId,
      associate_number: 'DEN-SERVEROWNED',
      credential_delivery_status: 'sent',
    }],
  });
}

const originalFetch = globalThis.fetch;

function useSuccessfulGateway(): Array<Record<string, unknown>> {
  const payloads: Array<Record<string, unknown>> = [];
  Deno.env.set('REGISTRATION_EMAIL_ENDPOINT', 'https://gateway.test.invalid/send');
  Deno.env.set('REGISTRATION_EMAIL_API_TOKEN', 'server-only-token');
  Deno.env.set('REGISTRATION_EMAIL_FROM', 'PJ Dental <no-reply@test.invalid>');
  globalThis.fetch = async (_input, init) => {
    payloads.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
    return new Response('{}', { status: 200 });
  };
  return payloads;
}

function resetGateway(): void {
  globalThis.fetch = originalFetch;
  Deno.env.delete('REGISTRATION_EMAIL_ENDPOINT');
  Deno.env.delete('REGISTRATION_EMAIL_API_TOKEN');
  Deno.env.delete('REGISTRATION_EMAIL_FROM');
}

Deno.test('unauthenticated Associate provisioning is rejected before a database claim', async () => {
  const admin = new FakeAdmin();
  const result = await invoke(admin, createPayload(), null);
  assertEquals(result.status, 401);
  assertEquals(result.body.error.code, 'AUTH_REQUIRED');
  assertEquals(admin.rpcCalls.length, 0);
});

Deno.test('protected browser authority fields are rejected before the service boundary', async () => {
  for (const protectedKey of ['subscriberId', 'role', 'temporaryPassword', 'membershipId', 'accountStatus']) {
    const admin = new FakeAdmin();
    const result = await invoke(admin, { ...createPayload(), [protectedKey]: 'browser-controlled' });
    assertEquals(result.status, 422, `${protectedKey} status`);
    assertEquals(result.body.error.code, 'INVALID_ASSOCIATE_INPUT', `${protectedKey} code`);
    assertEquals(admin.rpcCalls.length, 0, `${protectedKey} must not reach RPC`);
  }
});

Deno.test('the create RPC receives only normalized approved Associate fields and the verified actor', async () => {
  const admin = new FakeAdmin();
  configureCreate(admin);
  const gatewayPayloads = useSuccessfulGateway();
  try {
    const result = await invoke(admin, createPayload());
    assertEquals(result.status, 200);
    const begin = admin.rpcCalls.find((call) => call.name === 'begin_associate_provisioning');
    assert(begin);
    assertEquals(begin.params.p_actor_user_id, actorId);
    assertEquals(Object.keys(begin.params.p_input as Record<string, unknown>).sort(), [
      'address', 'calendarColor', 'certificatesAndQualifications', 'clinicIds', 'designation', 'email',
      'firstName', 'lastName', 'licenseNumber', 'middleName', 'mobileNumber', 'ptrNumber',
      's2LicenseNumber', 'specialization',
    ].sort());
    assertEquals((begin.params.p_input as Record<string, unknown>).email, 'associate@test.invalid');
    assertEquals(gatewayPayloads.length, 1);
    assertEquals(gatewayPayloads[0].to, 'associate@test.invalid');
    assert(typeof gatewayPayloads[0].gatewayToken === 'string');
  } finally {
    resetGateway();
  }
});

Deno.test('the server generates the temporary credential and never returns it', async () => {
  const admin = new FakeAdmin();
  configureCreate(admin);
  const gatewayPayloads = useSuccessfulGateway();
  try {
    const result = await invoke(admin, createPayload());
    const created = admin.createdPayloads[0];
    assert(typeof created.password === 'string' && (created.password as string).length === 20);
    assert((created.password as string) !== 'browser-controlled');
    const responseText = JSON.stringify(result.body).toLowerCase();
    assert(!responseText.includes('password'));
    assert(!responseText.includes('token'));
    assert(!responseText.includes(String(created.password).toLowerCase()));
    assert(!JSON.stringify(admin.rpcCalls).includes(String(created.password)));
    assert(JSON.stringify(gatewayPayloads[0]).includes(String(created.password)));
  } finally {
    resetGateway();
  }
});

Deno.test('an existing Auth email fails closed without creating or attaching an Associate', async () => {
  const admin = new FakeAdmin();
  configureCreate(admin);
  admin.users = [{ id: '90000000-0000-4000-8000-000000000001', email: 'associate@test.invalid' }];
  const result = await invoke(admin, createPayload());
  assertEquals(result.status, 409);
  assertEquals(result.body.error.code, 'ASSOCIATE_EMAIL_UNAVAILABLE');
  assertEquals(admin.createdPayloads.length, 0);
  assert(admin.rpcCalls.some((call) => call.name === 'fail_associate_provisioning_attempt'));
  assert(!JSON.stringify(result.body).includes('90000000'));
});

Deno.test('an Auth creation failure leaves no database Associate provisioning step to complete', async () => {
  const admin = new FakeAdmin();
  configureCreate(admin);
  admin.authCreateError = true;
  const result = await invoke(admin, createPayload());
  assertEquals(result.status, 409);
  assertEquals(result.body.error.code, 'ASSOCIATE_EMAIL_UNAVAILABLE');
  assertEquals(admin.createdPayloads.length, 1);
  assert(!admin.rpcCalls.some((call) => call.name === 'record_associate_provisioning_auth_identity'));
  assert(!admin.rpcCalls.some((call) => call.name === 'complete_associate_provisioning'));
  assert(admin.rpcCalls.some((call) => call.name === 'fail_associate_provisioning_attempt'));
});

Deno.test('database provisioning failure compensates the newly-created Auth identity', async () => {
  const admin = new FakeAdmin();
  configureCreate(admin);
  admin.replies.set('complete_associate_provisioning', { error: { message: 'database unavailable' } });
  const result = await invoke(admin, createPayload());
  assertEquals(result.status, 409);
  assertEquals(result.body.error.code, 'ASSOCIATE_PROVISIONING_FAILED');
  assertEquals(admin.deletedIds, [authUserId]);
  assert(admin.rpcCalls.some((call) => call.name === 'fail_associate_provisioning_attempt'));
  assert(admin.rpcCalls.some((call) => call.name === 'clear_failed_associate_attempt_auth_identity'));
});

Deno.test('credential delivery failure returns a safe retry-required state and records failure', async () => {
  const admin = new FakeAdmin();
  configureCreate(admin);
  Deno.env.set('REGISTRATION_EMAIL_ENDPOINT', 'https://gateway.test.invalid/send');
  Deno.env.set('REGISTRATION_EMAIL_API_TOKEN', 'server-only-token');
  Deno.env.set('REGISTRATION_EMAIL_FROM', 'PJ Dental <no-reply@test.invalid>');
  globalThis.fetch = async () => { throw new Error('gateway unavailable'); };
  try {
    const result = await invoke(admin, createPayload());
    assertEquals(result.status, 503);
    assertEquals(result.body.error.code, 'CREDENTIAL_DELIVERY_FAILED');
    assert(!JSON.stringify(result.body).toLowerCase().includes('password'));
    const delivery = admin.rpcCalls.find((call) => call.name === 'record_associate_credential_delivery');
    assertEquals(delivery?.params.p_delivery_status, 'failed');
  } finally {
    resetGateway();
  }
});

Deno.test('a ledger delivery retry rotates credentials server-side and returns only safe completion', async () => {
  const admin = new FakeAdmin();
  admin.replies.set('begin_associate_provisioning', {
    data: [{
      attempt_id: attemptId,
      attempt_status: 'completed',
      operation: 'delivery_retry',
      auth_user_id: authUserId,
      membership_id: membershipId,
      credential_delivery_status: 'failed',
    }],
  });
  admin.replies.set('prepare_associate_credential_retry', {
    data: [{ auth_user_id: authUserId, membership_id: membershipId, email_normalized: 'associate@test.invalid' }],
  });
  admin.replies.set('record_associate_credential_delivery', {
    data: [{ membership_id: membershipId, associate_number: 'DEN-SERVEROWNED', credential_delivery_status: 'sent' }],
  });
  useSuccessfulGateway();
  try {
    const result = await invoke(admin, createPayload());
    assertEquals(result.body, {
      provisioningStatus: 'completed',
      membershipId,
      associateNumber: 'DEN-SERVEROWNED',
      credentialDelivery: { status: 'sent' },
    });
    assertEquals(admin.updatedPayloads.length, 1);
    assert(typeof admin.updatedPayloads[0].payload.password === 'string');
    assert(!JSON.stringify(result.body).toLowerCase().includes('password'));
  } finally {
    resetGateway();
  }
});
