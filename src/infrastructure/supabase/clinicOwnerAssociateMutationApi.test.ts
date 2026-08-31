import { describe, expect, it, vi } from 'vitest';
import {
  ClinicOwnerAssociateApiError,
  provisionClinicOwnerAssociate,
  updateClinicOwnerAssociate,
  type ClinicOwnerAssociateMutationInput,
} from './clinicOwnerAssociateApi';

const input: ClinicOwnerAssociateMutationInput = {
  email: 'ava@example.com', firstName: 'Ava', middleName: 'Q', lastName: 'Dentist', mobileNumber: '09170000001', address: 'Real Address',
  licenseNumber: 'LIC-1', ptrNumber: 'PTR-1', s2LicenseNumber: 'S2-1', designation: 'Associate Dentist', specialization: 'General Dentistry',
  calendarColor: '#2563eb', certificatesAndQualifications: 'DDS', clinicIds: ['11111111-1111-4111-8111-111111111111'],
};

function clientFixture(reply: { data: unknown; error: unknown } = { data: { provisioningStatus: 'completed', membershipId: 'membership-created', credentialDelivery: { status: 'sent' } }, error: null }) {
  const invoke = vi.fn().mockResolvedValue(reply);
  return { client: { functions: { invoke } } as any, invoke };
}

describe('Clinic Owner Associate mutation adapter', () => {
  it('invokes the deployed create Edge Function with only the approved payload allowlist', async () => {
    const { client, invoke } = clientFixture();
    await provisionClinicOwnerAssociate(input, client);
    expect(invoke).toHaveBeenCalledWith('provision-associate-dentist', { body: input });
    const body = invoke.mock.calls[0][1].body;
    for (const key of ['subscriberId', 'role', 'userId', 'membershipId', 'temporaryPassword', 'associateNumber', 'mustChangePassword', 'accountStatus']) {
      expect(body).not.toHaveProperty(key);
    }
  });

  it('invokes the authenticated edit boundary with the exact membership ID and never includes immutable email', async () => {
    const { client, invoke } = clientFixture({ data: { updated: true, membershipId: 'membership-exact' }, error: null });
    await updateClinicOwnerAssociate('membership-exact', input, client);
    expect(invoke).toHaveBeenCalledWith('update-associate-dentist', { body: expect.objectContaining({ membershipId: 'membership-exact', clinicIds: input.clinicIds }) });
    const body = invoke.mock.calls[0][1].body;
    expect(body).not.toHaveProperty('email');
    expect(body).not.toHaveProperty('subscriberId');
    expect(body).not.toHaveProperty('role');
  });

  it('maps safe Edge error codes without surfacing provider details', async () => {
    const { client } = clientFixture({ data: null, error: { context: new Response(JSON.stringify({ error: { code: 'ASSOCIATE_QUOTA_REACHED', message: 'provider details' } }), { headers: { 'content-type': 'application/json' } }) } });
    await expect(provisionClinicOwnerAssociate(input, client)).rejects.toEqual(new ClinicOwnerAssociateApiError('ASSOCIATE_QUOTA_REACHED'));
  });
});
