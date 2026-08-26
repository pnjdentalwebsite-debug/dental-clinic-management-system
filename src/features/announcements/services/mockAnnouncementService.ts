import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { mockNotificationService } from '../../notifications/services/mockNotificationService';
import type { NotificationPriority } from '../../notifications/types';
import { mockPlanService } from '../../plans/services/mockPlanService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type { ActivityLogLike, PlatformUser, Subscriber } from '../../platformManagement/types';
import { mockSubscriptionService } from '../../subscriptions/services/mockSubscriptionService';
import type { Announcement, AnnouncementAudience, AnnouncementFilters, AnnouncementFormData, AnnouncementHistoryRecord, AnnouncementRecipient, AnnouncementResult, AnnouncementSort, AudienceResolutionRecipient, DeliveryChannel } from '../types';

const ANNOUNCEMENTS_KEY = 'pnj_mock_announcements';
const RECIPIENTS_KEY = 'pnj_mock_announcement_recipients';
const HISTORY_KEY = 'pnj_mock_announcement_history';
const ACTIVITY_KEY = 'pnj_mock_activity_logs';

const today = () => new Date().toISOString().split('T')[0];
const nowIso = () => new Date().toISOString();
const nowText = () => new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `announcement-${Date.now()}`;

const emptyAudience = (): AnnouncementAudience => ({
  mode: 'all_platform_users',
  subscriberIds: [],
  userIds: [],
  clinicIds: [],
  laboratoryIds: [],
  planIds: [],
  subscriberStatuses: [],
  subscriptionStatuses: [],
  userRoles: []
});

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};
const safeWrite = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    if (key === ACTIVITY_KEY && Array.isArray(value)) {
      const trimmed = value.slice(0, 200);
      try {
        localStorage.setItem(key, JSON.stringify(trimmed));
        return;
      } catch {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
        return;
      }
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
};
const readAnnouncements = () => safeRead<Announcement[]>(ANNOUNCEMENTS_KEY, []);
const writeAnnouncements = (records: Announcement[]) => safeWrite(ANNOUNCEMENTS_KEY, records);
const readRecipients = () => safeRead<AnnouncementRecipient[]>(RECIPIENTS_KEY, []);
const writeRecipients = (records: AnnouncementRecipient[]) => safeWrite(RECIPIENTS_KEY, records);
const readHistory = () => safeRead<AnnouncementHistoryRecord[]>(HISTORY_KEY, []);
const writeHistory = (records: AnnouncementHistoryRecord[]) => safeWrite(HISTORY_KEY, records);

const logActivity = (event: string, details: string) => {
  const logs = safeRead<ActivityLogLike[]>(ACTIVITY_KEY, []);
  safeWrite(ACTIVITY_KEY, [{ id: makeId('LOG'), timestamp: nowText(), event, details, role: 'platform_owner' }, ...logs]);
};

const addHistory = (announcementId: string, action: string, details: string) => {
  writeHistory([{ id: makeId('AH'), announcementId, action, details, createdAt: nowText(), actor: 'platform_owner' }, ...readHistory()]);
};

const subscriberMap = () => new Map(mockPlatformManagementService.listSubscribers().map(item => [item.id, item]));
const activeUsers = () => mockPlatformManagementService.listUsers().filter(user => !['suspended', 'deactivated'].includes(user.accountStatus));
const activeSubscribers = () => mockPlatformManagementService.listSubscribers().filter(subscriber => !['suspended', 'deactivated'].includes(subscriber.accountStatus));
const hasAudienceSelections = (audience: AnnouncementAudience) => {
  if (['all_platform_users', 'all_subscribers'].includes(audience.mode)) return true;
  const fields = [audience.subscriberIds, audience.userIds, audience.clinicIds, audience.laboratoryIds, audience.planIds, audience.subscriberStatuses, audience.subscriptionStatuses, audience.userRoles];
  return fields.some(field => field.length > 0);
};

const recipientFromUser = (user: PlatformUser, subscribers: Map<string, Subscriber>): AudienceResolutionRecipient => {
  const subscriber = user.subscriberId ? subscribers.get(user.subscriberId) : undefined;
  return { userId: user.id, userName: user.fullName, email: user.email, role: user.role, subscriberId: user.subscriberId, subscriberName: subscriber?.businessName };
};

const audienceLabel = (audience: AnnouncementAudience) => {
  const labels: Record<string, string> = {
    all_platform_users: 'All platform users',
    all_subscribers: 'All subscribers',
    subscriber_status: 'Subscriber status',
    subscription_plan: 'Subscription plan',
    subscription_status: 'Subscription status',
    specific_subscribers: 'Specific subscribers',
    user_roles: 'User roles',
    specific_users: 'Specific users',
    clinics: 'Clinics',
    laboratories: 'Laboratories'
  };
  return labels[audience.mode] || audience.mode;
};

const normalizeAnnouncement = (record: Partial<Announcement>, index: number): Announcement | null => {
  if (!record.id && !record.title) return null;
  const targetAudience = { ...emptyAudience(), ...(record.targetAudience || {}) };
  return {
    id: String(record.id || makeId('ANN')),
    announcementNumber: String(record.announcementNumber || `ANN-${String(index + 1).padStart(6, '0')}`),
    title: String(record.title || 'Untitled Announcement'),
    slug: String(record.slug || slugify(String(record.title || 'announcement'))),
    summary: String(record.summary || ''),
    content: String(record.content || ''),
    announcementType: record.announcementType || 'general',
    priority: record.priority || 'normal',
    status: record.status || 'draft',
    visibility: record.visibility || 'authenticated_only',
    targetAudience,
    deliveryChannels: record.deliveryChannels?.length ? record.deliveryChannels : ['in_app'],
    publishAt: record.publishAt,
    publishedAt: record.publishedAt,
    expiresAt: record.expiresAt,
    cancelledAt: record.cancelledAt,
    archivedAt: record.archivedAt,
    createdAt: record.createdAt || today(),
    updatedAt: record.updatedAt || today(),
    createdBy: record.createdBy || 'platform_owner',
    updatedBy: record.updatedBy || 'platform_owner',
    publishedBy: record.publishedBy,
    cancelledBy: record.cancelledBy,
    archivedBy: record.archivedBy,
    featured: Boolean(record.featured),
    requiresAcknowledgement: Boolean(record.requiresAcknowledgement),
    allowDismiss: record.allowDismiss !== false,
    recipientEstimate: Number(record.recipientEstimate || 0),
    deliveryCount: Number(record.deliveryCount || 0),
    readCount: Number(record.readCount || 0),
    acknowledgementCount: Number(record.acknowledgementCount || 0),
    tags: record.tags || [],
    internalNotes: record.internalNotes || ''
  };
};

const buildFormData = (data: Partial<AnnouncementFormData>): AnnouncementFormData => ({
  title: data.title || '',
  slug: data.slug || slugify(data.title || ''),
  summary: data.summary || '',
  content: data.content || '',
  announcementType: data.announcementType || 'general',
  priority: data.priority || 'normal',
  visibility: data.visibility || 'authenticated_only',
  targetAudience: { ...emptyAudience(), ...(data.targetAudience || {}) },
  deliveryChannels: data.deliveryChannels?.length ? data.deliveryChannels : ['in_app'],
  publishAt: data.publishAt || '',
  expiresAt: data.expiresAt || '',
  featured: Boolean(data.featured),
  requiresAcknowledgement: Boolean(data.requiresAcknowledgement),
  allowDismiss: data.allowDismiss !== false,
  tags: data.tags || [],
  internalNotes: data.internalNotes || ''
});

const patchAnnouncement = (announcementId: string, patch: Partial<Announcement>) => {
  const records = mockAnnouncementService.listAnnouncements();
  const updated = records.map(item => item.id === announcementId ? { ...item, ...patch, updatedAt: today() } : item);
  writeAnnouncements(updated);
  return updated.find(item => item.id === announcementId)!;
};

const reconcileCounts = (announcementId: string) => {
  const recipients = readRecipients().filter(item => item.announcementId === announcementId);
  return patchAnnouncement(announcementId, {
    recipientEstimate: new Set(recipients.map(item => item.userId)).size,
    deliveryCount: recipients.filter(item => item.deliveryStatus === 'delivered_in_app' || item.deliveryStatus === 'generated').length,
    readCount: recipients.filter(item => item.readAt).length,
    acknowledgementCount: recipients.filter(item => item.acknowledgedAt).length
  });
};

export const mockAnnouncementService = {
  emptyAudience,
  getDefaultFormData: (): AnnouncementFormData => buildFormData({}),
  initializeAnnouncements: () => {
    mockPlatformManagementService.ensureSeedData();
    mockPlanService.initializePlans();
    mockSubscriptionService.initializeSubscriptions();
    mockClinicService.initializeClinics();
    mockLaboratoryService.initializeLaboratories();
    const normalized = readAnnouncements().map(normalizeAnnouncement).filter(Boolean) as Announcement[];
    const cleaned = normalized.filter(item => !item.id.startsWith('ann-seed-'));
    writeAnnouncements(cleaned);
    mockAnnouncementService.listAnnouncements().filter(item => item.status === 'published').forEach(item => mockAnnouncementService.reconcileAnnouncementRecipients(item.id));
    mockAnnouncementService.expireAnnouncements();
    return mockAnnouncementService.listAnnouncements();
  },
  listAnnouncements: () => {
    const normalized = readAnnouncements().map(normalizeAnnouncement).filter(Boolean) as Announcement[];
    writeAnnouncements(normalized);
    return normalized;
  },
  getAnnouncementById: (id: string) => mockAnnouncementService.listAnnouncements().find(item => item.id === id || item.announcementNumber === id || item.slug === id) || null,
  getAnnouncementHistory: (announcementId: string) => readHistory().filter(item => item.announcementId === announcementId),
  validateAudience: (audience: AnnouncementAudience): AnnouncementResult<AnnouncementAudience> => {
    if (!hasAudienceSelections(audience)) return { ok: false, error: 'Select a valid audience.' };
    return { ok: true, data: audience };
  },
  validateAnnouncement: (data: Partial<AnnouncementFormData>, currentId?: string, mode: 'draft' | 'publish' | 'schedule' = 'publish'): AnnouncementResult<AnnouncementFormData> => {
    const form = buildFormData(data);
    if (!form.title.trim()) return { ok: false, error: 'Title is required.' };
    if (mode !== 'draft' && !form.summary.trim()) return { ok: false, error: 'Summary is required.' };
    if (mode !== 'draft' && !form.content.trim()) return { ok: false, error: 'Content is required.' };
    if (!mockAnnouncementService.validateUniqueSlug(form.slug, currentId)) return { ok: false, error: 'Slug must be unique.' };
    if (!form.deliveryChannels.length) return { ok: false, error: 'Select at least one delivery channel.' };
    const audienceResult = mockAnnouncementService.validateAudience(form.targetAudience);
    if (mode !== 'draft' && !audienceResult.ok) return { ok: false, error: audienceResult.error };
    if (mode === 'schedule' && (!form.publishAt || new Date(form.publishAt) <= new Date())) return { ok: false, error: 'Scheduled publish date must be in the future.' };
    const publishDate = form.publishAt ? new Date(form.publishAt) : new Date();
    if (form.expiresAt && new Date(form.expiresAt) <= publishDate) return { ok: false, error: 'Expiration must be later than publication.' };
    return { ok: true, data: form };
  },
  validateUniqueSlug: (slug: string, currentId?: string) => !mockAnnouncementService.listAnnouncements().some(item => item.id !== currentId && item.slug.toLowerCase() === slug.toLowerCase()),
  createAnnouncement: (data: Partial<AnnouncementFormData>, status: 'draft' | 'publish' | 'schedule' = 'draft'): AnnouncementResult<Announcement> => {
    const validation = mockAnnouncementService.validateAnnouncement(data, undefined, status);
    if (!validation.ok || !validation.data) return { ok: false, error: validation.error };
    const records = mockAnnouncementService.listAnnouncements();
    const form = validation.data;
    const announcement: Announcement = {
      id: makeId('ANN'),
      announcementNumber: `ANN-${String(records.length + 1).padStart(6, '0')}`,
      ...form,
      slug: slugify(form.slug || form.title),
      status: status === 'schedule' ? 'scheduled' : 'draft',
      publishAt: form.publishAt || undefined,
      expiresAt: form.expiresAt || undefined,
      publishedAt: undefined,
      createdAt: today(),
      updatedAt: today(),
      createdBy: 'platform_owner',
      updatedBy: 'platform_owner',
      recipientEstimate: mockAnnouncementService.estimateAudience(form.targetAudience).count,
      deliveryCount: 0,
      readCount: 0,
      acknowledgementCount: 0
    };
    writeAnnouncements([announcement, ...records]);
    addHistory(announcement.id, 'Created', `${announcement.announcementNumber} created as ${announcement.status}.`);
    logActivity('Announcement Created', announcement.title);
    if (status === 'publish') return mockAnnouncementService.publishAnnouncement(announcement.id);
    return { ok: true, data: announcement };
  },
  updateAnnouncement: (id: string, data: Partial<AnnouncementFormData>): AnnouncementResult<Announcement> => {
    const current = mockAnnouncementService.getAnnouncementById(id);
    if (!current) return { ok: false, error: 'Announcement not found.' };
    if (!['draft', 'scheduled', 'cancelled'].includes(current.status)) return { ok: false, error: 'Only draft, scheduled, or cancelled announcements can be edited in this prototype.' };
    const validation = mockAnnouncementService.validateAnnouncement(data, current.id, current.status === 'scheduled' ? 'schedule' : 'draft');
    if (!validation.ok || !validation.data) return { ok: false, error: validation.error };
    const form = validation.data;
    const updated = patchAnnouncement(current.id, {
      ...form,
      slug: slugify(form.slug || form.title),
      publishAt: form.publishAt || undefined,
      expiresAt: form.expiresAt || undefined,
      recipientEstimate: mockAnnouncementService.estimateAudience(form.targetAudience).count,
      updatedBy: 'platform_owner'
    });
    addHistory(current.id, 'Updated', `${updated.announcementNumber} content or targeting updated.`);
    return { ok: true, data: updated };
  },
  duplicateAnnouncement: (id: string): AnnouncementResult<Announcement> => {
    const source = mockAnnouncementService.getAnnouncementById(id);
    if (!source) return { ok: false, error: 'Announcement not found.' };
    const records = mockAnnouncementService.listAnnouncements();
    const copy: Announcement = { ...source, id: makeId('ANN'), announcementNumber: `ANN-${String(records.length + 1).padStart(6, '0')}`, title: `${source.title} Copy`, slug: `${source.slug}-copy-${records.length + 1}`, status: 'draft', publishAt: undefined, publishedAt: undefined, cancelledAt: undefined, archivedAt: undefined, createdAt: today(), updatedAt: today(), deliveryCount: 0, readCount: 0, acknowledgementCount: 0 };
    writeAnnouncements([copy, ...records]);
    addHistory(copy.id, 'Duplicated', `Copied from ${source.announcementNumber}.`);
    return { ok: true, data: copy };
  },
  previewAnnouncement: (data: Partial<AnnouncementFormData>) => ({ ...buildFormData(data), recipientEstimate: mockAnnouncementService.estimateAudience(buildFormData(data).targetAudience).count, audienceLabel: audienceLabel(buildFormData(data).targetAudience) }),
  estimateAudience: (audience: AnnouncementAudience) => {
    const recipients = mockAnnouncementService.resolveAudienceRecipients(audience);
    return { count: recipients.length, label: audienceLabel(audience), recipients };
  },
  resolveAudienceRecipients: (audience: AnnouncementAudience): AudienceResolutionRecipient[] => {
    const subscribers = subscriberMap();
    const users = activeUsers();
    const activeSubscriberIds = new Set(activeSubscribers().map(item => item.id));
    const subscriptions = mockSubscriptionService.listSubscriptions();
    const add = new Map<string, AudienceResolutionRecipient>();
    const addUsers = (items: PlatformUser[]) => items.filter(user => !user.subscriberId || activeSubscriberIds.has(user.subscriberId)).forEach(user => add.set(user.id, recipientFromUser(user, subscribers)));
    if (audience.mode === 'all_platform_users') addUsers(users);
    if (audience.mode === 'all_subscribers') addUsers(users.filter(user => user.subscriberId && activeSubscriberIds.has(user.subscriberId)));
    if (audience.mode === 'subscriber_status') {
      const ids = new Set(mockPlatformManagementService.listSubscribers().filter(item => audience.subscriberStatuses.includes(item.accountStatus)).map(item => item.id));
      addUsers(users.filter(user => user.subscriberId && ids.has(user.subscriberId)));
    }
    if (audience.mode === 'subscription_plan') {
      const ids = new Set(subscriptions.filter((item: any) => audience.planIds.includes(item.planId)).map((item: any) => item.subscriberId));
      addUsers(users.filter(user => user.subscriberId && ids.has(user.subscriberId)));
    }
    if (audience.mode === 'subscription_status') {
      const ids = new Set(subscriptions.filter((item: any) => audience.subscriptionStatuses.includes(item.status as never)).map((item: any) => item.subscriberId));
      addUsers(users.filter(user => user.subscriberId && ids.has(user.subscriberId)));
    }
    if (audience.mode === 'specific_subscribers') addUsers(users.filter(user => user.subscriberId && audience.subscriberIds.includes(user.subscriberId)));
    if (audience.mode === 'specific_users') addUsers(users.filter(user => audience.userIds.includes(user.id)));
    if (audience.mode === 'user_roles') addUsers(users.filter(user => audience.userRoles.includes(user.role)));
    if (audience.mode === 'clinics') {
      const userIds = new Set(audience.clinicIds.flatMap(clinicId => mockClinicService.getClinicUsers(clinicId).map(user => user.id)));
      addUsers(users.filter(user => userIds.has(user.id)));
    }
    if (audience.mode === 'laboratories') {
      const subscriberIds = new Set(mockLaboratoryService.listLaboratories().filter(lab => audience.laboratoryIds.includes(lab.id)).map(lab => lab.subscriberId));
      addUsers(users.filter(user => user.subscriberId && subscriberIds.has(user.subscriberId)));
    }
    return [...add.values()];
  },
  publishAnnouncement: (id: string): AnnouncementResult<Announcement> => {
    const announcement = mockAnnouncementService.getAnnouncementById(id);
    if (!announcement) return { ok: false, error: 'Announcement not found.' };
    if (announcement.status === 'archived') return { ok: false, error: 'Archived announcements cannot be published directly.' };
    const validation = mockAnnouncementService.validateAnnouncement(announcement, announcement.id, 'publish');
    if (!validation.ok) return { ok: false, error: validation.error };
    const updated = patchAnnouncement(announcement.id, { status: 'published', publishedAt: announcement.publishedAt || nowIso(), publishedBy: 'platform_owner' });
    const reconciled = mockAnnouncementService.reconcileAnnouncementRecipients(updated.id) || updated;
    addHistory(updated.id, 'Published', `${updated.announcementNumber} published with ${reconciled.recipientEstimate} recipient(s).`);
    logActivity('Announcement Published', updated.title);
    mockNotificationService.createSystemNotification({ eventKey: `announcement-published-${updated.id}`, category: 'system', title: 'Scheduled announcement published', message: `${updated.title} is now published in the mock prototype.`, priority: 'normal', actionUrl: `/platform/announcements/${updated.id}`, sourceModule: 'announcements', sourceRecordId: updated.id });
    return { ok: true, data: reconciled };
  },
  scheduleAnnouncement: (id: string, publishAt: string): AnnouncementResult<Announcement> => {
    const announcement = mockAnnouncementService.getAnnouncementById(id);
    if (!announcement) return { ok: false, error: 'Announcement not found.' };
    if (new Date(publishAt) <= new Date()) return { ok: false, error: 'Scheduled publish date must be in the future.' };
    const updated = patchAnnouncement(announcement.id, { status: 'scheduled', publishAt, cancelledAt: undefined });
    addHistory(updated.id, 'Scheduled', `${updated.announcementNumber} scheduled for ${new Date(publishAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}.`);
    return { ok: true, data: updated };
  },
  processScheduledAnnouncements: () => mockAnnouncementService.listAnnouncements().filter(item => item.status === 'scheduled' && item.publishAt && new Date(item.publishAt) <= new Date()).map(item => mockAnnouncementService.publishAnnouncement(item.id)),
  cancelScheduledAnnouncement: (id: string): AnnouncementResult<Announcement> => {
    const announcement = mockAnnouncementService.getAnnouncementById(id);
    if (!announcement) return { ok: false, error: 'Announcement not found.' };
    if (announcement.status !== 'scheduled') return { ok: false, error: 'Only scheduled announcements can be cancelled.' };
    const updated = patchAnnouncement(announcement.id, { status: 'cancelled', cancelledAt: nowIso(), cancelledBy: 'platform_owner' });
    addHistory(updated.id, 'Cancelled', `${updated.announcementNumber} schedule cancelled; no recipient notifications were generated.`);
    return { ok: true, data: updated };
  },
  unpublishAnnouncement: (id: string): AnnouncementResult<Announcement> => {
    const announcement = mockAnnouncementService.getAnnouncementById(id);
    if (!announcement) return { ok: false, error: 'Announcement not found.' };
    if (announcement.status !== 'published') return { ok: false, error: 'Only published announcements can be unpublished.' };
    const updated = patchAnnouncement(announcement.id, { status: 'draft', publishedAt: undefined, publishedBy: undefined });
    addHistory(updated.id, 'Unpublished', `${updated.announcementNumber} returned to draft. Existing mock read records are retained for audit.`);
    return { ok: true, data: updated };
  },
  expireAnnouncements: () => mockAnnouncementService.listAnnouncements().filter(item => item.status === 'published' && item.expiresAt && new Date(item.expiresAt) < new Date()).map(item => patchAnnouncement(item.id, { status: 'expired' })),
  archiveAnnouncement: (id: string): AnnouncementResult<Announcement> => {
    const announcement = mockAnnouncementService.getAnnouncementById(id);
    if (!announcement) return { ok: false, error: 'Announcement not found.' };
    const updated = patchAnnouncement(announcement.id, { status: 'archived', archivedAt: nowIso(), archivedBy: 'platform_owner' });
    addHistory(updated.id, 'Archived', `${updated.announcementNumber} archived.`);
    return { ok: true, data: updated };
  },
  restoreAnnouncement: (id: string): AnnouncementResult<Announcement> => {
    const announcement = mockAnnouncementService.getAnnouncementById(id);
    if (!announcement) return { ok: false, error: 'Announcement not found.' };
    const updated = patchAnnouncement(announcement.id, { status: 'draft', archivedAt: undefined, archivedBy: undefined });
    addHistory(updated.id, 'Restored', `${updated.announcementNumber} restored to draft.`);
    return { ok: true, data: updated };
  },
  permanentlyDeleteUnusedDraft: (id: string): AnnouncementResult<boolean> => {
    const announcement = mockAnnouncementService.getAnnouncementById(id);
    if (!announcement) return { ok: false, error: 'Announcement not found.' };
    if (announcement.status !== 'draft') return { ok: false, error: 'Only unused drafts can be deleted.' };
    if (readRecipients().some(item => item.announcementId === announcement.id)) return { ok: false, error: 'Draft has recipient records and cannot be deleted.' };
    writeAnnouncements(mockAnnouncementService.listAnnouncements().filter(item => item.id !== announcement.id));
    addHistory(announcement.id, 'Deleted', `${announcement.announcementNumber} permanently deleted.`);
    return { ok: true, data: true };
  },
  getAnnouncementRecipients: (announcementId: string) => {
    const notifications = mockNotificationService.listNotifications();
    let changed = false;
    const next = readRecipients().map(recipient => {
      if (recipient.announcementId !== announcementId || recipient.readAt) return recipient;
      const notification = recipient.notificationId ? notifications.find(item => item.id === recipient.notificationId) : undefined;
      if (notification?.readAt || notification?.status === 'read') {
        changed = true;
        return { ...recipient, readAt: notification.readAt || nowIso() };
      }
      return recipient;
    });
    if (changed) writeRecipients(next);
    return next.filter(item => item.announcementId === announcementId);
  },
  getAnnouncementAnalytics: (announcementId: string) => {
    const recipients = mockAnnouncementService.getAnnouncementRecipients(announcementId);
    const delivered = recipients.filter(item => ['generated', 'delivered_in_app'].includes(item.deliveryStatus)).length;
    const read = recipients.filter(item => item.readAt).length;
    const acknowledged = recipients.filter(item => item.acknowledgedAt).length;
    return { recipients: recipients.length, delivered, unread: Math.max(0, delivered - read), read, acknowledged, readRate: delivered ? Math.round((read / delivered) * 100) : 0, acknowledgementRate: delivered ? Math.round((acknowledged / delivered) * 100) : 0 };
  },
  acknowledgeAnnouncement: (announcementId: string, userId: string) => {
    const existing = readRecipients();
    const match = existing.some(item => item.announcementId === announcementId && item.userId === userId);
    let next;
    if (match) {
      next = existing.map(item => item.announcementId === announcementId && item.userId === userId ? { ...item, acknowledgedAt: nowIso(), readAt: item.readAt || nowIso() } : item);
    } else {
      next = [{
        id: makeId('AR'),
        announcementId,
        userId,
        deliveryChannel: 'in_app' as const,
        deliveryStatus: 'delivered_in_app' as const,
        generatedAt: nowIso(),
        deliveredAt: nowIso(),
        readAt: nowIso(),
        acknowledgedAt: nowIso()
      }, ...existing];
    }
    writeRecipients(next);
    return reconcileCounts(announcementId);
  },
  dismissAnnouncement: (announcementId: string, userId: string) => {
    const existing = readRecipients();
    const match = existing.some(item => item.announcementId === announcementId && item.userId === userId);
    let next;
    if (match) {
      next = existing.map(item => item.announcementId === announcementId && item.userId === userId ? { ...item, dismissedAt: nowIso() } : item);
    } else {
      next = [{
        id: makeId('AR'),
        announcementId,
        userId,
        deliveryChannel: 'in_app' as const,
        deliveryStatus: 'delivered_in_app' as const,
        generatedAt: nowIso(),
        deliveredAt: nowIso(),
        readAt: nowIso(),
        dismissedAt: nowIso()
      }, ...existing];
    }
    writeRecipients(next);
    return reconcileCounts(announcementId);
  },
  reconcileAnnouncementRecipients: (announcementId: string) => {
    const announcement = mockAnnouncementService.getAnnouncementById(announcementId);
    if (!announcement || announcement.status !== 'published') return announcement || null;
    const resolved = mockAnnouncementService.resolveAudienceRecipients(announcement.targetAudience);
    const existing = readRecipients();
    const existingKeys = new Set(existing.map(item => `${item.announcementId}-${item.userId}-${item.deliveryChannel}`));
    const created: AnnouncementRecipient[] = [];
    resolved.forEach(recipient => {
      announcement.deliveryChannels.forEach((channel: DeliveryChannel) => {
        const key = `${announcement.id}-${recipient.userId}-${channel}`;
        if (existingKeys.has(key)) return;
        const notification = channel === 'in_app'
          ? mockNotificationService.createAnnouncementNotification(announcement.id, recipient.userId, recipient.subscriberId, announcement.title, announcement.summary, announcement.priority as NotificationPriority, `/platform/announcements/${announcement.id}`)
          : { ok: false, error: 'Prototype placeholder only.' };
        created.push({
          id: makeId('AR'),
          announcementId: announcement.id,
          userId: recipient.userId,
          subscriberId: recipient.subscriberId,
          deliveryChannel: channel,
          deliveryStatus: channel === 'in_app' && notification.ok ? 'delivered_in_app' : 'generated',
          notificationId: notification.data?.id,
          generatedAt: nowIso(),
          deliveredAt: channel === 'in_app' && notification.ok ? nowIso() : undefined,
          failureReason: channel === 'in_app' ? notification.error : 'Prototype Placeholder - No real message will be sent.'
        });
      });
    });
    if (created.length) writeRecipients([...created, ...existing]);
    return reconcileCounts(announcement.id);
  },
  searchAnnouncements: (records: Announcement[], search: string) => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter(item => [item.announcementNumber, item.title, item.slug, item.summary, item.announcementType, item.status].some(value => String(value).toLowerCase().includes(term)));
  },
  filterAnnouncements: (records: Announcement[], filters: AnnouncementFilters) => {
    let next = mockAnnouncementService.searchAnnouncements(records, filters.search);
    if (filters.tab !== 'all') next = next.filter(item => item.status === filters.tab);
    if (filters.announcementType !== 'all') next = next.filter(item => item.announcementType === filters.announcementType);
    if (filters.priority !== 'all') next = next.filter(item => item.priority === filters.priority);
    if (filters.status !== 'all') next = next.filter(item => item.status === filters.status);
    if (filters.audienceType !== 'all') next = next.filter(item => item.targetAudience.mode === filters.audienceType);
    if (filters.publishDate) next = next.filter(item => (item.publishAt || item.publishedAt || '').startsWith(filters.publishDate));
    if (filters.expirationDate) next = next.filter(item => (item.expiresAt || '').startsWith(filters.expirationDate));
    if (filters.requiresAcknowledgement !== 'all') next = next.filter(item => String(item.requiresAcknowledgement) === filters.requiresAcknowledgement);
    return next;
  },
  sortAnnouncements: (records: Announcement[], sort: AnnouncementSort) => [...records].sort((a, b) => String(a[sort.field] ?? '').localeCompare(String(b[sort.field] ?? '')) * (sort.direction === 'asc' ? 1 : -1)),
  paginateAnnouncements: (records: Announcement[], page: number, pageSize: number) => records.slice((page - 1) * pageSize, page * pageSize),
  getAudienceLabel: audienceLabel,
  getAnnouncementSummary: () => {
    const records = mockAnnouncementService.listAnnouncements();
    const recipients = readRecipients();
    return { total: records.length, draft: records.filter(item => item.status === 'draft').length, scheduled: records.filter(item => item.status === 'scheduled').length, published: records.filter(item => item.status === 'published').length, urgent: records.filter(item => item.priority === 'urgent').length, expired: records.filter(item => item.status === 'expired').length, archived: records.filter(item => item.status === 'archived').length, totalRecipients: recipients.length, unreadDeliveries: recipients.filter(item => ['generated', 'delivered_in_app'].includes(item.deliveryStatus) && !item.readAt).length };
  }
};
