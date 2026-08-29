export type BillingCycle = 'monthly' | 'annual';

type PlanRow = {
  plan_code: string;
  name: string;
  monthly_amount_centavos: number;
  annual_amount_centavos: number | null;
};

type PaymentRow = {
  id: string;
  payment_method: string;
  reference_number: string | null;
  amount_centavos: number;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  notes?: string | null;
};

type RegistrationRow = {
  id: string;
  registration_number: string;
  owner_name: string;
  owner_email: string;
  owner_mobile: string | null;
  owner_address?: string | null;
  owner_city?: string | null;
  owner_province?: string | null;
  owner_postal_code?: string | null;
  clinic_name: string;
  clinic_email: string;
  clinic_mobile: string | null;
  clinic_address?: string | null;
  clinic_city?: string | null;
  clinic_province?: string | null;
  clinic_postal_code?: string | null;
  dentist_count?: number | null;
  staff_count?: number | null;
  location_count?: number | null;
  works_with_laboratory?: boolean | null;
  laboratory_name?: string | null;
  registration_status: string;
  payment_status: string;
  email_verified_at: string | null;
  billing_cycle: BillingCycle;
  submitted_at: string;
  created_at: string;
  plans: PlanRow | PlanRow[] | null;
  payments: PaymentRow[] | null;
};

export interface ReviewPaymentDto {
  id: string;
  method: string;
  referenceNumber: string | null;
  amountCentavos: number;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  note?: string | null;
}

export interface ReviewListItemDto {
  registrationId: string;
  registrationNumber: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile: string | null;
  clinicName: string;
  clinicEmail: string;
  clinicMobile: string | null;
  registrationStatus: string;
  paymentStatus: string;
  emailVerifiedAt: string | null;
  billingCycle: BillingCycle;
  submittedAt: string;
  createdAt: string;
  plan: { code: string; name: string; applicableAmountCentavos: number } | null;
  payment: ReviewPaymentDto | null;
}

export interface ReviewDetailDto extends ReviewListItemDto {
  owner: {
    name: string;
    email: string;
    mobile: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
  };
  clinic: {
    name: string;
    email: string;
    mobile: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    postalCode: string | null;
    dentistCount: number | null;
    staffCount: number | null;
    locationCount: number | null;
    worksWithLaboratory: boolean;
    laboratoryName: string | null;
  };
}

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function latestPayment(payments: PaymentRow[] | null | undefined): PaymentRow | null {
  if (!payments || payments.length === 0) return null;
  return [...payments].sort((left, right) => right.submitted_at.localeCompare(left.submitted_at))[0] ?? null;
}

function applicableAmount(plan: PlanRow, billingCycle: BillingCycle): number {
  return billingCycle === 'annual'
    ? (plan.annual_amount_centavos ?? plan.monthly_amount_centavos * 12)
    : plan.monthly_amount_centavos;
}

function paymentDto(payment: PaymentRow | null, includeNote: boolean): ReviewPaymentDto | null {
  if (!payment) return null;
  return {
    id: payment.id,
    method: payment.payment_method,
    referenceNumber: payment.reference_number,
    amountCentavos: payment.amount_centavos,
    status: payment.status,
    submittedAt: payment.submitted_at,
    reviewedAt: payment.reviewed_at,
    ...(includeNote ? { note: payment.notes ?? null } : {}),
  };
}

export function toReviewListItem(row: RegistrationRow): ReviewListItemDto {
  const plan = first(row.plans);
  return {
    registrationId: row.id,
    registrationNumber: row.registration_number,
    ownerName: row.owner_name,
    ownerEmail: row.owner_email,
    ownerMobile: row.owner_mobile ?? null,
    clinicName: row.clinic_name,
    clinicEmail: row.clinic_email,
    clinicMobile: row.clinic_mobile ?? null,
    registrationStatus: row.registration_status,
    paymentStatus: row.payment_status,
    emailVerifiedAt: row.email_verified_at,
    billingCycle: row.billing_cycle,
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
    plan: plan ? {
      code: plan.plan_code,
      name: plan.name,
      applicableAmountCentavos: applicableAmount(plan, row.billing_cycle),
    } : null,
    payment: paymentDto(latestPayment(row.payments), false),
  };
}

export function toReviewDetail(row: RegistrationRow): ReviewDetailDto {
  const base = toReviewListItem(row);
  return {
    ...base,
    payment: paymentDto(latestPayment(row.payments), true),
    owner: {
      name: row.owner_name,
      email: row.owner_email,
      mobile: row.owner_mobile ?? null,
      address: row.owner_address ?? null,
      city: row.owner_city ?? null,
      province: row.owner_province ?? null,
      postalCode: row.owner_postal_code ?? null,
    },
    clinic: {
      name: row.clinic_name,
      email: row.clinic_email,
      mobile: row.clinic_mobile ?? null,
      address: row.clinic_address ?? null,
      city: row.clinic_city ?? null,
      province: row.clinic_province ?? null,
      postalCode: row.clinic_postal_code ?? null,
      dentistCount: row.dentist_count ?? null,
      staffCount: row.staff_count ?? null,
      locationCount: row.location_count ?? null,
      worksWithLaboratory: row.works_with_laboratory === true,
      laboratoryName: row.works_with_laboratory === true ? row.laboratory_name ?? null : null,
    },
  };
}
