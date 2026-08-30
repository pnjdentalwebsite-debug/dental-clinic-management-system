import type { PlatformAdminDirectorySnapshot } from '../../../infrastructure/supabase/platformAdminApi';

const subscriberId = '11111111-1111-4111-8111-111111111111';
const ownerId = '99999999-9999-4999-8999-999999999991';
const ownerUserId = '22222222-2222-4222-8222-222222222222';
const associateId = '99999999-9999-4999-8999-999999999992';
const associateUserId = '33333333-3333-4333-8333-333333333333';
const clinicId = '44444444-4444-4444-8444-444444444444';
const planId = '55555555-5555-4555-8555-555555555555';
const subscriptionId = '66666666-6666-4666-8666-666666666666';
const paymentId = '77777777-7777-4777-8777-777777777777';
const registrationId = '88888888-8888-4888-8888-888888888888';

export const platformAdminRealDataTestIds = { subscriberId, ownerId, associateId, clinicId, planId, subscriptionId, paymentId, registrationId };

export function makePlatformAdminRealDataTestSnapshot(): PlatformAdminDirectorySnapshot {
  const page = (items: Record<string, unknown>[]) => ({ items, page: 1, pageSize: 100, total: items.length });
  return {
    summary: { pendingRegistrationReviews: 0, pendingPaymentReviews: 0, activeSubscribers: 1, activeClinics: 1, activeSubscriptions: 1, platformUsers: 2, activeSubscriptionMrrCentavos: 500000, subscriptionStatuses: { active: 1, pending: 0, expiringSoon: 0, expired: 0, suspended: 0, cancelled: 0 }, activePlanDistribution: { basic: 1 }, subscriberSummary: { total: 1, active: 1, pending: 0, suspended: 0, deactivated: 0 }, clinicSummary: { total: 1, active: 1, pending: 0, draft: 0, inactive: 0, archived: 0, primary: 1, withoutDentists: 0, withoutStaff: 1 }, paymentSummary: { total: 1, pendingVerification: 0, approved: 1, rejected: 0, refunded: 0, voided: 0, approvedAmountCentavos: 500000, refundedAmountCentavos: 0 }, personnelSummary: { total: 1, active: 1, associates: 1, staff: 0 } },
    subscribers: page([{ id: subscriberId, subscriberNumber: 'SUB-DEV-001', registrationId, paymentStatus: 'approved', businessName: 'Harbor Dental Clinic', email: 'owner@example.test', mobileNumber: '09170000000', accountStatus: 'active', createdAt: '2026-08-30T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z', activatedAt: '2026-08-30T00:00:00Z', owner: { membershipId: ownerId, userId: ownerUserId, email: 'owner@example.test', displayName: 'Development Owner', mobileNumber: '09170000000', accountStatus: 'active', mustChangePassword: false }, primaryClinic: { id: clinicId, clinicNumber: 'CLN-DEV-001', name: 'Harbor Dental Clinic', status: 'active' }, subscription: { id: subscriptionId, planId, planCode: 'basic', planName: 'Basic', status: 'active', billingCycle: 'monthly', amountCentavos: 500000, startsAt: '2026-08-30T00:00:00Z', expiresAt: '2027-08-30T00:00:00Z' }, counts: { clinics: 1, laboratories: 0, associates: 1, staff: 0 } }]),
    users: page([
      { id: ownerId, userId: ownerUserId, subscriberId, userNumber: 'USR-DEV-001', fullName: 'Development Owner', firstName: 'Development', lastName: 'Owner', email: 'owner@example.test', mobileNumber: '09170000000', role: 'clinic_owner', position: 'Clinic Owner', accountStatus: 'active', mustChangePassword: false, clinicIds: [clinicId], createdAt: '2026-08-30T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z' },
      { id: associateId, userId: associateUserId, subscriberId, userNumber: 'DEN-DEV-001', fullName: 'Development Dentist', firstName: 'Development', lastName: 'Dentist', email: 'dentist@example.test', mobileNumber: '09170000001', role: 'associate', position: 'Associate Dentist', accountStatus: 'active', mustChangePassword: false, clinicIds: [clinicId], createdAt: '2026-08-30T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z' },
    ]),
    clinics: page([{ id: clinicId, subscriberId, subscriberNumber: 'SUB-DEV-001', subscriberName: 'Harbor Dental Clinic', clinicNumber: 'CLN-DEV-001', branchType: 'main', name: 'Harbor Dental Clinic', legalBusinessName: 'Harbor Dental Clinic', email: 'clinic@example.test', contactNumber: '09170000000', addressLine1: 'Development Test Address', city: 'Manila', province: 'Metro Manila', country: 'Philippines', timezone: 'Asia/Manila', status: 'active', visibility: 'visible', isPrimary: true, owner: { membershipId: ownerId, userId: ownerUserId, displayName: 'Development Owner', email: 'owner@example.test' }, dentistMembershipIds: [associateId], staffMembershipIds: [], businessHours: [{ dayOfWeek: 1, isOpen: true, openingTime: '09:00', closingTime: '17:00', breakStart: null, breakEnd: null }], createdAt: '2026-08-30T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z', activatedAt: '2026-08-30T00:00:00Z' }]),
    payments: page([{ id: paymentId, registrationId, subscriberId, subscriptionId, planId, payerName: 'Development Owner', payerEmail: 'owner@example.test', paymentMethod: 'gcash', referenceNumber: 'DEV-PAY-001', amountCentavos: 500000, status: 'approved', submittedAt: '2026-08-30T00:00:00Z', reviewedAt: '2026-08-30T01:00:00Z', createdAt: '2026-08-30T00:00:00Z', updatedAt: '2026-08-30T01:00:00Z' }]),
    subscriptions: page([{ id: subscriptionId, subscriberId, subscriberNumber: 'SUB-DEV-001', subscriberName: 'Harbor Dental Clinic', registrationId, planId, planCode: 'basic', planName: 'Basic', billingCycle: 'monthly', amountCentavos: 500000, monthlyAmountCentavos: 500000, annualAmountCentavos: 5100000, sourcePaymentId: paymentId, sourcePaymentStatus: 'approved', status: 'active', startsAt: '2026-08-30T00:00:00Z', expiresAt: '2027-08-30T00:00:00Z', createdAt: '2026-08-30T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z' }]),
    plans: page([{ id: planId, planCode: 'basic', name: 'Basic', status: 'active', monthlyAmountCentavos: 500000, annualAmountCentavos: 5100000, limits: [{ key: 'clinics', label: 'Clinics', type: 'number', value: 1 }], features: [{ key: 'patient_management', label: 'Patient Management', description: 'Manage patient records.', enabled: true }], subscriberCount: 1, createdAt: '2026-08-30T00:00:00Z', updatedAt: '2026-08-30T00:00:00Z' }]),
  };
}
