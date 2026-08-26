import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockClinicService } from './mockClinicService';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockClinicService.initializeClinics();
};

const makeForm = () => {
  const subscriber = mockPlatformManagementService.listSubscribers().find(item => item.id === 'SUB-MOCK-MAX')!;
  const owner = mockPlatformManagementService.getUsersBySubscriberId(subscriber.id).find(item => item.role === 'clinic_owner');
  return {
    ...mockClinicService.toFormData(),
    subscriberId: subscriber.id,
    primaryOwnerUserId: owner?.id || '',
    name: `Smoke Clinic ${Date.now()}`,
    legalBusinessName: subscriber.businessName,
    email: `clinic-${Date.now()}@example.com`,
    contactNumber: '09171234567',
    addressLine1: '123 Test Street',
    city: 'Manila',
    province: 'Metro Manila'
  };
};

describe('mockClinicService', () => {
  beforeEach(setup);

  it('seeds and normalizes clinics without duplicating records', () => {
    const first = mockClinicService.initializeClinics();
    const second = mockClinicService.initializeClinics();
    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(second).toHaveLength(first.length);
  });

  it('creates, updates, activates, deactivates, archives, and restores clinics', () => {
    const created = mockClinicService.createClinic(makeForm());
    expect(created.ok).toBe(true);
    const updated = mockClinicService.updateClinic(created.data!.id, { ...mockClinicService.toFormData(created.data), name: 'Updated Clinic Name' });
    expect(updated.data?.name).toBe('Updated Clinic Name');
    expect(mockClinicService.deactivateClinic(created.data!.id, 'seasonal closure').data?.status).toBe('inactive');
    expect(mockClinicService.activateClinic(created.data!.id).data?.status).toBe('active');
    expect(mockClinicService.archiveClinic(created.data!.id, 'duplicate location').data?.status).toBe('archived');
    expect(mockClinicService.restoreClinic(created.data!.id, true).data?.status).toBe('inactive');
  });

  it('enforces plan limits and duplicate clinic prevention', () => {
    const plus = mockPlatformManagementService.getSubscriberById('SUB-MOCK-PLUS')!;
    expect(mockClinicService.validateClinicLimit(plus.id).valid).toBe(false);
    const source = mockClinicService.getClinicsBySubscriberId(plus.id)[0];
    const duplicate = mockClinicService.createClinic({ ...mockClinicService.toFormData(source), subscriberId: plus.id }, false, true);
    expect(duplicate.ok).toBe(false);
  });

  it('handles assignments, cross-subscriber rejection, removal, primary clinic, and administrator changes', () => {
    const clinic = mockClinicService.getClinicsBySubscriberId('SUB-MOCK-MAX').find(item => item.id === 'CLN-MOCK-MAX-BGC')!;
    mockPlatformManagementService.activateUser('USR-MOCK-NOCLINIC');
    const dentist = mockPlatformManagementService.getUserById('USR-MOCK-NOCLINIC')!;
    const staff = mockPlatformManagementService.getUsersBySubscriberId(clinic.subscriberId).find(item => item.role === 'staff')!;
    const foreign = mockPlatformManagementService.getUsersBySubscriberId('SUB-MOCK-PLUS').find(item => item.role === 'associate')!;
    expect(mockClinicService.assignUserToClinic(clinic.id, foreign.id, 'associate').ok).toBe(false);
    expect(mockClinicService.assignUserToClinic(clinic.id, dentist.id, 'associate').ok).toBe(true);
    expect(mockClinicService.assignUserToClinic(clinic.id, dentist.id, 'associate').ok).toBe(false);
    expect(mockClinicService.assignUserToClinic(clinic.id, staff.id, 'staff').ok).toBe(true);
    const assignment = mockClinicService.getClinicAssignments(clinic.id).find(item => item.userId === staff.id && item.assignmentStatus === 'active')!;
    expect(mockClinicService.removeUserFromClinic(assignment.id, 'schedule change').ok).toBe(true);
    expect(mockClinicService.setPrimaryClinic(clinic.id).data?.isPrimaryClinic).toBe(true);
    mockPlatformManagementService.updateUser(staff.id, { role: 'clinic_owner', position: 'Clinic Owner' });
    const owner = mockPlatformManagementService.getUserById(staff.id)!;
    expect(mockClinicService.changePrimaryAdministrator(clinic.id, owner.id).data?.primaryOwnerUserId).toBe(owner.id);
  });

  it('reconciles subscriber counts and user assignment views', () => {
    const subscriber = mockPlatformManagementService.getSubscriberById('SUB-MOCK-MAX')!;
    mockClinicService.reconcileClinicAssignments();
    const counts = mockClinicService.reconcileSubscriberClinicCounts().find(item => item.id === subscriber.id)!;
    expect(counts.clinicCount).toBe(mockClinicService.getClinicsBySubscriberId(subscriber.id).filter(item => item.status !== 'archived').length);
    const user = mockPlatformManagementService.getUsersBySubscriberId(subscriber.id).find(item => item.clinicIds.length > 0)!;
    expect(mockClinicService.getClinicsByUserId(user.id).length).toBeGreaterThan(0);
  });
});
