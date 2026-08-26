import { ArrowLeft } from 'lucide-react';
import { ConfirmationDialog } from '../../../components/overlays/ConfirmationDialog';
import { useState } from 'react';
import { AnnouncementForm } from '../components/AnnouncementForm';
import { mockAnnouncementService } from '../services/mockAnnouncementService';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import type { AnnouncementFormData } from '../types';

interface Props {
  announcementId?: string;
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function AnnouncementFormPage({ announcementId, navigate, showToast }: Props) {
  const existing = announcementId ? mockAnnouncementService.getAnnouncementById(announcementId) : null;
  const [pending, setPending] = useState<{ data: AnnouncementFormData; mode: 'draft' | 'publish' | 'schedule' } | null>(null);
  const isEdit = Boolean(announcementId);

  if (announcementId && !existing) {
    return (
      <main className="main-content">
        <div className="dashboard-panel empty-state">
          <h1>Announcement not found</h1>
          <p>This announcement record is not available in system storage.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => navigate('/platform/announcements')}>
            Back to Announcements
          </button>
        </div>
      </main>
    );
  }

  const save = (data: AnnouncementFormData, mode: 'draft' | 'publish' | 'schedule') => {
    if (mode === 'publish' || mode === 'schedule') {
      setPending({ data, mode });
      return;
    }
    const result = existing ? mockAnnouncementService.updateAnnouncement(existing.id, data) : mockAnnouncementService.createAnnouncement(data, 'draft');
    if (!result.ok || !result.data) showToast(result.error || 'Could not save announcement.', 'error');
    else {
      showToast('Announcement draft saved.', 'success');
      navigate(`/platform/announcements/${result.data.id}`);
    }
  };

  const confirm = () => {
    if (!pending) return;
    let result;
    if (existing) {
      const update = mockAnnouncementService.updateAnnouncement(existing.id, pending.data);
      result = update.ok && update.data
        ? pending.mode === 'publish'
          ? mockAnnouncementService.publishAnnouncement(update.data.id)
          : mockAnnouncementService.scheduleAnnouncement(update.data.id, pending.data.publishAt)
        : update;
    } else {
      result = mockAnnouncementService.createAnnouncement(pending.data, pending.mode);
    }
    if (!result.ok || !result.data) showToast(result.error || 'Could not complete announcement action.', 'error');
    else {
      showToast(pending.mode === 'publish' ? 'Announcement broadcast published and in-app notifications generated.' : 'Announcement scheduled.', 'success');
      navigate(`/platform/announcements/${result.data.id}`);
    }
    setPending(null);
  };

  const count = pending ? mockAnnouncementService.estimateAudience(pending.data.targetAudience).count : 0;

  return (
    <main className="main-content" style={{ paddingBottom: '3rem' }}>
      <PlatformPageHeader
        title={isEdit ? `Edit Announcement: ${existing?.title}` : 'Create System Announcement'}
        subtitle="Compose broadcast copy, select 1-click templates, target clinic audiences, and schedule platform notifications."
        breadcrumbs={['Platform', 'System', 'Announcements', isEdit ? 'Edit' : 'New']}
        secondaryAction={{
          label: 'Back to Announcements',
          icon: ArrowLeft,
          onClick: () => navigate('/platform/announcements')
        }}
      />
      <AnnouncementForm
        initial={existing}
        onCancel={() => navigate(existing ? `/platform/announcements/${existing.id}` : '/platform/announcements')}
        onSave={save}
      />
      <ConfirmationDialog
        open={Boolean(pending)}
        title={pending?.mode === 'publish' ? 'Publish announcement now?' : 'Schedule announcement?'}
        description={`${count} recipient(s) are resolved. In-app notifications are generated idempotently; email, SMS, and push settings remain prototype placeholders.`}
        confirmLabel={pending?.mode === 'publish' ? 'Publish Now' : 'Schedule'}
        onCancel={() => setPending(null)}
        onConfirm={confirm}
      />
    </main>
  );
}
