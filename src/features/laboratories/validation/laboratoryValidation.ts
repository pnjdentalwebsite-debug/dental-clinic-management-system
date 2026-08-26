import type { Clinic } from '../../clinics/types';
import { validateBusinessHours } from '../../clinics/validation/clinicValidation';
import type { Subscriber } from '../../platformManagement/types';
import type { Subscription } from '../../subscriptions/types';
import type { ClinicLaboratoryConnection, Laboratory, LaboratoryFormData, LaboratoryService } from '../types';

const emailPattern = /\S+@\S+\.\S+/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;
const operationalSubscriptions = ['active', 'expiring_soon'];
export const laboratoryUsageCountingStatuses = ['draft', 'pending', 'active', 'inactive'];

const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const digits = (value: string) => value.replace(/\D/g, '');

export function validateLaboratoryOwnership(subscriber: Subscriber | null, subscription: Subscription | null) {
  if (!subscriber) return { valid: false, message: 'Choose a subscriber for this laboratory.' };
  if (subscriber.accountStatus !== 'active') return { valid: false, message: 'Only active subscribers can receive new laboratories.' };
  if (!subscription || !operationalSubscriptions.includes(subscription.status)) return { valid: false, message: 'Subscriber needs an operational subscription before adding or activating laboratories.' };
  return { valid: true };
}

export function detectDuplicateLaboratory(data: Pick<LaboratoryFormData, 'subscriberId' | 'name' | 'email' | 'contactNumber' | 'addressLine1' | 'city'>, laboratories: Laboratory[], currentLaboratoryId?: string) {
  const name = normalize(data.name);
  const email = normalize(data.email);
  const contact = digits(data.contactNumber);
  const address = `${normalize(data.addressLine1)}|${normalize(data.city)}`;
  return laboratories.find(laboratory =>
    laboratory.id !== currentLaboratoryId &&
    laboratory.subscriberId === data.subscriberId &&
    laboratory.status !== 'archived' &&
    (normalize(laboratory.name) === name ||
      (email && normalize(laboratory.email) === email) ||
      (contact && digits(laboratory.contactNumber) === contact) ||
      `${normalize(laboratory.addressLine1)}|${normalize(laboratory.city)}` === address)
  ) || null;
}

export function validateLaboratoryForm(data: LaboratoryFormData, laboratories: Laboratory[], clinics: Clinic[], currentLaboratoryId?: string) {
  if (!data.subscriberId) return { valid: false, message: 'Subscriber is required.' };
  if (!data.name.trim()) return { valid: false, message: 'Laboratory name is required.' };
  if (!data.email.trim() || !emailPattern.test(data.email)) return { valid: false, message: 'Enter a valid laboratory email.' };
  if (!data.contactNumber.trim() || !phonePattern.test(data.contactNumber)) return { valid: false, message: 'Enter a valid laboratory contact number.' };
  if (!data.city.trim()) return { valid: false, message: 'City is required.' };
  if (!data.province.trim()) return { valid: false, message: 'Province is required.' };
  if (data.defaultTurnaroundDays <= 0) return { valid: false, message: 'Default turnaround days must be positive.' };
  if (data.rushTurnaroundDays <= 0) return { valid: false, message: 'Rush turnaround days must be positive.' };
  const hours = validateBusinessHours(data.businessHours);
  if (!hours.valid) return hours;
  const incompatibleClinic = data.initialClinicIds.map(id => clinics.find(clinic => clinic.id === id)).find(clinic => !clinic || clinic.subscriberId !== data.subscriberId || clinic.status === 'archived');
  if (incompatibleClinic !== undefined) return { valid: false, message: 'Initial clinic connections must be active or inactive clinics under the same subscriber.' };
  const duplicate = detectDuplicateLaboratory(data, laboratories, currentLaboratoryId);
  if (duplicate) return { valid: false, message: `This looks like a duplicate of ${duplicate.laboratoryNumber}.` };
  return { valid: true };
}

export function validateActivationReadiness(laboratory: Laboratory) {
  if (laboratory.status === 'archived') return { valid: false, message: 'Archived laboratories must be restored before activation.' };
  if (!laboratory.email && !laboratory.contactNumber) return { valid: false, message: 'At least one laboratory contact method is required.' };
  if (!laboratory.name.trim() || !laboratory.city.trim() || !laboratory.province.trim()) return { valid: false, message: 'Complete required laboratory identity and location fields first.' };
  if (laboratory.defaultTurnaroundDays <= 0) return { valid: false, message: 'Default turnaround days must be positive.' };
  return validateBusinessHours(laboratory.businessHours);
}

export function validateClinicConnection(laboratory: Laboratory | null, clinic: Clinic | null, connections: ClinicLaboratoryConnection[], preferred = false) {
  if (!laboratory) return { valid: false, message: 'Choose a valid laboratory.' };
  if (!clinic) return { valid: false, message: 'Choose a valid clinic.' };
  if (laboratory.subscriberId !== clinic.subscriberId) return { valid: false, message: 'Laboratories can connect only to clinics under the same subscriber.' };
  if (laboratory.status === 'archived') return { valid: false, message: 'Archived laboratories cannot receive new clinic connections.' };
  if (clinic.status === 'archived') return { valid: false, message: 'Archived clinics cannot receive new laboratory connections.' };
  if (connections.some(item => item.laboratoryId === laboratory.id && item.clinicId === clinic.id && item.status === 'active')) return { valid: false, message: 'This clinic already has an active connection to this laboratory.' };
  if (preferred && laboratory.status !== 'active') return { valid: false, message: 'Only active laboratories can be set as preferred.' };
  return { valid: true };
}

export function validateServiceForm(service: Pick<LaboratoryService, 'serviceCode' | 'name' | 'defaultPrice' | 'defaultTurnaroundDays' | 'rushFee'>, services: LaboratoryService[], currentServiceId?: string) {
  if (!service.name.trim()) return { valid: false, message: 'Service name is required.' };
  if (!service.serviceCode.trim()) return { valid: false, message: 'Service code is required.' };
  if (services.some(item => item.id !== currentServiceId && item.status !== 'archived' && normalize(item.serviceCode) === normalize(service.serviceCode))) return { valid: false, message: 'Service code must be unique within this laboratory.' };
  if (service.defaultPrice !== undefined && service.defaultPrice < 0) return { valid: false, message: 'Prototype price cannot be negative.' };
  if (service.defaultTurnaroundDays <= 0) return { valid: false, message: 'Default turnaround must be positive.' };
  if (service.rushFee !== undefined && service.rushFee < 0) return { valid: false, message: 'Rush fee cannot be negative.' };
  return { valid: true };
}
