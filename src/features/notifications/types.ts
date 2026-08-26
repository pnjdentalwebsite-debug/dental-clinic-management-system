export type NotificationStatus = 'unread' | 'read' | 'archived' | 'expired';
export type NotificationCategory = 'registration' | 'subscriber' | 'user' | 'plan' | 'subscription' | 'payment' | 'clinic' | 'laboratory' | 'announcement' | 'system' | 'security' | 'data_quality';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface PlatformNotification {
  id: string;
  notificationNumber: string;
  recipientUserId?: string;
  subscriberId?: string;
  announcementId?: string;
  sourceModule: string;
  sourceRecordId?: string;
  eventKey: string;
  type: string;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
  expiresAt?: string;
  generatedBy: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface NotificationPreference {
  userId: string;
  category: NotificationCategory;
  inAppEnabled: boolean;
  emailPlaceholderEnabled: boolean;
  smsPlaceholderEnabled: boolean;
  pushPlaceholderEnabled: boolean;
  mandatory: boolean;
  updatedAt: string;
}

export interface NotificationHistoryRecord {
  id: string;
  notificationId: string;
  action: string;
  details: string;
  createdAt: string;
  actor: string;
}

export interface NotificationFilters {
  search: string;
  category: string;
  priority: string;
  readStatus: string;
  sourceModule: string;
  createdDate: string;
  subscriberId: string;
  tab: string;
}

export interface NotificationSort {
  field: keyof PlatformNotification;
  direction: 'asc' | 'desc';
}

export interface NotificationResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}
