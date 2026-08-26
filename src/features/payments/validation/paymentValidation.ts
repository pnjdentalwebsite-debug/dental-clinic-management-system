import type { Payment, PaymentFormData, PaymentStatus } from '../types';

const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  draft: ['submitted', 'pending_verification', 'voided'],
  submitted: ['pending_verification', 'voided'],
  pending_verification: ['approved', 'rejected'],
  approved: ['partially_allocated', 'fully_allocated', 'partially_refunded', 'refunded', 'voided'],
  partially_allocated: ['fully_allocated', 'partially_refunded', 'refunded'],
  fully_allocated: ['partially_refunded', 'refunded'],
  rejected: ['pending_verification'],
  partially_refunded: ['refunded'],
  refunded: [],
  voided: ['draft', 'pending_verification']
};

export const paymentMethodsRequiringReference = ['gcash', 'maya', 'bank_transfer', 'over_the_counter', 'card'];

export function validatePaymentTransition(current: PaymentStatus, next: PaymentStatus) {
  if (current === next) return { valid: false, message: `Payment is already ${next.replace('_', ' ')}.` };
  if (!allowedTransitions[current]?.includes(next)) return { valid: false, message: `Cannot move a ${current.replace('_', ' ')} payment to ${next.replace('_', ' ')}.` };
  return { valid: true };
}

export function validateReferenceNumber(payments: Payment[], method: string, referenceNumber: string, currentPaymentId?: string) {
  const normalized = referenceNumber.trim().toLowerCase();
  if (!normalized) return { valid: true };
  const duplicate = payments.find(payment =>
    payment.id !== currentPaymentId &&
    payment.paymentMethod === method &&
    payment.referenceNumber.trim().toLowerCase() === normalized &&
    payment.status !== 'voided'
  );
  return duplicate
    ? { valid: false, message: `Reference number already exists on ${duplicate.paymentNumber}.` }
    : { valid: true };
}

export function validatePaymentForm(data: PaymentFormData, payments: Payment[], currentPaymentId?: string) {
  if (!data.registrationId && !data.subscriberId) return { valid: false, message: 'Choose a registration or subscriber for this payment.' };
  if (!data.payerName.trim()) return { valid: false, message: 'Payer name is required.' };
  if (!data.payerEmail.trim()) return { valid: false, message: 'Payer email is required.' };
  if (!Number.isFinite(data.amount) || data.amount <= 0) return { valid: false, message: 'Payment amount must be greater than zero.' };
  if (!data.paymentMethod) return { valid: false, message: 'Choose a payment method.' };
  if (paymentMethodsRequiringReference.includes(data.paymentMethod) && !data.referenceNumber.trim()) return { valid: false, message: 'Reference number is required for this payment method.' };
  const reference = validateReferenceNumber(payments, data.paymentMethod, data.referenceNumber, currentPaymentId);
  if (!reference.valid) return reference;
  if (data.allocationMode !== 'unallocated' && (!Number.isFinite(data.allocationAmount) || data.allocationAmount <= 0)) return { valid: false, message: 'Allocation amount must be greater than zero.' };
  if (data.allocationAmount > data.amount) return { valid: false, message: 'Allocation cannot exceed the payment amount.' };
  return { valid: true };
}
