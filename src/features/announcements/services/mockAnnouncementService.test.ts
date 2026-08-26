import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockNotificationService } from '../../notifications/services/mockNotificationService';
import { mockAnnouncementService } from './mockAnnouncementService';
import type { AnnouncementFormData } from '../types';

const baseData = (): AnnouncementFormData => ({
  ...mockAnnouncementService.getDefaultFormData(),
  title: 'Unit Announcement',
  slug: `unit-announcement-${Date.now()}`,
  summary: 'A unit-test announcement summary.',
  content: 'A unit-test announcement body.',
  targetAudience: { ...mockAnnouncementService.emptyAudience(), mode: 'all_platform_users' },
  deliveryChannels: ['in_app']
});

describe('mockAnnouncementService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it('seeds announcements without duplicating records', () => {
    const first = mockAnnouncementService.initializeAnnouncements();
    const second = mockAnnouncementService.initializeAnnouncements();
    expect(second.length).toBe(first.length);
    expect(second.filter(item => item.id.startsWith('ann-seed-')).length).toBeGreaterThanOrEqual(10);
  });

  it('creates and updates drafts with unique slug validation', () => {
    mockAnnouncementService.initializeAnnouncements();
    const data = baseData();
    const created = mockAnnouncementService.createAnnouncement(data, 'draft');
    expect(created.ok).toBe(true);
    expect(created.data?.status).toBe('draft');
    expect(mockAnnouncementService.createAnnouncement(data, 'draft').ok).toBe(false);
    const updated = mockAnnouncementService.updateAnnouncement(created.data!.id, { ...data, title: 'Updated Unit Announcement', slug: `${data.slug}-updated` });
    expect(updated.data?.title).toBe('Updated Unit Announcement');
  });

  it('resolves and deduplicates audience recipients', () => {
    mockAnnouncementService.initializeAnnouncements();
    const estimate = mockAnnouncementService.estimateAudience({ ...mockAnnouncementService.emptyAudience(), mode: 'all_platform_users' });
    expect(estimate.count).toBeGreaterThan(0);
    expect(new Set(estimate.recipients.map(item => item.userId)).size).toBe(estimate.count);
  });

  it('publishes idempotently and creates linked notification records once', () => {
    mockAnnouncementService.initializeAnnouncements();
    mockNotificationService.initializeNotifications();
    const created = mockAnnouncementService.createAnnouncement({ ...baseData(), slug: 'publish-idempotent' }, 'publish').data!;
    const firstRecipients = mockAnnouncementService.getAnnouncementRecipients(created.id);
    const notificationCount = mockNotificationService.listNotifications().filter(item => item.announcementId === created.id).length;
    mockAnnouncementService.publishAnnouncement(created.id);
    expect(mockAnnouncementService.getAnnouncementRecipients(created.id)).toHaveLength(firstRecipients.length);
    expect(mockNotificationService.listNotifications().filter(item => item.announcementId === created.id)).toHaveLength(notificationCount);
  });

  it('schedules, processes, and cancels scheduled announcements', () => {
    mockAnnouncementService.initializeAnnouncements();
    const future = new Date(Date.now() + 60_000).toISOString();
    const created = mockAnnouncementService.createAnnouncement({ ...baseData(), slug: 'schedule-unit', publishAt: future }, 'schedule').data!;
    expect(created.status).toBe('scheduled');
    expect(mockAnnouncementService.cancelScheduledAnnouncement(created.id).data?.status).toBe('cancelled');
    const due = mockAnnouncementService.createAnnouncement({ ...baseData(), slug: 'schedule-due' }, 'draft').data!;
    const now = new Date('2026-07-26T04:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    mockAnnouncementService.scheduleAnnouncement(due.id, new Date(now.getTime() + 60_000).toISOString());
    vi.setSystemTime(new Date(now.getTime() + 120_000));
    mockAnnouncementService.processScheduledAnnouncements();
    expect(mockAnnouncementService.getAnnouncementById(due.id)?.status).toBe('published');
  });

  it('archives, restores, duplicates, expires, and deletes unused drafts safely', () => {
    mockAnnouncementService.initializeAnnouncements();
    const created = mockAnnouncementService.createAnnouncement({ ...baseData(), slug: 'lifecycle-unit' }, 'draft').data!;
    expect(mockAnnouncementService.archiveAnnouncement(created.id).data?.status).toBe('archived');
    expect(mockAnnouncementService.restoreAnnouncement(created.id).data?.status).toBe('draft');
    expect(mockAnnouncementService.duplicateAnnouncement(created.id).data?.status).toBe('draft');
    const now = new Date('2026-07-26T04:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const expiring = mockAnnouncementService.createAnnouncement({ ...baseData(), slug: 'expire-unit', expiresAt: new Date(now.getTime() + 60_000).toISOString() }, 'publish').data!;
    vi.setSystemTime(new Date(now.getTime() + 120_000));
    mockAnnouncementService.expireAnnouncements();
    expect(mockAnnouncementService.getAnnouncementById(expiring.id)?.status).toBe('expired');
    expect(mockAnnouncementService.permanentlyDeleteUnusedDraft(created.id).ok).toBe(true);
  });
});
