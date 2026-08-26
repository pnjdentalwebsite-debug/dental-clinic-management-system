import { mockAnalyticsService } from '../../analytics/services/mockAnalyticsService';
import { mockPaymentService } from '../../payments/services/mockPaymentService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type { PlatformUser } from '../../platformManagement/types';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import type { NotificationCategory, NotificationFilters, NotificationHistoryRecord, NotificationPreference, NotificationPriority, NotificationResult, NotificationSort, PlatformNotification } from '../types';

const NOTIFICATIONS_KEY = 'pnj_mock_notifications';
const PREFERENCES_KEY = 'pnj_mock_notification_preferences';
const HISTORY_KEY = 'pnj_mock_notification_history';

const today = () => new Date().toISOString().split('T')[0];
const nowIso = () => new Date().toISOString();
const nowText = () => new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const categories: NotificationCategory[] = ['registration', 'subscriber', 'user', 'plan', 'subscription', 'payment', 'clinic', 'laboratory', 'announcement', 'system', 'security', 'data_quality'];

type NotificationCreateInput = Omit<Partial<PlatformNotification>, 'id' | 'notificationNumber' | 'status' | 'createdAt'> & { eventKey: string; title: string; message: string; category: NotificationCategory };

export const NOTIFICATION_STATE_CHANGED_EVENT = 'NOTIFICATION_STATE_CHANGED';

const dispatchNotificationChange = () => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(NOTIFICATION_STATE_CHANGED_EVENT));
    }, 0);
  }
};

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));
const readNotifications = () => safeRead<PlatformNotification[]>(NOTIFICATIONS_KEY, []);
const writeNotifications = (records: PlatformNotification[]) => safeWrite(NOTIFICATIONS_KEY, records);
const readPreferences = () => safeRead<NotificationPreference[]>(PREFERENCES_KEY, []);
const writePreferences = (records: NotificationPreference[]) => safeWrite(PREFERENCES_KEY, records);
const readHistory = () => safeRead<NotificationHistoryRecord[]>(HISTORY_KEY, []);
const writeHistory = (records: NotificationHistoryRecord[]) => safeWrite(HISTORY_KEY, records);

const platformOwner = () => mockPlatformManagementService.listUsers().find(user => user.role === 'clinic_owner') || mockPlatformManagementService.listUsers()[0];
const isMandatory = (category: NotificationCategory) => ['security', 'system', 'data_quality'].includes(category);
const addHistory = (notificationId: string, action: string, details: string) => writeHistory([{ id: makeId('NH'), notificationId, action, details, createdAt: nowText(), actor: 'platform_owner' }, ...readHistory()]);

const normalizeNotification = (record: Partial<PlatformNotification>, index: number): PlatformNotification | null => {
  if (!record.id && !record.eventKey) return null;
  return {
    id: String(record.id || makeId('NTF')),
    notificationNumber: String(record.notificationNumber || `NTF-${String(index + 1).padStart(6, '0')}`),
    recipientUserId: record.recipientUserId,
    subscriberId: record.subscriberId,
    announcementId: record.announcementId,
    sourceModule: String(record.sourceModule || 'system'),
    sourceRecordId: record.sourceRecordId,
    eventKey: String(record.eventKey || record.id),
    type: String(record.type || 'system_alert'),
    category: categories.includes(record.category as NotificationCategory) ? record.category as NotificationCategory : 'system',
    title: String(record.title || 'Platform notification'),
    message: String(record.message || ''),
    priority: ['low', 'normal', 'high', 'urgent'].includes(String(record.priority)) ? record.priority as NotificationPriority : 'normal',
    status: ['unread', 'read', 'archived', 'expired'].includes(String(record.status)) ? record.status as PlatformNotification['status'] : 'unread',
    actionUrl: record.actionUrl,
    actionLabel: record.actionLabel,
    createdAt: String(record.createdAt || nowIso()),
    readAt: record.readAt,
    archivedAt: record.archivedAt,
    expiresAt: record.expiresAt,
    generatedBy: String(record.generatedBy || 'system'),
    metadata: record.metadata
  };
};

const defaultPreferencesForUser = (user: PlatformUser): NotificationPreference[] => categories.map(category => ({
  userId: user.id,
  category,
  inAppEnabled: true,
  emailPlaceholderEnabled: false,
  smsPlaceholderEnabled: false,
  pushPlaceholderEnabled: false,
  mandatory: isMandatory(category),
  updatedAt: today()
}));

const preferenceAllows = (userId: string | undefined, category: NotificationCategory) => {
  if (!userId) return true;
  const preference = readPreferences().find(item => item.userId === userId && item.category === category);
  return preference?.mandatory || preference?.inAppEnabled !== false;
};

export const mockNotificationService = {
  initializeNotifications: () => {
    mockPlatformManagementService.ensureSeedData();
    const normalized = readNotifications().map(normalizeNotification).filter(Boolean) as PlatformNotification[];
    const cleaned = normalized.filter(item => !item.eventKey?.startsWith('seed-') && !item.id?.startsWith('ntf-seed-'));
    writeNotifications(cleaned);
    const users = mockPlatformManagementService.listUsers();
    const existingPrefs = readPreferences();
    const prefKeys = new Set(existingPrefs.map(item => `${item.userId}-${item.category}`));
    const missingPrefs = users.flatMap(user => defaultPreferencesForUser(user).filter(item => !prefKeys.has(`${item.userId}-${item.category}`)));
    if (missingPrefs.length) writePreferences([...existingPrefs, ...missingPrefs]);
    mockNotificationService.reconcileNotifications();
    return mockNotificationService.listNotifications();
  },
  listNotifications: () => {
    return readNotifications().map(normalizeNotification).filter(Boolean) as PlatformNotification[];
  },
  getNotificationById: (id: string) => mockNotificationService.listNotifications().find(item => item.id === id || item.notificationNumber === id) || null,
  getNotificationsByUserId: (userId: string) => mockNotificationService.listNotifications().filter(item => item.recipientUserId === userId || !item.recipientUserId),
  preventDuplicateNotification: (eventKey: string, recipientUserId?: string) => mockNotificationService.listNotifications().some(item => item.eventKey === eventKey && item.recipientUserId === recipientUserId),
  createNotification: (data: NotificationCreateInput): NotificationResult<PlatformNotification> => {
    if (mockNotificationService.preventDuplicateNotification(data.eventKey, data.recipientUserId)) return { ok: true, data: mockNotificationService.listNotifications().find(item => item.eventKey === data.eventKey && item.recipientUserId === data.recipientUserId)! };
    if (!preferenceAllows(data.recipientUserId, data.category)) return { ok: false, error: 'Notification skipped by in-app preference.' };
    const records = mockNotificationService.listNotifications();
    const notification: PlatformNotification = {
      id: makeId('NTF'),
      notificationNumber: `NTF-${String(records.length + 1).padStart(6, '0')}`,
      recipientUserId: data.recipientUserId,
      subscriberId: data.subscriberId,
      announcementId: data.announcementId,
      sourceModule: data.sourceModule || 'system',
      sourceRecordId: data.sourceRecordId,
      eventKey: data.eventKey,
      type: data.type || 'system_alert',
      category: data.category,
      title: data.title,
      message: data.message,
      priority: data.priority || 'normal',
      status: 'unread',
      actionUrl: data.actionUrl,
      actionLabel: data.actionLabel,
      createdAt: nowIso(),
      expiresAt: data.expiresAt,
      generatedBy: data.generatedBy || 'system',
      metadata: data.metadata
    };
    writeNotifications([notification, ...records]);
    addHistory(notification.id, 'Created', `${notification.notificationNumber} generated.`);
    dispatchNotificationChange();
    return { ok: true, data: notification };
  },
  createSystemNotification: (data: NotificationCreateInput) => mockNotificationService.createNotification(data),
  createAnnouncementNotification: (announcementId: string, recipientUserId: string, subscriberId: string | undefined, title: string, message: string, priority: NotificationPriority, actionUrl: string) => mockNotificationService.createNotification({ eventKey: `announcement-${announcementId}-${recipientUserId}`, announcementId, recipientUserId, subscriberId, sourceModule: 'announcements', sourceRecordId: announcementId, category: 'announcement', type: 'announcement', title, message, priority, actionUrl, actionLabel: 'View Announcement', generatedBy: 'announcement_service' }),
  markAsRead: (id: string) => mockNotificationService.updateStatus(id, 'read', { readAt: nowIso() }),
  markAsUnread: (id: string) => mockNotificationService.updateStatus(id, 'unread', { readAt: undefined }),
  markSelectedAsRead: (ids: string[]) => ids.map(id => mockNotificationService.markAsRead(id)),
  markAllAsRead: (recipientUserId?: string) => mockNotificationService.listNotifications().filter(item => item.status === 'unread' && (!recipientUserId || item.recipientUserId === recipientUserId)).map(item => mockNotificationService.markAsRead(item.id)),
  archiveNotification: (id: string) => mockNotificationService.updateStatus(id, 'archived', { archivedAt: nowIso() }),
  archiveSelected: (ids: string[]) => ids.map(id => mockNotificationService.archiveNotification(id)),
  restoreNotification: (id: string) => mockNotificationService.updateStatus(id, 'unread', { archivedAt: undefined }),
  expireNotifications: () => mockNotificationService.listNotifications().filter(item => item.expiresAt && new Date(item.expiresAt) < new Date() && item.status !== 'archived').map(item => mockNotificationService.updateStatus(item.id, 'expired')),
  updateStatus: (id: string, status: PlatformNotification['status'], patch: Partial<PlatformNotification> = {}): NotificationResult<PlatformNotification> => {
    const records = mockNotificationService.listNotifications();
    const target = records.find(item => item.id === id);
    if (!target) return { ok: false, error: 'Notification not found.' };
    const updated = { ...target, ...patch, status };
    writeNotifications(records.map(item => item.id === id ? updated : item));
    addHistory(id, status === 'read' ? 'Marked Read' : status === 'unread' ? 'Marked Unread' : status === 'archived' ? 'Archived' : 'Expired', `${target.notificationNumber} status changed to ${status}.`);
    dispatchNotificationChange();
    return { ok: true, data: updated };
  },
  getUnreadCount: (recipientUserId?: string) => mockNotificationService.listNotifications().filter(item => item.status === 'unread' && (!recipientUserId || item.recipientUserId === recipientUserId)).length,
  getNotificationSummary: () => {
    const records = mockNotificationService.listNotifications();
    return { total: records.length, unread: records.filter(item => item.status === 'unread').length, highPriority: records.filter(item => item.priority === 'high').length, urgent: records.filter(item => item.priority === 'urgent').length, announcements: records.filter(item => item.category === 'announcement').length, administrative: records.filter(item => ['registration', 'payment', 'subscription', 'subscriber', 'data_quality'].includes(item.category)).length, archived: records.filter(item => item.status === 'archived').length };
  },
  searchNotifications: (records: PlatformNotification[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter(item => [item.notificationNumber, item.title, item.message, item.category, item.sourceModule].some(value => String(value || '').toLowerCase().includes(term)));
  },
  filterNotifications: (records: PlatformNotification[], filters: NotificationFilters) => {
    let next = mockNotificationService.searchNotifications(records, filters.search);
    if (filters.tab === 'unread') next = next.filter(item => item.status === 'unread');
    if (filters.tab === 'read') next = next.filter(item => item.status === 'read');
    if (filters.tab === 'high') next = next.filter(item => ['high', 'urgent'].includes(item.priority));
    if (filters.tab === 'announcements') next = next.filter(item => item.category === 'announcement');
    if (filters.tab === 'system') next = next.filter(item => ['system', 'security', 'data_quality'].includes(item.category));
    if (filters.tab === 'archived') next = next.filter(item => item.status === 'archived');
    if (filters.category !== 'all') next = next.filter(item => item.category === filters.category);
    if (filters.priority !== 'all') next = next.filter(item => item.priority === filters.priority);
    if (filters.readStatus !== 'all') next = next.filter(item => item.status === filters.readStatus);
    if (filters.sourceModule !== 'all') next = next.filter(item => item.sourceModule === filters.sourceModule);
    if (filters.createdDate) next = next.filter(item => item.createdAt.startsWith(filters.createdDate));
    if (filters.subscriberId !== 'all') next = next.filter(item => item.subscriberId === filters.subscriberId);
    return next;
  },
  sortNotifications: (records: PlatformNotification[], sort: NotificationSort) => [...records].sort((a, b) => String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? '')) * (sort.direction === 'asc' ? 1 : -1)),
  paginateNotifications: (records: PlatformNotification[], page: number, pageSize: number) => records.slice((page - 1) * pageSize, page * pageSize),
  getNotificationPreferences: (userId: string) => readPreferences().filter(item => item.userId === userId),
  updateNotificationPreferences: (userId: string, category: NotificationCategory, patch: Partial<NotificationPreference>) => {
    const prefs = readPreferences();
    const current = prefs.find(item => item.userId === userId && item.category === category) || defaultPreferencesForUser({ id: userId } as PlatformUser).find(item => item.category === category)!;
    const updated = { ...current, ...patch, inAppEnabled: current.mandatory ? true : patch.inAppEnabled ?? current.inAppEnabled, updatedAt: today() };
    writePreferences(prefs.some(item => item.userId === userId && item.category === category) ? prefs.map(item => item.userId === userId && item.category === category ? updated : item) : [updated, ...prefs]);
    dispatchNotificationChange();
    return { ok: true, data: updated };
  },
  reconcileNotifications: () => {
    mockPaymentService.initializePayments();
    mockSubscriptionService.initializeSubscriptions();
    const owner = platformOwner();
    mockPaymentService.listPayments().filter(payment => payment.verificationStatus === 'pending').forEach(payment => mockNotificationService.createSystemNotification({ eventKey: `payment-pending-${payment.id}`, recipientUserId: owner?.id, subscriberId: payment.subscriberId, sourceModule: 'payments', sourceRecordId: payment.id, category: 'payment', title: 'Payment requires verification', message: `${payment.paymentNumber} is pending verification.`, priority: 'high', actionUrl: `/platform/payments/${payment.id}`, actionLabel: 'Review Payment' }));
    mockSubscriptionService.listSubscriptions().filter((subscription: any) => ['expiring_soon', 'expired', 'suspended'].includes(subscription.status)).forEach((subscription: any) => mockNotificationService.createSystemNotification({ eventKey: `subscription-${subscription.status}-${subscription.id}`, recipientUserId: owner?.id, subscriberId: subscription.subscriberId, sourceModule: 'subscriptions', sourceRecordId: subscription.id, category: 'subscription', title: `Subscription ${subscription.status.replaceAll('_', ' ')}`, message: `${subscription.subscriptionNumber} is ${subscription.status.replaceAll('_', ' ')}.`, priority: subscription.status === 'expired' ? 'urgent' : 'high', actionUrl: `/platform/subscriptions/${subscription.id}`, actionLabel: 'Open Subscription' }));
    mockPlatformManagementService.listUsers().filter(user => user.mustChangePassword || user.accountStatus === 'suspended').forEach(user => mockNotificationService.createSystemNotification({ eventKey: `user-attention-${user.id}-${user.accountStatus}-${user.mustChangePassword}`, recipientUserId: owner?.id, subscriberId: user.subscriberId, sourceModule: 'users', sourceRecordId: user.id, category: 'user', title: 'User account requires attention', message: `${user.fullName} has an account state requiring review.`, priority: 'normal', actionUrl: `/platform/users/${user.id}`, actionLabel: 'Open User' }));
    const dq = mockAnalyticsService.getReport('data-quality').warnings.filter(item => ['critical', 'high'].includes(item.severity)).slice(0, 5);
    dq.forEach(warning => mockNotificationService.createSystemNotification({ eventKey: `data-quality-${warning.id}`, recipientUserId: owner?.id, sourceModule: 'analytics', sourceRecordId: warning.recordId, category: 'data_quality', title: 'Data-quality issue detected', message: warning.description, priority: warning.severity === 'critical' ? 'urgent' : 'high', actionUrl: warning.route || '/platform/analytics-reports/data-quality', actionLabel: 'Review Issue' }));
    mockNotificationService.expireNotifications();
    dispatchNotificationChange();
    return mockNotificationService.listNotifications();
  },
  clearReadNotifications: () => {
    const unreadOnly = mockNotificationService.listNotifications().filter(item => item.status === 'unread');
    writeNotifications(unreadOnly);
    dispatchNotificationChange();
    return unreadOnly;
  },
  exportNotificationsCsv: () => {
    const list = mockNotificationService.listNotifications();
    const headers = ['Notification Number', 'Title', 'Message', 'Category', 'Priority', 'Status', 'Source Module', 'Created At', 'Action URL'];
    const rows = list.map(n => [
      n.notificationNumber,
      `"${(n.title || '').replace(/"/g, '""')}"`,
      `"${(n.message || '').replace(/"/g, '""')}"`,
      n.category,
      n.priority,
      n.status,
      n.sourceModule,
      n.createdAt,
      n.actionUrl || ''
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  },
  handleNotificationAction: (id: string) => mockNotificationService.getNotificationById(id)?.actionUrl || '/platform/notifications'
};
