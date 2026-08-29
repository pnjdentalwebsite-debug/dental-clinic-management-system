import { requireSupabaseClient } from './client';

export interface RegistrationPlanFeature {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
}

export interface RegistrationPlan {
  code: string;
  name: string;
  features: RegistrationPlanFeature[];
  billingCycles: Array<'monthly' | 'annual'>;
  monthlyAmountCentavos: number;
  annualAmountCentavos: number | null;
}

export interface RegistrationPublicStatus {
  registrationNumber: string;
  clinicName: string;
  emailVerified: boolean;
  paymentStatus: string;
  registrationStatus: string;
  plan: { code: string; name: string } | null;
}

export interface SubmitRegistrationInput {
  planCode: string;
  billingCycle: 'monthly' | 'annual';
  clinicName: string;
  clinicEmail: string;
  clinicMobile?: string;
  clinicAddress?: string;
  clinicCity?: string;
  clinicProvince?: string;
  clinicPostalCode?: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile?: string;
  ownerAddress?: string;
  ownerCity?: string;
  ownerProvince?: string;
  ownerPostalCode?: string;
  dentistCount?: number;
  staffCount?: number;
  locationCount?: number;
  worksWithLaboratory: boolean;
  laboratoryName?: string;
}

export interface ProvisionMemberInput {
  subscriberId: string;
  role: 'staff' | 'associate';
  email: string;
  temporaryPassword?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  mobileNumber?: string;
  address?: string;
  position?: string;
  licenseNumber?: string;
  ptrNumber?: string;
  s2LicenseNumber?: string;
  designation?: string;
  specialization?: string;
  calendarColor?: string;
  certificatesAndQualifications?: string;
  authorizedClinicIds: string[];
}

async function invoke<T>(functionName: string, body: object): Promise<T> {
  const client = requireSupabaseClient();
  const { data, error } = await client.functions.invoke<T>(functionName, { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    let message = error.message || `Unable to call ${functionName}.`;
    if (context) {
      const payload = await context.clone().json().catch(() => null) as { error?: unknown } | null;
      if (typeof payload?.error === 'string') message = payload.error;
    }
    throw new Error(message);
  }
  if (data === null) throw new Error(`${functionName} returned no response data.`);
  return data;
}

/** Browser adapter for protected Edge Functions. It contains no privileged key. */
export const onboardingApi = {
  loadRegistrationPlans: () =>
    invoke<{ plans: RegistrationPlan[] }>('registration-plans', {}),
  submitRegistration: (input: SubmitRegistrationInput) =>
    invoke<{ registration: { id: string; registration_number: string; registration_status: string; payment_status: string }; plan: { code: string; name: string; amountCentavos: number } }>(
      'registration-submit', input,
    ),
  requestRegistrationOtp: (registrationId: string, ownerEmail: string) =>
    invoke<{ sent: true; expiresInSeconds: number; resendAfterSeconds: number }>(
      'registration-request-otp', { registrationId, ownerEmail },
    ),
  verifyRegistrationOtp: (registrationId: string, ownerEmail: string, otp: string) =>
    invoke<{ verified: true; emailVerifiedAt: string; registrationStatus: string }>(
      'registration-verify-otp', { registrationId, ownerEmail, otp },
    ),
  submitRegistrationPayment: (registrationId: string, ownerEmail: string, paymentMethod: string, referenceNumber?: string) =>
    invoke<{ payment: { id: string; status: string; amount_centavos: number } }>(
      'registration-submit-payment', { registrationId, ownerEmail, paymentMethod, referenceNumber },
    ),
  checkRegistrationStatus: (registrationId: string, ownerEmail: string) =>
    invoke<RegistrationPublicStatus>('registration-status', { registrationId, ownerEmail }),
  approveRegistration: (registrationId: string) =>
    invoke<{
      account: { email: string; temporaryPassword: string; requiresPasswordChange: true };
      scope: { subscriberId: string; clinicId: string; membershipId: string; subscriberNumber: string; clinicNumber: string };
    }>('platform-approve-registration', { registrationId }),
  completeInitialPassword: (password: string) => invoke<{ ok: true }>('complete-initial-password', { password }),
  provisionMemberAccount: (input: ProvisionMemberInput) =>
    invoke<{
      account: { email: string; temporaryPassword: string; requiresPasswordChange: true };
      membershipId: string;
      personnelNumber: string;
    }>('provision-member-account', input),
};
