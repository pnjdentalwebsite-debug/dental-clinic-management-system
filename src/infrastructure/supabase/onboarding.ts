import { requireSupabaseClient } from './client';

export type RegistrationStatus = 'not_found' | 'payment_pending' | 'payment_under_review' | 'account_ready' | 'rejected';

export interface SubmitRegistrationInput {
  planCode?: string;
  planName?: string;
  billingCycle: 'monthly' | 'annual';
  clinicName: string;
  clinicEmail: string;
  clinicMobile?: string;
  clinicAddress?: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile?: string;
  ownerAddress?: string;
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
  if (error) throw error;
  if (data === null) throw new Error(`${functionName} returned no response data.`);
  return data;
}

/** Browser adapter for protected Edge Functions. It contains no privileged key. */
export const onboardingApi = {
  submitRegistration: (input: SubmitRegistrationInput) =>
    invoke<{ registration: { id: string; registration_number: string }; plan: { code: string; name: string; amountCentavos: number } }>(
      'registration-submit', input,
    ),
  submitRegistrationPayment: (registrationId: string, paymentMethod: string, referenceNumber?: string) =>
    invoke<{ payment: { id: string; status: string; amount_centavos: number } }>(
      'registration-submit-payment', { registrationId, paymentMethod, referenceNumber },
    ),
  checkRegistrationStatus: (ownerEmail: string) =>
    invoke<{ state: RegistrationStatus }>('registration-status', { ownerEmail }),
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
