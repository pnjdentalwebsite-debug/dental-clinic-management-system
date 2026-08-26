import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import { mockPaymentService } from './mockPaymentService';
import type { PaymentFormData } from '../types';

const setup = () => {
  localStorage.clear();
  mockPlatformManagementService.ensureSeedData();
  mockPlanService.initializePlans();
  mockSubscriptionService.initializeSubscriptions();
};

const paymentData = (referenceNumber = 'UNIQUE-REF'): PaymentFormData => {
  const subscriber = mockPlatformManagementService.listSubscribers()[0];
  const subscription = mockSubscriptionService.getCurrentSubscriptionBySubscriberId(subscriber.id)!;
  return {
    ownerType: 'subscriber',
    registrationId: '',
    subscriberId: subscriber.id,
    subscriptionId: subscription.id,
    planId: subscription.priceSnapshot.planId,
    payerName: subscriber.businessName,
    payerEmail: subscriber.email,
    amount: 1000,
    paymentMethod: 'gcash',
    referenceNumber,
    paymentDate: '2026-07-26',
    notes: 'test',
    administrativeNotes: '',
    proofFileName: 'proof.txt',
    proofFileType: 'text/plain',
    allocationMode: 'unallocated',
    allocationAmount: 0
  };
};

describe('mockPaymentService', () => {
  beforeEach(setup);

  it('seeds missing payments once', () => {
    const first = mockPaymentService.initializePayments();
    const second = mockPaymentService.initializePayments();
    expect(first.length).toBeGreaterThanOrEqual(8);
    expect(second).toHaveLength(first.length);
  });

  it('creates payments and prevents duplicate references', () => {
    const created = mockPaymentService.createPayment(paymentData());
    expect(created.ok).toBe(true);
    expect(mockPaymentService.createPayment(paymentData()).ok).toBe(false);
  });

  it('supports verification, information request, rejection, allocation reversal, refund, void, and restore', () => {
    const created = mockPaymentService.createPayment(paymentData('FLOW-REF'));
    expect(mockPaymentService.requestPaymentInformation(created.data!.id, 'Upload clearer proof').data?.verificationStatus).toBe('additional_information_required');
    expect(mockPaymentService.approvePayment(created.data!.id).data?.verificationStatus).toBe('verified');

    const allocated = mockPaymentService.allocatePayment(created.data!.id, {
      allocationType: 'subscription_initial',
      amount: 400,
      subscriptionId: created.data!.subscriptionId,
      subscriberId: created.data!.subscriberId,
      description: 'partial allocation'
    });
    expect(allocated.data?.allocationStatus).toBe('partially_allocated');
    expect(mockPaymentService.allocatePayment(created.data!.id, { allocationType: 'manual_adjustment', amount: 99999, description: 'bad' }).ok).toBe(false);

    const allocation = mockPaymentService.getPaymentAllocations(created.data!.id).find(item => !item.reversedAt)!;
    expect(mockPaymentService.reverseAllocation(allocation.id, 'wrong target').ok).toBe(true);
    expect(mockPaymentService.refundPayment(created.data!.id, 300, 'courtesy').data?.status).toBe('partially_refunded');
    expect(mockPaymentService.refundPayment(created.data!.id, 99999, 'too much').ok).toBe(false);

    const rejected = mockPaymentService.createPayment(paymentData('REJECT-REF'));
    expect(mockPaymentService.rejectPayment(rejected.data!.id, 'not found').data?.status).toBe('rejected');

    const voided = mockPaymentService.createPayment(paymentData('VOID-REF'));
    mockPaymentService.approvePayment(voided.data!.id);
    expect(mockPaymentService.voidPayment(voided.data!.id, 'duplicate record').data?.status).toBe('voided');
    expect(mockPaymentService.restoreVoidedPayment(voided.data!.id).data?.status).toBe('pending_verification');
  });

  it('reconciles payment states and updates subscription summaries from allocations', () => {
    const created = mockPaymentService.createPayment(paymentData('RECON-REF'));
    mockPaymentService.approvePayment(created.data!.id);
    const before = mockPaymentService.reconcilePayment(created.data!.id);
    expect(before.status).toBe('balanced');
    mockPaymentService.allocatePayment(created.data!.id, { allocationType: 'subscription_initial', amount: 1000, subscriptionId: created.data!.subscriptionId, description: 'full' });
    expect(mockPaymentService.reconcilePayment(created.data!.id).status).toBe('fully_allocated');
    expect(mockPaymentService.calculateSubscriptionPaymentSummary(created.data!.subscriptionId!).allocatedAmount).toBeGreaterThan(0);
  });

  it('submits registration payments idempotently', () => {
    const registration = mockPlatformManagementService.listRegistrations()[0];
    if (!registration) return;
    const first = mockPaymentService.submitRegistrationPayment(registration.id, 'Demo Payment', 'REG-REF');
    const second = mockPaymentService.submitRegistrationPayment(registration.id, 'Demo Payment', 'REG-REF');
    expect(second.data?.id).toBe(first.data?.id);
  });
});
