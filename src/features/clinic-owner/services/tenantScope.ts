import type { Subscriber } from '../../platformManagement/types';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { mockClinicService } from '../../clinics/services/mockClinicService';

export function resolveRecordSubscriberId(subscriberId?: string | null): string {
  return subscriberId?.trim() || '';
}

export function subscriberIdMatches(recordSubscriberId: string | undefined | null, targetSubscriberId?: string | null): boolean {
  if (!targetSubscriberId || !recordSubscriberId) return false;
  return recordSubscriberId.trim() === targetSubscriberId.trim();
}

export function scopeRecordsBySubscriber<T extends { subscriberId?: string | null }>(
  records: T[],
  subscriberId?: string | null
): T[] {
  if (!subscriberId) return [];
  return records.filter((record) => subscriberIdMatches(record.subscriberId, subscriberId));
}

export type ClinicOwnerContextStatus = 'ready' | 'pending_approval' | 'not_found';

export interface ClinicOwnerContext {
  subscriberId: string;
  subscriber: Subscriber | null;
  status: ClinicOwnerContextStatus;
  message?: string;
}

const normalizeEmail = (value?: string | null) => String(value || '').trim().toLowerCase();

/**
 * Resolves the subscriber context for a signed-in clinic owner.
 *
 * Resolution order (first match wins):
 * 1. Platform user record linked to the logged-in email.
 * 2. Subscriber record whose email matches the logged-in email.
 * 3. Registration for this email, read-only. Approved registrations without subscriber linkage
 *    stay blocked until payment approval is re-run by the platform administrator.
 * 4. Clinic records matched by email or clinic name (for accounts that predate the linkage).
 *
 * Returns a status that callers can use to render accurate messaging:
 * - 'ready': subscriber + subscription linkage exists; create/edit workflows can proceed.
 * - 'pending_approval': a registration exists but is not yet approved/active.
 * - 'not_found': no registration, subscriber, platform user, or clinic could be linked.
 */
export function resolveClinicOwnerContext(loggedUserEmail?: string | null, loggedClinicName = ''): ClinicOwnerContext {
  const email = normalizeEmail(loggedUserEmail);
  const clinicName = String(loggedClinicName || '').trim().toLowerCase();

  if (!email && !clinicName) {
    return {
      subscriberId: '',
      subscriber: null,
      status: 'not_found',
      message: 'No signed-in clinic owner session was found.'
    };
  }

  // listSubscribers() is intentionally read-only here. Provisioning must happen from platform approval.
  const subscribers = mockPlatformManagementService.listSubscribers();

  const ready = (subscriber: Subscriber): ClinicOwnerContext => ({
    subscriberId: subscriber.id,
    subscriber,
    status: 'ready'
  });

  // 1. Platform user linkage
  const matchedUser = mockPlatformManagementService.listUsers().find(user => normalizeEmail(user.email) === email);
  if (matchedUser?.subscriberId) {
    const linked = subscribers.find(sub => sub.id === matchedUser.subscriberId);
    if (linked) return ready(linked);
  }

  // 2. Direct subscriber email match
  const byEmail = subscribers.find(sub => normalizeEmail(sub.email) === email);
  if (byEmail) return ready(byEmail);

  // 3. Registration-based resolution (read-only status check)
  const registrations = mockPlatformManagementService.listRegistrations();
  const registration = registrations.find(reg => normalizeEmail(reg.ownerEmail) === email);
  if (registration) {
    if (registration.paymentStatus === 'approved') {
      return {
        subscriberId: '',
        subscriber: null,
        status: 'pending_approval',
        message: 'Your payment is approved, but the clinic owner workspace has not been provisioned yet. Please ask the platform administrator to re-run payment approval.'
      };
    }
    return {
      subscriberId: '',
      subscriber: null,
      status: 'pending_approval',
      message: registration.paymentStatus === 'rejected'
        ? (registration.rejectionReason
            ? `Your payment verification was rejected: ${registration.rejectionReason}`
            : 'Your payment verification was rejected. Please contact the platform administrator.')
        : 'Your clinic registration or payment verification is still awaiting platform approval. Branches and laboratories unlock once your subscription is active.'
    };
  }

  // 4. Clinic email/name match fallback
  const clinics = mockClinicService.listClinics();
  const matchedClinic = clinics.find(clinic =>
    normalizeEmail(clinic.email) === email ||
    (clinicName && clinic.name?.trim().toLowerCase() === clinicName)
  );
  if (matchedClinic?.subscriberId) {
    const linked = subscribers.find(sub => sub.id === matchedClinic.subscriberId);
    if (linked) return ready(linked);
  }

  return {
    subscriberId: '',
    subscriber: null,
    status: 'not_found',
    message: 'This clinic owner account has no subscriber linkage yet. Complete your clinic registration and wait for platform approval.'
  };
}
