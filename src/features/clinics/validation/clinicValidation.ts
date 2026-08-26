import type { PlatformUser, Subscriber } from '../../platformManagement/types';
import type { Subscription } from '../../subscriptions/types';
import type { Clinic, ClinicAssignmentRole, ClinicFormData } from '../types';

const emailPattern = /\S+@\S+\.\S+/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;
const countingStatuses = ['draft', 'pending', 'active', 'inactive'];
const operationalSubscriptions = ['active', 'expiring_soon'];

const minutes = (value: string) => {
  const [hours, mins] = value.split(':').map(Number);
  return hours * 60 + mins;
};

export const clinicUsageCountingStatuses = countingStatuses;

export function validateBusinessHours(data: ClinicFormData['businessHours']) {
  for (const [day, hours] of Object.entries(data)) {
    if (!hours.enabled) continue;
    if (!hours.openingTime || !hours.closingTime) return { valid: false, message: `${day} needs opening and closing times.` };
    if (minutes(hours.closingTime) <= minutes(hours.openingTime)) return { valid: false, message: `${day} closing time must be later than opening time.` };
    if (hours.breakEnabled) {
      if (!hours.breakStart || !hours.breakEnd) return { valid: false, message: `${day} needs break start and end times.` };
      if (minutes(hours.breakEnd) <= minutes(hours.breakStart)) return { valid: false, message: `${day} break end must be later than break start.` };
      if (minutes(hours.breakStart) <= minutes(hours.openingTime) || minutes(hours.breakEnd) >= minutes(hours.closingTime)) return { valid: false, message: `${day} break time must fall within business hours.` };
    }
  }
  return { valid: true };
}

export function validateClinicOwnership(subscriber: Subscriber | null, subscription: Subscription | null) {
  if (!subscriber) return { valid: false, message: 'Choose a subscriber for this clinic.' };
  if (subscriber.accountStatus !== 'active') return { valid: false, message: 'Only active subscribers can receive new clinics.' };
  if (!subscription || !operationalSubscriptions.includes(subscription.status)) return { valid: false, message: 'Subscriber needs an operational subscription before adding or activating clinics.' };
  return { valid: true };
}

export function validateUserAssignment(user: PlatformUser | null, subscriberId: string, role: ClinicAssignmentRole) {
  if (!user) return { valid: false, message: 'Choose a valid user assignment.' };
  if (user.subscriberId !== subscriberId) return { valid: false, message: 'Assigned users must belong to the same subscriber as the clinic.' };
  if (user.accountStatus !== 'active') return { valid: false, message: 'Only active users can be assigned to clinics.' };
  if (role === 'associate' && user.role !== 'associate') return { valid: false, message: 'Choose an Associate Dentist for dentist assignments.' };
  if (role === 'staff' && user.role !== 'staff') return { valid: false, message: 'Choose a staff user for staff assignments.' };
  if (role === 'clinic_owner' && user.role !== 'clinic_owner') return { valid: false, message: 'Choose a Clinic Owner user as administrator.' };
  return { valid: true };
}

export function validateClinicForm(data: ClinicFormData, clinics: Clinic[], currentClinicId?: string) {
  if (!data.subscriberId) return { valid: false, message: 'Subscriber is required.' };
  if (!data.name.trim()) return { valid: false, message: 'Clinic name is required.' };
  if (!data.email.trim() || !emailPattern.test(data.email)) return { valid: false, message: 'Enter a valid clinic email.' };
  if (!data.contactNumber.trim() || !phonePattern.test(data.contactNumber)) return { valid: false, message: 'Enter a valid contact number.' };
  if (!data.addressLine1.trim()) return { valid: false, message: 'Address line 1 is required.' };
  if (!data.city.trim()) return { valid: false, message: 'City is required.' };
  if (!data.province.trim()) return { valid: false, message: 'Province is required.' };
  const hours = validateBusinessHours(data.businessHours);
  if (!hours.valid) return hours;
  const normalizedName = data.name.trim().toLowerCase();
  const duplicate = clinics.find(clinic =>
    clinic.id !== currentClinicId &&
    clinic.subscriberId === data.subscriberId &&
    clinic.status !== 'archived' &&
    (clinic.name.trim().toLowerCase() === normalizedName ||
      (clinic.email && clinic.email.trim().toLowerCase() === data.email.trim().toLowerCase()) ||
      (clinic.addressLine1.trim().toLowerCase() === data.addressLine1.trim().toLowerCase() && clinic.city.trim().toLowerCase() === data.city.trim().toLowerCase()))
  );
  if (duplicate) return { valid: false, message: `This looks like a duplicate of ${duplicate.clinicNumber}.` };
  return { valid: true };
}

export function validateActivationReadiness(clinic: Clinic) {
  if (clinic.status === 'archived') return { valid: false, message: 'Archived clinics must be restored before activation.' };
  return validateClinicForm({
    subscriberId: clinic.subscriberId,
    primaryOwnerUserId: clinic.primaryOwnerUserId || '',
    branchType: clinic.branchType || 'main',
    isPrimaryClinic: clinic.isPrimaryClinic,
    name: clinic.name,
    legalBusinessName: clinic.legalBusinessName,
    email: clinic.email,
    contactNumber: clinic.contactNumber,
    alternativeContactNumber: clinic.alternativeContactNumber || '',
    addressLine1: clinic.addressLine1,
    addressLine2: clinic.addressLine2 || '',
    barangay: clinic.barangay || '',
    city: clinic.city,
    province: clinic.province,
    postalCode: clinic.postalCode || '',
    country: clinic.country,
    timezone: clinic.timezone,
    description: clinic.description || '',
    logoFileName: clinic.logoMetadata?.fileName || '',
    logoFileType: clinic.logoMetadata?.fileType || '',
    visibility: clinic.visibility,
    businessHours: clinic.businessHours,
    dentistUserIds: clinic.dentistUserIds,
    staffUserIds: clinic.staffUserIds
  }, [clinic], clinic.id);
}
