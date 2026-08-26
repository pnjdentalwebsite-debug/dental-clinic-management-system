import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockLaboratoryService } from './mockLaboratoryService';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
  mockClinicService.initializeClinics();
  mockLaboratoryService.initializeLaboratories();
};

const makeForm = () => {
  const subscriber = mockPlatformManagementService.getSubscriberById('SUB-MOCK-MAX')!;
  return {
    ...mockLaboratoryService.toFormData(),
    subscriberId: subscriber.id,
    name: `Smoke Dental Lab ${Date.now()}`,
    legalBusinessName: subscriber.businessName,
    email: `lab-${Date.now()}@example.com`,
    contactNumber: '09171234567',
    contactPersonName: 'Lab Contact',
    contactPersonPosition: 'Coordinator',
    addressLine1: '123 Lab Street',
    city: 'Manila',
    province: 'Metro Manila'
  };
};

describe('mockLaboratoryService', () => {
  beforeEach(setup);

  it('seeds laboratories, services, and connections without duplicates', () => {
    const first = mockLaboratoryService.initializeLaboratories();
    const second = mockLaboratoryService.initializeLaboratories();
    expect(first.length).toBeGreaterThanOrEqual(6);
    expect(second).toHaveLength(first.length);
    expect(mockLaboratoryService.getLaboratoryServices('LAB-MOCK-PLUS-INTERNAL').length).toBeGreaterThan(0);
    expect(mockLaboratoryService.getLaboratoryConnections('LAB-MOCK-PLUS-INTERNAL').length).toBeGreaterThan(0);
  });

  it('creates, updates, activates, deactivates, archives, and restores laboratories', () => {
    const created = mockLaboratoryService.createLaboratory(makeForm());
    expect(created.ok).toBe(true);
    const updated = mockLaboratoryService.updateLaboratory(created.data!.id, { ...mockLaboratoryService.toFormData(created.data), name: 'Updated Lab Name' });
    expect(updated.data?.name).toBe('Updated Lab Name');
    expect(mockLaboratoryService.deactivateLaboratory(created.data!.id, 'seasonal pause').data?.status).toBe('inactive');
    expect(mockLaboratoryService.activateLaboratory(created.data!.id).data?.status).toBe('active');
    expect(mockLaboratoryService.archiveLaboratory(created.data!.id, 'duplicate vendor').data?.status).toBe('archived');
    expect(mockLaboratoryService.restoreLaboratory(created.data!.id, true).data?.status).toBe('inactive');
  });

  it('enforces limits and duplicate laboratory prevention', () => {
    expect(mockLaboratoryService.validateLaboratoryLimit('SUB-MOCK-PLUS').valid).toBe(false);
    const source = mockLaboratoryService.getLaboratoriesBySubscriberId('SUB-MOCK-PLUS')[0];
    const duplicate = mockLaboratoryService.createLaboratory({ ...mockLaboratoryService.toFormData(source), subscriberId: source.subscriberId }, false, true);
    expect(duplicate.ok).toBe(false);
  });

  it('connects, blocks cross-subscriber duplicates, disconnects, and maintains preferred uniqueness', () => {
    const lab = mockLaboratoryService.getLaboratoriesBySubscriberId('SUB-MOCK-MAX').find(item => item.status === 'active')!;
    const clinic = mockClinicService.getClinicsBySubscriberId('SUB-MOCK-MAX').find(item => item.status === 'active')!;
    const foreignClinic = mockClinicService.getClinicsBySubscriberId('SUB-MOCK-PLUS')[0];
    expect(mockLaboratoryService.connectLaboratoryToClinic(lab.id, foreignClinic.id).ok).toBe(false);
    const connected = mockLaboratoryService.connectLaboratoryToClinic(lab.id, clinic.id, { isPreferred: true });
    expect(connected.ok).toBe(true);
    expect(mockLaboratoryService.connectLaboratoryToClinic(lab.id, clinic.id).ok).toBe(false);
    expect(mockLaboratoryService.setPreferredLaboratory(clinic.id, lab.id).data?.isPreferred).toBe(true);
    const preferred = mockLaboratoryService.getClinicLaboratories(clinic.id).filter(item => item.connection.isPreferred);
    expect(preferred).toHaveLength(1);
    expect(mockLaboratoryService.disconnectLaboratoryFromClinic(connected.data!.id, 'changed vendor').data?.status).toBe('disconnected');
  });

  it('creates, updates, archives, and restores laboratory services', () => {
    const lab = mockLaboratoryService.getLaboratoriesBySubscriberId('SUB-MOCK-MAX')[0];
    const created = mockLaboratoryService.createLaboratoryService(lab.id, {
      id: '',
      laboratoryId: lab.id,
      serviceCode: 'TST',
      name: 'Test Service',
      category: 'other',
      description: 'Test only',
      defaultPrice: 100,
      currency: 'PHP',
      defaultTurnaroundDays: 5,
      rushAvailable: true,
      rushAdditionalDays: 2,
      rushFee: 25,
      status: 'active',
      createdAt: '',
      updatedAt: ''
    });
    expect(created.ok).toBe(true);
    expect(mockLaboratoryService.updateLaboratoryService(created.data!.id, { name: 'Updated Service' }).data?.name).toBe('Updated Service');
    expect(mockLaboratoryService.archiveLaboratoryService(created.data!.id).data?.status).toBe('archived');
    expect(mockLaboratoryService.restoreLaboratoryService(created.data!.id).data?.status).toBe('inactive');
  });

  it('reconciles subscriber laboratory counts and registration provisioning idempotently', () => {
    mockLaboratoryService.provisionRegistrationLaboratories();
    mockLaboratoryService.provisionRegistrationLaboratories();
    const subscribers = mockLaboratoryService.reconcileSubscriberLaboratoryCounts();
    const max = subscribers.find(item => item.id === 'SUB-MOCK-MAX')!;
    expect(max.laboratoryCount).toBe(mockLaboratoryService.getLaboratoriesBySubscriberId(max.id).filter(item => item.status !== 'archived').length);
  });
});
