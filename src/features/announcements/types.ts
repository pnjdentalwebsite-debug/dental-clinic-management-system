import type { AccountStatus, PlatformUserRole, SubscriptionStatus } from '../platformManagement/types';

export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'expired' | 'cancelled' | 'archived';
export type AnnouncementType = 'general' | 'maintenance' | 'service_update' | 'subscription' | 'payment' | 'security' | 'policy' | 'emergency' | 'feature_release' | 'other';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AnnouncementVisibility = 'public_platform' | 'authenticated_only' | 'targeted';
export type AudienceMode = 'all_platform_users' | 'all_subscribers' | 'subscriber_status' | 'subscription_plan' | 'subscription_status' | 'specific_subscribers' | 'user_roles' | 'specific_users' | 'clinics' | 'laboratories';
export type DeliveryChannel = 'in_app' | 'email_placeholder' | 'sms_placeholder' | 'push_placeholder';
export type DeliveryStatus = 'pending' | 'generated' | 'delivered_in_app' | 'failed_mock' | 'skipped' | 'cancelled';
export type AnnouncementUserRole = PlatformUserRole | 'platform_owner';

export interface AnnouncementAudience {
  mode: AudienceMode;
  subscriberIds: string[];
  userIds: string[];
  clinicIds: string[];
  laboratoryIds: string[];
  planIds: string[];
  subscriberStatuses: AccountStatus[];
  subscriptionStatuses: SubscriptionStatus[];
  userRoles: AnnouncementUserRole[];
}

export interface Announcement {
  id: string;
  announcementNumber: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  announcementType: AnnouncementType;
  priority: AnnouncementPriority;
  status: AnnouncementStatus;
  visibility: AnnouncementVisibility;
  targetAudience: AnnouncementAudience;
  deliveryChannels: DeliveryChannel[];
  publishAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  publishedBy?: string;
  cancelledBy?: string;
  archivedBy?: string;
  featured: boolean;
  requiresAcknowledgement: boolean;
  allowDismiss: boolean;
  recipientEstimate: number;
  deliveryCount: number;
  readCount: number;
  acknowledgementCount: number;
  tags: string[];
  internalNotes?: string;
}

export interface AnnouncementRecipient {
  id: string;
  announcementId: string;
  userId: string;
  subscriberId?: string;
  deliveryChannel: DeliveryChannel;
  deliveryStatus: DeliveryStatus;
  notificationId?: string;
  generatedAt: string;
  deliveredAt?: string;
  readAt?: string;
  acknowledgedAt?: string;
  dismissedAt?: string;
  failureReason?: string;
}

export interface AnnouncementHistoryRecord {
  id: string;
  announcementId: string;
  action: string;
  details: string;
  createdAt: string;
  actor: string;
}

export interface AudienceResolutionRecipient {
  userId: string;
  userName: string;
  email: string;
  role: AnnouncementUserRole;
  subscriberId?: string;
  subscriberName?: string;
}

export interface AnnouncementFilters {
  search: string;
  announcementType: string;
  priority: string;
  status: string;
  audienceType: string;
  publishDate: string;
  expirationDate: string;
  requiresAcknowledgement: string;
  tab: string;
}

export interface AnnouncementSort {
  field: keyof Announcement;
  direction: 'asc' | 'desc';
}

export interface AnnouncementFormData {
  title: string;
  slug: string;
  summary: string;
  content: string;
  announcementType: AnnouncementType;
  priority: AnnouncementPriority;
  visibility: AnnouncementVisibility;
  targetAudience: AnnouncementAudience;
  deliveryChannels: DeliveryChannel[];
  publishAt: string;
  expiresAt: string;
  featured: boolean;
  requiresAcknowledgement: boolean;
  allowDismiss: boolean;
  tags: string[];
  internalNotes: string;
}

export interface AnnouncementResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
