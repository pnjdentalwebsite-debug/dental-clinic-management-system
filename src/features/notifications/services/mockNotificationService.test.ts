import { beforeEach, describe, expect, it } from 'vitest';
import { mockNotificationService } from './mockNotificationService';

describe('mockNotificationService', () => {
  beforeEach(() => localStorage.clear());

  it('seeds notifications and preferences without duplicates', () => {
    const first = mockNotificationService.initializeNotifications();
    const second = mockNotificationService.initializeNotifications();
    expect(second.length).toBe(first.length);
    expect(new Set(second.map(item => item.eventKey)).size).toBe(second.length);
  });

  it('creates idempotent notifications by event key and recipient', () => {
    mockNotificationService.initializeNotifications();
    const first = mockNotificationService.createNotification({ eventKey: 'unit-event', recipientUserId: 'user-a', category: 'system', title: 'One', message: 'Message' });
    const second = mockNotificationService.createNotification({ eventKey: 'unit-event', recipientUserId: 'user-a', category: 'system', title: 'One', message: 'Message' });
    expect(first.ok).toBe(true);
    expect(second.data?.id).toBe(first.data?.id);
  });

  it('supports read, unread, archive, restore, and bulk actions', () => {
    mockNotificationService.initializeNotifications();
    const notification = mockNotificationService.createNotification({ eventKey: 'status-event', category: 'payment', title: 'Status', message: 'Status body' }).data!;
    expect(mockNotificationService.markAsRead(notification.id).data?.status).toBe('read');
    expect(mockNotificationService.markAsUnread(notification.id).data?.status).toBe('unread');
    expect(mockNotificationService.archiveNotification(notification.id).data?.status).toBe('archived');
    expect(mockNotificationService.restoreNotification(notification.id).data?.status).toBe('unread');
    mockNotificationService.markSelectedAsRead([notification.id]);
    expect(mockNotificationService.getNotificationById(notification.id)?.status).toBe('read');
    mockNotificationService.markAllAsRead();
    expect(mockNotificationService.getUnreadCount()).toBe(0);
  });

  it('honors non-mandatory in-app preferences', () => {
    mockNotificationService.initializeNotifications();
    mockNotificationService.updateNotificationPreferences('user-pref', 'announcement', { inAppEnabled: false });
    const result = mockNotificationService.createNotification({ eventKey: 'pref-event', recipientUserId: 'user-pref', category: 'announcement', title: 'Hidden', message: 'Skipped' });
    expect(result.ok).toBe(false);
  });

  it('links announcement notifications', () => {
    mockNotificationService.initializeNotifications();
    const result = mockNotificationService.createAnnouncementNotification('ann-a', 'user-a', 'sub-a', 'Announcement', 'Summary', 'high', '/platform/announcements/ann-a');
    expect(result.ok).toBe(true);
    expect(result.data?.announcementId).toBe('ann-a');
    expect(result.data?.category).toBe('announcement');
  });
});
