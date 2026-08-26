import type { ActivityLogLike, PaymentLike, RegistrationLike, Subscriber } from '../../platformManagement/types';
import { mockPlatformManagementService, generateSecureTemporaryPassword } from '../../platformManagement/services/mockPlatformManagementService';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import type { Subscription } from '../../subscriptions/types';
import type {
  AllocationStatus,
  AllocationType,
  Payment,
  PaymentAllocation,
  PaymentFilters,
  PaymentFormData,
  PaymentHistoryRecord,
  PaymentMethod,
  PaymentRefund,
  PaymentResult,
  PaymentSort,
  PaymentStatus,
  ReconciliationResult,
  VerificationStatus
} from '../types';
import { validatePaymentForm, validatePaymentTransition, validateReferenceNumber } from '../validation/paymentValidation';

const PAYMENTS_KEY = 'pnj_mock_payments';
const ALLOCATIONS_KEY = 'pnj_mock_payment_allocations';
const HISTORY_KEY = 'pnj_mock_payment_history';
const REFUNDS_KEY = 'pnj_mock_refunds';
const ACTIVITY_KEY = 'pnj_mock_activity_logs';
const REGISTRATIONS_KEY = 'pnj_mock_registrations';
const SUBSCRIBERS_KEY = 'pnj_mock_subscribers';
const SUBSCRIPTIONS_KEY = 'pnj_mock_subscriptions';
const DELETED_PAYMENTS_KEY = 'pnj_mock_deleted_payments';

const today = () => new Date().toISOString().split('T')[0];
const nowText = () => new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const safeWrite = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    if (key === ACTIVITY_KEY && Array.isArray(value)) {
      const trimmed = value.slice(0, 200);
      try {
        localStorage.setItem(key, JSON.stringify(trimmed));
        return;
      } catch {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return;
      }
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};
const getDeletedPaymentKeys = (): string[] => safeRead<string[]>(DELETED_PAYMENTS_KEY, []).map(s => String(s || '').toLowerCase());

const readRegistrations = () => safeRead<RegistrationLike[]>(REGISTRATIONS_KEY, []);
const writeRegistrations = (records: RegistrationLike[]) => safeWrite(REGISTRATIONS_KEY, records);
const readSubscribers = () => safeRead<Subscriber[]>(SUBSCRIBERS_KEY, []);
const readAllocations = () => safeRead<PaymentAllocation[]>(ALLOCATIONS_KEY, []);
const writeAllocations = (records: PaymentAllocation[]) => safeWrite(ALLOCATIONS_KEY, records);
const readRefunds = () => safeRead<PaymentRefund[]>(REFUNDS_KEY, []);
const writeRefunds = (records: PaymentRefund[]) => safeWrite(REFUNDS_KEY, records);
const readHistory = () => safeRead<PaymentHistoryRecord[]>(HISTORY_KEY, []);
const writeHistory = (records: PaymentHistoryRecord[]) => safeWrite(HISTORY_KEY, records);
const readPaymentsRaw = () => {
  const deleted = getDeletedPaymentKeys();
  const raw = safeRead<Array<Partial<Payment> & Partial<PaymentLike> & Record<string, unknown>>>(PAYMENTS_KEY, []);
  return raw.filter(p => !deleted.includes(String(p.id || '').toLowerCase()) && !deleted.includes(String(p.paymentNumber || '').toLowerCase()) && !deleted.includes(String(p.referenceNumber || '').toLowerCase()));
};
const writePayments = (records: Payment[]) => safeWrite(PAYMENTS_KEY, records);
const numericAmount = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeMethod = (value?: string): PaymentMethod => {
  const normalized = String(value || 'demo_payment').toLowerCase().replaceAll(' ', '_').replaceAll('-', '_');
  if (['gcash', 'maya', 'bank_transfer', 'over_the_counter', 'cash', 'card', 'demo_payment', 'other'].includes(normalized)) return normalized as PaymentMethod;
  return 'other';
};

const paymentStatuses: PaymentStatus[] = ['draft', 'submitted', 'pending_verification', 'approved', 'partially_allocated', 'fully_allocated', 'rejected', 'partially_refunded', 'refunded', 'voided'];

const statusFromLegacy = (status?: string): PaymentStatus => {
  if (paymentStatuses.includes(status as PaymentStatus)) return status as PaymentStatus;
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'refunded') return 'refunded';
  if (status === 'unpaid') return 'submitted';
  return 'pending_verification';
};

const verificationFromStatus = (status: PaymentStatus): VerificationStatus =>
  status === 'approved' || status === 'partially_allocated' || status === 'fully_allocated' || status === 'partially_refunded' || status === 'refunded'
    ? 'verified'
    : status === 'rejected'
      ? 'rejected'
      : status === 'draft'
        ? 'not_required'
        : 'pending';

const allocationStatusFor = (amount: number, allocatedAmount: number): AllocationStatus => {
  if (allocatedAmount <= 0) return 'unallocated';
  if (allocatedAmount >= amount) return 'fully_allocated';
  return 'partially_allocated';
};

const paymentStatusAfterAllocation = (payment: Payment): PaymentStatus => {
  if (payment.status === 'voided' || payment.status === 'rejected' || payment.status === 'refunded' || payment.status === 'partially_refunded') return payment.status;
  if (payment.verificationStatus === 'pending' || payment.status === 'pending_verification' || payment.status === 'submitted') return 'pending_verification';
  if (payment.allocatedAmount > 0 && payment.allocatedAmount >= payment.amount) return 'fully_allocated';
  if (payment.allocatedAmount > 0) return 'partially_allocated';
  return payment.verificationStatus === 'verified' ? 'approved' : payment.status;
};

const logActivity = (event: string, details: string) => {
  const logs = safeRead<ActivityLogLike[]>(ACTIVITY_KEY, []);
  safeWrite(ACTIVITY_KEY, [{ id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, timestamp: nowText(), event, details, role: 'platform_owner' }, ...logs]);
};

const addHistory = (paymentId: string, action: string, details: string, previousStatus?: PaymentStatus, nextStatus?: PaymentStatus) => {
  writeHistory([{ id: `PH-${Date.now()}-${Math.floor(Math.random() * 1000)}`, paymentId, action, details, previousStatus, nextStatus, createdAt: nowText(), actor: 'platform_owner' }, ...readHistory()]);
  logActivity(`Payment ${action}`, details);
};

const registrationFor = (id?: string) => readRegistrations().find(item => item.id === id);
const subscriberFor = (id?: string) => readSubscribers().find(item => item.id === id);
const subscriptionFor = (id?: string) => id ? mockSubscriptionService.getSubscriptionById(id) : null;

const updateRegistrationPayment = (payment: Payment, patch: Partial<RegistrationLike>) => {
  if (!payment.registrationId) return;
  const records = readRegistrations();
  writeRegistrations(records.map(item => item.id === payment.registrationId ? { ...item, ...patch, updatedDate: today() } : item));
};

const ensureApprovedRegistrationProvisioning = (registrationId?: string) => {
  if (!registrationId) return;
  const approvedReg = readRegistrations().find(r => r.id === registrationId);
  if (!approvedReg) return;
  const tempPassword = approvedReg.tempPassword || generateSecureTemporaryPassword();
  const allRegs = readRegistrations();
  writeRegistrations(allRegs.map(r => r.id === registrationId ? {
    ...r,
    tempPassword,
    paymentStatus: 'approved',
    registrationStatus: 'account_ready',
    updatedDate: today()
  } : r));

  const subRes = mockPlatformManagementService.createSubscriberFromApprovedRegistration({
    ...approvedReg,
    tempPassword,
    paymentStatus: 'approved',
    registrationStatus: 'account_ready'
  });
  if (subRes.ok && subRes.data) {
    const syncedReg = readRegistrations().find(r => r.id === registrationId) || approvedReg;
    mockSubscriptionService.provisionSubscriptionForApprovedRegistration(subRes.data, {
      ...syncedReg,
      tempPassword,
      paymentStatus: 'approved',
      registrationStatus: 'account_ready'
    });
  }
};

const updateSubscriptionPaymentStatus = (subscriptionId?: string) => {
  if (!subscriptionId) return;
  const subscription = mockSubscriptionService.getSubscriptionById(subscriptionId);
  if (!subscription) return;
  const summary = mockPaymentService.calculateSubscriptionPaymentSummary(subscriptionId);
  const records = safeRead<Subscription[]>(SUBSCRIPTIONS_KEY, []);
  const paymentStatus = summary.outstandingAmount <= 0 ? 'paid' : summary.allocatedAmount > 0 ? 'partially_paid' : 'unpaid';
  safeWrite(SUBSCRIPTIONS_KEY, records.map(item => item.id === subscriptionId ? { ...item, paymentStatus, updatedAt: today() } : item));
};

const recalcPaymentAmounts = (payment: Payment): Payment => {
  const allocatedAmount = readAllocations().filter(item => item.paymentId === payment.id && !item.reversedAt).reduce((sum, item) => sum + item.amount, 0);
  const refundedAmount = readRefunds().filter(item => item.paymentId === payment.id).reduce((sum, item) => sum + item.amount, 0);
  const unallocatedAmount = Math.max(0, payment.amount - allocatedAmount);
  const allocationStatus = allocationStatusFor(payment.amount, allocatedAmount);
  const withAmounts = { ...payment, allocatedAmount, unallocatedAmount, refundedAmount, allocationStatus };
  return { ...withAmounts, status: paymentStatusAfterAllocation(withAmounts) };
};

const normalizePayment = (record: Partial<Payment> & Partial<PaymentLike> & Record<string, unknown>, index: number): Payment | null => {
  const id = String(record.id || `PAY-${Date.now()}-${index}`);
  const reg = registrationFor(String(record.registrationId || ''));
  const subscriber = subscriberFor(String(record.subscriberId || reg?.subscriberId || ''));
  const subscription = subscriptionFor(String(record.subscriptionId || subscriber?.subscriptionId || ''));
  const plan = mockPlanService.listPlans().find(item => [item.id, item.name, item.planCode].includes(String(record.planId || subscription?.planId || reg?.plan || '')));
  const amount = numericAmount(record.amount)
    ?? numericAmount(subscription?.priceSnapshot.appliedAmount)
    ?? numericAmount(plan?.monthlyPrice)
    ?? 0;
  const status = statusFromLegacy(String(record.status || record.paymentStatus || 'pending_verification'));
  const payment: Payment = {
    id,
    paymentNumber: String(record.paymentNumber || id.replace(/^PAY-?/, 'PAY-')),
    registrationId: record.registrationId ? String(record.registrationId) : reg?.id,
    subscriberId: record.subscriberId ? String(record.subscriberId) : subscriber?.id,
    subscriptionId: record.subscriptionId ? String(record.subscriptionId) : subscription?.id,
    planId: record.planId ? String(record.planId) : plan?.id,
    payerName: String(record.payerName || reg?.ownerName || subscriber?.businessName || 'Mock Payer'),
    payerEmail: String(record.payerEmail || reg?.ownerEmail || subscriber?.email || 'payer@example.com'),
    amount,
    allocatedAmount: Number(record.allocatedAmount || 0),
    unallocatedAmount: Number(record.unallocatedAmount ?? amount),
    refundedAmount: Number(record.refundedAmount || 0),
    currency: 'PHP',
    paymentMethod: normalizeMethod(String(record.paymentMethod || record.method || 'demo_payment')),
    referenceNumber: String(record.referenceNumber || `REF-${id}`),
    paymentDate: String(record.paymentDate || record.submittedDate || record.submittedAt || today()),
    submittedAt: record.submittedAt ? String(record.submittedAt) : record.submittedDate ? String(record.submittedDate) : today(),
    verifiedAt: record.verifiedAt ? String(record.verifiedAt) : status === 'approved' ? today() : undefined,
    rejectedAt: record.rejectedAt ? String(record.rejectedAt) : status === 'rejected' ? today() : undefined,
    refundedAt: record.refundedAt ? String(record.refundedAt) : undefined,
    voidedAt: record.voidedAt ? String(record.voidedAt) : undefined,
    status,
    verificationStatus: (record.verificationStatus as VerificationStatus) || verificationFromStatus(status),
    allocationStatus: (record.allocationStatus as AllocationStatus) || allocationStatusFor(amount, Number(record.allocatedAmount || 0)),
    proofOfPayment: record.proofOfPayment as Payment['proofOfPayment'] || { fileName: 'mock-proof.txt', fileType: 'text/plain', previewLabel: 'Mock proof placeholder' },
    notes: String(record.notes || ''),
    administrativeNotes: String(record.administrativeNotes || record.adminNotes || ''),
    rejectionReason: record.rejectionReason ? String(record.rejectionReason) : reg?.rejectionReason,
    refundReason: record.refundReason ? String(record.refundReason) : undefined,
    voidReason: record.voidReason ? String(record.voidReason) : undefined,
    informationRequest: record.informationRequest ? String(record.informationRequest) : undefined,
    informationDueDate: record.informationDueDate ? String(record.informationDueDate) : undefined,
    createdAt: String(record.createdAt || record.submittedDate || today()),
    updatedAt: String(record.updatedAt || today()),
    createdBy: String(record.createdBy || 'system'),
    updatedBy: String(record.updatedBy || 'system')
  };
  return recalcPaymentAmounts(payment);
};

const makePaymentNumber = (count: number) => `PAY-${String(count + 1).padStart(6, '0')}`;

const makeProjectedRegistrationPayment = (registration: RegistrationLike, index: number): Payment => {
  const planObj = mockPlanService.listPlans().find(plan =>
    plan.id === registration.plan || plan.name === registration.plan || plan.planCode === registration.plan
  );
  const amount = planObj ? planObj.monthlyPrice : 10000;
  const status: PaymentStatus = registration.paymentStatus === 'unpaid' ? 'submitted' : 'pending_verification';
  const paymentDate = registration.updatedDate || registration.submittedDate || today();

  return recalcPaymentAmounts({
    id: `PAY-PENDING-${registration.id}`,
    paymentNumber: `PAY-PENDING-${String(index + 1).padStart(4, '0')}`,
    registrationId: registration.id,
    subscriberId: registration.subscriberId || undefined,
    subscriptionId: undefined,
    planId: planObj?.id || registration.plan,
    payerName: registration.ownerName || registration.clinicName || 'Clinic Owner',
    payerEmail: registration.ownerEmail || '',
    amount,
    allocatedAmount: 0,
    unallocatedAmount: amount,
    refundedAmount: 0,
    currency: 'PHP',
    paymentMethod: normalizeMethod(String(registration.paymentMethod || 'demo_payment')),
    referenceNumber: String(registration.referenceNumber || `REG-${registration.id}`),
    paymentDate,
    submittedAt: registration.submittedDate || today(),
    status,
    verificationStatus: registration.paymentStatus === 'unpaid' ? 'not_required' : 'pending',
    allocationStatus: 'unallocated',
    proofOfPayment: registration.paymentStatus === 'pending_verification'
      ? { fileName: 'registration-proof.txt', fileType: 'text/plain', previewLabel: 'Pending registration payment proof' }
      : undefined,
    notes: `Projected registration payment for ${registration.clinicName}.`,
    administrativeNotes: '',
    createdAt: registration.submittedDate || today(),
    updatedAt: registration.updatedDate || registration.submittedDate || today(),
    createdBy: 'system_projection',
    updatedBy: 'system_projection'
  });
};

const withProjectedRegistrationPayments = (persisted: Payment[]) => {
  const persistedRegistrationIds = new Set(
    persisted.map(item => item.registrationId).filter(Boolean) as string[]
  );
  const deletedKeys = new Set(getDeletedPaymentKeys());
  const projected = readRegistrations()
    .filter(registration =>
      ['unpaid', 'pending_verification'].includes(registration.paymentStatus) &&
      !persistedRegistrationIds.has(registration.id) &&
      !deletedKeys.has(`pay-pending-${registration.id}`.toLowerCase()) &&
      !deletedKeys.has(String(registration.referenceNumber || '').toLowerCase())
    )
    .map(makeProjectedRegistrationPayment);

  return [...projected, ...persisted];
};

const normalizeAll = () => {
  const raw = readPaymentsRaw().filter(pay => !String(pay.id || '').startsWith('PAY-MOCK-') && pay.id !== 'PAY-000101');
  const normalized = raw.map(normalizePayment).filter(Boolean) as Payment[];
  writePayments(normalized);
  return withProjectedRegistrationPayments(normalized);
};

export const mockPaymentService = {
  initializePayments: () => {
    normalizeAll();
    mockPaymentService.reconcileAllPayments();
    return mockPaymentService.listPayments();
  },

  listPayments: () => normalizeAll(),
  getPaymentById: (id: string) => mockPaymentService.listPayments().find(item => item.id === id || item.paymentNumber === id) || null,
  getPaymentsBySubscriberId: (subscriberId: string) => mockPaymentService.listPayments().filter(item => item.subscriberId === subscriberId),
  getPaymentsBySubscriptionId: (subscriptionId: string) => mockPaymentService.listPayments().filter(item => item.subscriptionId === subscriptionId || readAllocations().some(allocation => allocation.paymentId === item.id && allocation.subscriptionId === subscriptionId && !allocation.reversedAt)),
  getPaymentsByRegistrationId: (registrationId: string) => mockPaymentService.listPayments().filter(item => item.registrationId === registrationId),
  getPaymentHistory: (paymentId: string) => readHistory().filter(item => item.paymentId === paymentId),
  getPaymentAllocations: (paymentId: string) => readAllocations().filter(item => item.paymentId === paymentId),
  getPaymentRefunds: (paymentId: string) => readRefunds().filter(item => item.paymentId === paymentId),

  validateReferenceNumber: (method: string, referenceNumber: string, currentPaymentId?: string) => validateReferenceNumber(mockPaymentService.listPayments(), method, referenceNumber, currentPaymentId),
  validatePaymentTransition,

  createPayment: (data: PaymentFormData, draft = false): PaymentResult<Payment> => {
    const payments = mockPaymentService.listPayments();
    const validation = validatePaymentForm(data, payments);
    if (!validation.valid) return { ok: false, error: validation.message };
    const registration = registrationFor(data.registrationId);
    const subscriber = subscriberFor(data.subscriberId) || subscriberFor(registration?.subscriberId);
    const subscription = subscriptionFor(data.subscriptionId) || subscriptionFor(subscriber?.subscriptionId);
    const payment: Payment = {
      id: makeId('PAY'),
      paymentNumber: makePaymentNumber(payments.length),
      registrationId: data.registrationId || undefined,
      subscriberId: subscriber?.id || data.subscriberId || undefined,
      subscriptionId: subscription?.id || data.subscriptionId || undefined,
      planId: data.planId || subscription?.priceSnapshot.planId || undefined,
      payerName: data.payerName,
      payerEmail: data.payerEmail,
      amount: data.amount,
      allocatedAmount: 0,
      unallocatedAmount: data.amount,
      refundedAmount: 0,
      currency: 'PHP',
      paymentMethod: data.paymentMethod,
      referenceNumber: data.referenceNumber,
      paymentDate: data.paymentDate,
      submittedAt: draft ? undefined : today(),
      status: draft ? 'draft' : 'pending_verification',
      verificationStatus: draft ? 'not_required' : 'pending',
      allocationStatus: 'unallocated',
      proofOfPayment: data.proofFileName ? { fileName: data.proofFileName, fileType: data.proofFileType || 'unknown', previewLabel: 'Mock proof placeholder' } : undefined,
      notes: data.notes,
      administrativeNotes: data.administrativeNotes,
      createdAt: today(),
      updatedAt: today(),
      createdBy: 'platform_owner',
      updatedBy: 'platform_owner'
    };
    writePayments([payment, ...payments]);
    addHistory(payment.id, draft ? 'Created Draft' : 'Submitted', `${payment.paymentNumber} was ${draft ? 'saved as draft' : 'submitted for verification'}.`, undefined, payment.status);
    if (!draft && data.allocationMode !== 'unallocated' && data.allocationAmount > 0) {
      mockPaymentService.approvePayment(payment.id);
      return mockPaymentService.allocatePayment(payment.id, { allocationType: data.allocationMode, amount: data.allocationAmount, registrationId: payment.registrationId, subscriberId: payment.subscriberId, subscriptionId: payment.subscriptionId, description: 'Initial allocation from record payment form.' });
    }
    return { ok: true, data: payment };
  },

  submitRegistrationPayment: (registrationId: string, method: string, referenceNumber: string): PaymentResult<Payment> => {
    const registration = registrationFor(registrationId);
    if (!registration) return { ok: false, error: 'Registration not found.' };
    const planObj = mockPlanService.listPlans().find(p => p.id === registration.plan || p.name === registration.plan || p.planCode === registration.plan);
    const amount = planObj ? planObj.monthlyPrice : 10000;
    const existing = mockPaymentService.getPaymentsByRegistrationId(registrationId).find(payment => payment.referenceNumber === referenceNumber && payment.paymentMethod === normalizeMethod(method));
    if (existing) return { ok: true, data: existing };
    const result = mockPaymentService.createPayment({
      ownerType: 'registration',
      registrationId,
      subscriberId: '',
      subscriptionId: '',
      planId: planObj?.id || mockPlanService.getPlanByCode(registration.plan)?.id || '',
      payerName: registration.ownerName,
      payerEmail: registration.ownerEmail,
      amount,
      paymentMethod: normalizeMethod(method),
      referenceNumber,
      paymentDate: today(),
      notes: `Submitted registration for ${registration.clinicName} (${registration.plan || 'Plus'} Plan).`,
      administrativeNotes: '',
      proofFileName: 'registration-proof.txt',
      proofFileType: 'text/plain',
      allocationMode: 'unallocated',
      allocationAmount: 0
    });
    if (result.ok) {
      const records = readRegistrations();
      writeRegistrations(records.map(item => item.id === registrationId ? { ...item, paymentStatus: 'pending_verification', registrationStatus: 'payment_under_review', referenceNumber, paymentMethod: method, updatedDate: today() } : item));
    }
    return result;
  },

  updatePayment: (paymentId: string, data: Partial<PaymentFormData>): PaymentResult<Payment> => {
    const payments = mockPaymentService.listPayments();
    const target = payments.find(item => item.id === paymentId);
    if (!target) return { ok: false, error: 'Payment not found.' };
    if (data.referenceNumber || data.paymentMethod) {
      const reference = validateReferenceNumber(payments, data.paymentMethod || target.paymentMethod, data.referenceNumber || target.referenceNumber, target.id);
      if (!reference.valid) return { ok: false, error: reference.message };
    }
    const approved = ['approved', 'partially_allocated', 'fully_allocated', 'partially_refunded', 'refunded'].includes(target.status);
    const updated: Payment = {
      ...target,
      paymentMethod: approved ? target.paymentMethod : data.paymentMethod || target.paymentMethod,
      referenceNumber: approved ? target.referenceNumber : data.referenceNumber ?? target.referenceNumber,
      paymentDate: approved ? target.paymentDate : data.paymentDate || target.paymentDate,
      payerName: approved ? target.payerName : data.payerName || target.payerName,
      payerEmail: approved ? target.payerEmail : data.payerEmail || target.payerEmail,
      notes: data.notes ?? target.notes,
      administrativeNotes: data.administrativeNotes ?? target.administrativeNotes,
      proofOfPayment: data.proofFileName ? { fileName: data.proofFileName, fileType: data.proofFileType || 'unknown', previewLabel: 'Mock proof placeholder' } : target.proofOfPayment,
      updatedAt: today(),
      updatedBy: 'platform_owner'
    };
    writePayments(payments.map(item => item.id === target.id ? updated : item));
    addHistory(updated.id, 'Updated', `${updated.paymentNumber} safe fields were updated.`, target.status, updated.status);
    return { ok: true, data: updated };
  },

  submitPayment: (paymentId: string) => mockPaymentService.setStatus(paymentId, 'pending_verification', 'Submitted', { verificationStatus: 'pending', submittedAt: today() }),
  approvePayment: (paymentId: string): PaymentResult<Payment> => {
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { ok: false, error: 'Payment not found.' };
    if (payment.verificationStatus === 'verified') {
      ensureApprovedRegistrationProvisioning(payment.registrationId);
      return { ok: true, data: payment };
    }
    if (!['pending_verification', 'submitted'].includes(payment.status) && payment.verificationStatus !== 'additional_information_required') return { ok: false, error: 'Only pending payments can be approved.' };
    const result = mockPaymentService.setStatus(payment.id, payment.allocatedAmount > 0 ? paymentStatusAfterAllocation({ ...payment, verificationStatus: 'verified' }) : 'approved', 'Approved', { verificationStatus: 'verified', verifiedAt: today() });
    if (result.ok && result.data) {
      updateRegistrationPayment(result.data, { paymentStatus: 'approved', registrationStatus: 'account_ready' });
      ensureApprovedRegistrationProvisioning(result.data.registrationId);
      if (result.data.subscriptionId) updateSubscriptionPaymentStatus(result.data.subscriptionId);
    }
    return result;
  },
  approveRegistrationPayment: (registrationId: string) => {
    const registrationPayments = mockPaymentService.getPaymentsByRegistrationId(registrationId);
    let payment = registrationPayments.find(item => !item.id.startsWith('PAY-PENDING-') && item.verificationStatus !== 'verified')
      || registrationPayments.find(item => !item.id.startsWith('PAY-PENDING-'));
    if (!payment) {
      const reg = registrationFor(registrationId);
      if (reg) {
        const planObj = mockPlanService.listPlans().find(p => p.id === reg.plan || p.name === reg.plan || p.planCode === reg.plan);
        const amount = planObj ? planObj.monthlyPrice : 10000;
        const createRes = mockPaymentService.createPayment({
          ownerType: 'registration',
          registrationId,
          subscriberId: reg.subscriberId || '',
          subscriptionId: '',
          planId: reg.plan,
          payerName: reg.ownerName,
          payerEmail: reg.ownerEmail,
          amount,
          paymentMethod: 'gcash',
          referenceNumber: (reg as any).referenceNumber || `REG-PAY-${Date.now().toString().slice(-6)}`,
          paymentDate: today(),
          notes: '',
          administrativeNotes: '',
          proofFileName: '',
          proofFileType: '',
          allocationMode: 'unallocated',
          allocationAmount: 0
        });
        if (createRes.ok && createRes.data) {
          payment = createRes.data;
        }
      }
    }
    return payment ? mockPaymentService.approvePayment(payment.id) : { ok: false, error: 'Payment not found.' };
  },
  rejectPayment: (paymentId: string, reason: string, note = ''): PaymentResult<Payment> => {
    if (!reason.trim()) return { ok: false, error: 'Rejection reason is required.' };
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { ok: false, error: 'Payment not found.' };
    if (payment.allocatedAmount > 0) return { ok: false, error: 'Reverse allocations before rejecting this payment.' };
    const result = mockPaymentService.setStatus(payment.id, 'rejected', 'Rejected', { verificationStatus: 'rejected', rejectedAt: today(), rejectionReason: reason, administrativeNotes: note || payment.administrativeNotes });
    if (result.ok && result.data) updateRegistrationPayment(result.data, { paymentStatus: 'rejected', registrationStatus: 'payment_pending', rejectionReason: reason });
    return result;
  },
  rejectRegistrationPayment: (registrationId: string, reason: string) => {
    const payment = mockPaymentService.getPaymentsByRegistrationId(registrationId)[0];
    return payment ? mockPaymentService.rejectPayment(payment.id, reason) : { ok: false, error: 'Payment not found.' };
  },
  requestPaymentInformation: (paymentId: string, message: string, dueDate = '', note = ''): PaymentResult<Payment> => {
    if (!message.trim()) return { ok: false, error: 'Information request message is required.' };
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { ok: false, error: 'Payment not found.' };
    const result = mockPaymentService.setStatus(payment.id, 'pending_verification', 'Information Requested', { verificationStatus: 'additional_information_required', informationRequest: message, informationDueDate: dueDate, administrativeNotes: note || payment.administrativeNotes });
    if (result.ok && result.data) updateRegistrationPayment(result.data, { registrationStatus: 'payment_under_review' });
    return result;
  },

  setStatus: (paymentId: string, nextStatus: PaymentStatus, action: string, patch: Partial<Payment> = {}): PaymentResult<Payment> => {
    const payments = mockPaymentService.listPayments();
    const target = payments.find(item => item.id === paymentId);
    if (!target) return { ok: false, error: 'Payment not found.' };
    const transition = nextStatus === target.status ? { valid: true } : validatePaymentTransition(target.status, nextStatus);
    if (!transition.valid) return { ok: false, error: transition.message };
    const updated = recalcPaymentAmounts({ ...target, ...patch, status: nextStatus, updatedAt: today(), updatedBy: 'platform_owner' });
    writePayments(payments.map(item => item.id === target.id ? updated : item));
    addHistory(updated.id, action, `${updated.paymentNumber} ${action.toLowerCase()}.`, target.status, updated.status);
    return { ok: true, data: updated };
  },

  allocatePayment: (paymentId: string, data: { allocationType: AllocationType; amount: number; registrationId?: string; subscriberId?: string; subscriptionId?: string; description: string }): PaymentResult<Payment> => {
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { ok: false, error: 'Payment not found.' };
    if (payment.verificationStatus !== 'verified') return { ok: false, error: 'Only approved or verified payments can be allocated.' };
    if (payment.status === 'rejected' || payment.status === 'voided' || payment.status === 'refunded') return { ok: false, error: 'This payment cannot be allocated.' };
    if (!Number.isFinite(data.amount) || data.amount <= 0) return { ok: false, error: 'Allocation amount must be greater than zero.' };
    if (data.amount > payment.unallocatedAmount) return { ok: false, error: 'Allocation cannot exceed the unallocated payment balance.' };
    if (!data.registrationId && !data.subscriptionId && !data.subscriberId) return { ok: false, error: 'Choose a valid allocation target.' };
    const allocation: PaymentAllocation = { id: makeId('PAL'), paymentId, allocationType: data.allocationType, amount: data.amount, registrationId: data.registrationId, subscriberId: data.subscriberId || payment.subscriberId, subscriptionId: data.subscriptionId || payment.subscriptionId, description: data.description, createdAt: today(), createdBy: 'platform_owner' };
    writeAllocations([allocation, ...readAllocations()]);
    const updated = recalcPaymentAmounts(payment);
    writePayments(mockPaymentService.listPayments().map(item => item.id === payment.id ? updated : item));
    if (allocation.subscriptionId) updateSubscriptionPaymentStatus(allocation.subscriptionId);
    addHistory(payment.id, payment.allocatedAmount > 0 ? 'Additional Allocation' : 'Allocated', `${payment.paymentNumber} allocated PHP ${data.amount.toLocaleString()}.`, payment.status, updated.status);
    return { ok: true, data: updated };
  },

  reverseAllocation: (allocationId: string, reason: string): PaymentResult<Payment> => {
    if (!reason.trim()) return { ok: false, error: 'Reversal reason is required.' };
    const allocations = readAllocations();
    const allocation = allocations.find(item => item.id === allocationId);
    if (!allocation) return { ok: false, error: 'Allocation not found.' };
    if (allocation.reversedAt) return { ok: false, error: 'Allocation is already reversed.' };
    writeAllocations(allocations.map(item => item.id === allocationId ? { ...item, reversedAt: today(), reversalReason: reason } : item));
    const payment = mockPaymentService.getPaymentById(allocation.paymentId)!;
    const updated = recalcPaymentAmounts(payment);
    writePayments(mockPaymentService.listPayments().map(item => item.id === updated.id ? updated : item));
    if (allocation.subscriptionId) updateSubscriptionPaymentStatus(allocation.subscriptionId);
    addHistory(updated.id, 'Allocation Reversed', `Allocation ${allocation.id} reversed. Reason: ${reason}`, payment.status, updated.status);
    return { ok: true, data: updated };
  },

  refundPayment: (paymentId: string, amount: number, reason: string, refundDate = today(), note = ''): PaymentResult<Payment> => {
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { ok: false, error: 'Payment not found.' };
    if (!['approved', 'partially_allocated', 'fully_allocated', 'partially_refunded'].includes(payment.status)) return { ok: false, error: 'Only approved payments can be refunded.' };
    const refundable = payment.amount - payment.refundedAmount;
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Refund amount must be greater than zero.' };
    if (amount > refundable) return { ok: false, error: 'Refund cannot exceed the refundable balance.' };
    const refund: PaymentRefund = { id: makeId('REF'), paymentId, amount, reason, refundDate, administrativeNote: note, createdAt: today(), createdBy: 'platform_owner' };
    writeRefunds([refund, ...readRefunds()]);
    const nextRefunded = payment.refundedAmount + amount;
    const nextStatus: PaymentStatus = nextRefunded >= payment.amount ? 'refunded' : 'partially_refunded';
    const updated = { ...payment, refundedAmount: nextRefunded, refundedAt: refundDate, refundReason: reason, status: nextStatus, updatedAt: today(), updatedBy: 'platform_owner' };
    writePayments(mockPaymentService.listPayments().map(item => item.id === payment.id ? updated : item));
    if (payment.subscriptionId) updateSubscriptionPaymentStatus(payment.subscriptionId);
    addHistory(payment.id, nextStatus === 'refunded' ? 'Full Refund' : 'Partial Refund', `${payment.paymentNumber} refunded PHP ${amount.toLocaleString()}.`, payment.status, updated.status);
    return { ok: true, data: updated };
  },

  voidPayment: (paymentId: string, reason: string): PaymentResult<Payment> => {
    if (!reason.trim()) return { ok: false, error: 'Void reason is required.' };
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { ok: false, error: 'Payment not found.' };
    if (payment.allocatedAmount > 0) return { ok: false, error: 'Reverse active allocations before voiding this payment.' };
    if (payment.status === 'refunded') return { ok: false, error: 'Fully refunded payments cannot be voided.' };
    return mockPaymentService.setStatus(payment.id, 'voided', 'Voided', { voidReason: reason, voidedAt: today(), allocationStatus: 'unallocated' });
  },

  permanentlyDeletePayment: (paymentId: string): PaymentResult<Payment> => {
    const payments = mockPaymentService.listPayments();
    const target = payments.find(p => p.id === paymentId);
    if (!target) return { ok: false, error: 'Payment not found.' };

    // 1. Blacklist
    const deleted = safeRead<string[]>(DELETED_PAYMENTS_KEY, []);
    safeWrite(DELETED_PAYMENTS_KEY, Array.from(new Set([...deleted, target.id.toLowerCase(), target.paymentNumber.toLowerCase(), target.referenceNumber.toLowerCase()])));

    // 2. Remove from storage
    const raw = safeRead<Array<Partial<Payment> & Record<string, unknown>>>(PAYMENTS_KEY, []);
    writePayments(raw.filter(p => p.id !== paymentId && p.paymentNumber !== target.paymentNumber) as Payment[]);

    // 3. Remove allocations
    const allocations = readAllocations();
    writeAllocations(allocations.filter(a => a.paymentId !== paymentId));

    // 4. Cascade delete linked subscriber, subscription, clinic, registration, and auth user
    //    so deleting from Payments & Receipts also removes the Clinic Owner, Active Subscription,
    //    Dental Clinic, and Registration permanently.
    const linkedSubscriber = target.subscriberId
      ? subscriberFor(target.subscriberId)
      : target.registrationId
        ? readSubscribers().find(item => item.registrationId === target.registrationId)
        : readSubscribers().find(item => item.email.toLowerCase() === String(target.payerEmail || '').toLowerCase());

    if (linkedSubscriber) {
      mockPlatformManagementService.deleteSubscriber(linkedSubscriber.id);
    } else if (target.registrationId) {
      // No subscriber was provisioned yet; remove the registration and any auth user directly.
      const registrations = readRegistrations();
      writeRegistrations(registrations.filter(item => item.id !== target.registrationId));
      const authUsers = safeRead<Array<Record<string, unknown>>>('pnj_mock_users', []);
      safeWrite('pnj_mock_users', authUsers.filter(u => String(u.email || '').toLowerCase() !== String(target.payerEmail || '').toLowerCase()));
    }

    addHistory(paymentId, 'Permanently Deleted', `${target.paymentNumber} (${target.referenceNumber}) was permanently purged with all linked subscriber, subscription, clinic, and registration records.`);
    return { ok: true, data: target };
  },
  restoreVoidedPayment: (paymentId: string): PaymentResult<Payment> => {
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { ok: false, error: 'Payment not found.' };
    if (payment.status !== 'voided') return { ok: false, error: 'Only voided payments can be restored.' };
    const reference = validateReferenceNumber(mockPaymentService.listPayments(), payment.paymentMethod, payment.referenceNumber, payment.id);
    if (!reference.valid) return { ok: false, error: reference.message };
    if (payment.registrationId && !registrationFor(payment.registrationId)) return { ok: false, error: 'Related registration no longer exists.' };
    if (payment.subscriberId && !subscriberFor(payment.subscriberId)) return { ok: false, error: 'Related subscriber no longer exists.' };
    const transition = validatePaymentTransition(payment.status, 'pending_verification');
    if (!transition.valid) return { ok: false, error: transition.message };
    const updated = recalcPaymentAmounts({
      ...payment,
      status: 'pending_verification',
      verificationStatus: 'pending',
      voidedAt: undefined,
      voidReason: undefined,
      updatedAt: today(),
      updatedBy: 'platform_owner'
    });
    writePayments(mockPaymentService.listPayments().map(item => item.id === payment.id ? updated : item));
    if (updated.subscriptionId) updateSubscriptionPaymentStatus(updated.subscriptionId);
    addHistory(updated.id, 'Restored', `${updated.paymentNumber} restored for verification.`, payment.status, updated.status);
    return { ok: true, data: updated };
  },

  calculatePaymentTotals: (paymentId: string) => {
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { amount: 0, allocatedAmount: 0, unallocatedAmount: 0, refundedAmount: 0, refundableAmount: 0 };
    return { amount: payment.amount, allocatedAmount: payment.allocatedAmount, unallocatedAmount: payment.unallocatedAmount, refundedAmount: payment.refundedAmount, refundableAmount: Math.max(0, payment.amount - payment.refundedAmount) };
  },
  calculateSubscriberPaymentSummary: (subscriberId: string) => {
    const payments = mockPaymentService.getPaymentsBySubscriberId(subscriberId);
    return {
      totalPaid: payments.filter(item => ['approved', 'partially_allocated', 'fully_allocated', 'partially_refunded', 'refunded'].includes(item.status)).reduce((sum, item) => sum + item.amount, 0),
      pendingAmount: payments.filter(item => item.verificationStatus === 'pending').reduce((sum, item) => sum + item.amount, 0),
      refundedAmount: payments.reduce((sum, item) => sum + item.refundedAmount, 0),
      paymentCount: payments.length,
      latestPayment: payments[0] || null,
      distribution: payments.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.status]: (acc[item.status] || 0) + 1 }), {})
    };
  },
  calculateSubscriptionPaymentSummary: (subscriptionId: string) => {
    const subscription = mockSubscriptionService.getSubscriptionById(subscriptionId);
    const expectedAmount = subscription?.priceSnapshot.appliedAmount || 0;
    const allocations = readAllocations().filter(item => item.subscriptionId === subscriptionId && !item.reversedAt);
    const allocatedAmount = allocations.reduce((sum, item) => sum + item.amount, 0);
    const refunds = allocations.reduce((sum, allocation) => {
      const payment = mockPaymentService.getPaymentById(allocation.paymentId);
      return sum + (payment?.refundedAmount || 0);
    }, 0);
    return { expectedAmount, allocatedAmount, refundedAmount: refunds, outstandingAmount: Math.max(0, expectedAmount - allocatedAmount), paymentStatus: expectedAmount <= allocatedAmount ? 'paid' : allocatedAmount > 0 ? 'partially_paid' : 'unpaid', allocations };
  },
  reconcilePayment: (paymentId: string): ReconciliationResult => {
    const payment = mockPaymentService.getPaymentById(paymentId);
    if (!payment) return { status: 'missing_target', warnings: ['Payment not found.'], expectedAmount: 0, allocatedAmount: 0, refundableAmount: 0 };
    const warnings: string[] = [];
    if (payment.allocatedAmount > payment.amount) warnings.push('Allocated amount exceeds payment amount.');
    if ((payment.registrationId && !registrationFor(payment.registrationId)) || (payment.subscriptionId && !subscriptionFor(payment.subscriptionId))) warnings.push('Related target could not be resolved.');
    const status = payment.status === 'refunded'
      ? 'refunded'
      : payment.allocatedAmount > payment.amount
        ? 'overallocated_error'
        : warnings.length
          ? 'allocation_mismatch'
          : payment.allocatedAmount === payment.amount
            ? 'fully_allocated'
            : payment.allocatedAmount > 0
              ? 'underallocated'
              : 'balanced';
    return { status, warnings, expectedAmount: payment.amount, allocatedAmount: payment.allocatedAmount, refundableAmount: Math.max(0, payment.amount - payment.refundedAmount) };
  },
  reconcileAllPayments: () => mockPaymentService.listPayments().map(payment => mockPaymentService.reconcilePayment(payment.id)),

  searchPayments: (payments: Payment[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return payments;
    return payments.filter(payment => [payment.paymentNumber, payment.referenceNumber, payment.payerName, payment.payerEmail, payment.status, payment.paymentMethod].some(value => String(value || '').toLowerCase().includes(term)));
  },
  filterPayments: (payments: Payment[], filters: PaymentFilters) => {
    let next = mockPaymentService.searchPayments(payments, filters.search);
    if (filters.tab !== 'all') {
      if (filters.tab === 'pending_verification') {
        next = next.filter(payment => payment.status === 'pending_verification' || payment.status === 'submitted' || payment.verificationStatus === 'pending');
      } else {
        next = next.filter(payment => payment.status === filters.tab);
      }
    }
    if (filters.subscriberId !== 'all') next = next.filter(payment => payment.subscriberId === filters.subscriberId);
    if (filters.registrationId !== 'all') next = next.filter(payment => payment.registrationId === filters.registrationId);
    if (filters.subscriptionId !== 'all') next = next.filter(payment => payment.subscriptionId === filters.subscriptionId);
    if (filters.planId !== 'all') next = next.filter(payment => payment.planId === filters.planId);
    if (filters.paymentMethod !== 'all') next = next.filter(payment => payment.paymentMethod === filters.paymentMethod);
    if (filters.status !== 'all') next = next.filter(payment => payment.status === filters.status);
    if (filters.verificationStatus !== 'all') next = next.filter(payment => payment.verificationStatus === filters.verificationStatus);
    if (filters.allocationStatus !== 'all') next = next.filter(payment => payment.allocationStatus === filters.allocationStatus);
    if (filters.paymentDate) next = next.filter(payment => payment.paymentDate === filters.paymentDate);
    if (filters.submittedDate) next = next.filter(payment => payment.submittedAt === filters.submittedDate);
    if (filters.minAmount) next = next.filter(payment => payment.amount >= Number(filters.minAmount));
    if (filters.maxAmount) next = next.filter(payment => payment.amount <= Number(filters.maxAmount));
    return next;
  },
  sortPayments: (payments: Payment[], sort: PaymentSort) => [...payments].sort((a, b) => String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? '')) * (sort.direction === 'asc' ? 1 : -1)),
  paginatePayments: (payments: Payment[], page: number, pageSize: number) => payments.slice((page - 1) * pageSize, page * pageSize),
  getPaymentSummary: () => {
    const payments = mockPaymentService.listPayments();
    return {
      total: payments.length,
      pendingVerification: payments.filter(item => item.status === 'pending_verification' || item.status === 'submitted' || item.verificationStatus === 'pending').length,
      approved: payments.filter(item => item.status === 'approved').length,
      partiallyAllocated: payments.filter(item => item.status === 'partially_allocated').length,
      fullyAllocated: payments.filter(item => item.status === 'fully_allocated').length,
      rejected: payments.filter(item => item.status === 'rejected' || item.verificationStatus === 'rejected').length,
      refunded: payments.filter(item => item.status === 'refunded' || item.status === 'partially_refunded').length,
      voided: payments.filter(item => item.status === 'voided').length,
      collectedAmount: payments.filter(item => ['approved', 'partially_allocated', 'fully_allocated', 'partially_refunded', 'refunded'].includes(item.status)).reduce((sum, item) => sum + item.amount - item.refundedAmount, 0),
      refundedAmount: payments.reduce((sum, item) => sum + item.refundedAmount, 0)
    };
  },
  toFormData: (payment?: Payment): PaymentFormData => ({
    ownerType: payment?.registrationId ? 'registration' : 'subscriber',
    registrationId: payment?.registrationId || '',
    subscriberId: payment?.subscriberId || '',
    subscriptionId: payment?.subscriptionId || '',
    planId: payment?.planId || '',
    payerName: payment?.payerName || '',
    payerEmail: payment?.payerEmail || '',
    amount: payment?.amount || 0,
    paymentMethod: payment?.paymentMethod || 'demo_payment',
    referenceNumber: payment?.referenceNumber || '',
    paymentDate: payment?.paymentDate || today(),
    notes: payment?.notes || '',
    administrativeNotes: payment?.administrativeNotes || '',
    proofFileName: payment?.proofOfPayment?.fileName || '',
    proofFileType: payment?.proofOfPayment?.fileType || '',
    allocationMode: 'unallocated',
    allocationAmount: 0
  })
};
