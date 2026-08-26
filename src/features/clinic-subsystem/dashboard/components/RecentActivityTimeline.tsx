import { useState } from 'react';
import { Activity, BellRing, CalendarCheck2, ChevronLeft, ChevronRight, CreditCard, Sparkles, UserPlus, X } from 'lucide-react';
import { ActivityTimelineItem } from './ActivityTimelineItem';
import type { DashboardActivityTimelineItem } from '../dashboard.activity.mock';

interface Props {
  items: DashboardActivityTimelineItem[];
}

const iconMap = {
  patient: UserPlus,
  appointment: CalendarCheck2,
  recall: BellRing,
  payment: CreditCard
} as const;

export function RecentActivityTimeline({ items }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const itemsPerPage = 5;

  const activityIcons = ['patient', 'appointment', 'recall', 'payment'] as const;

  const previewItems = items.slice(0, 5);
  const totalModalPages = Math.ceil(items.length / itemsPerPage) || 1;
  const modalItems = items.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);

  const openModal = () => {
    setModalPage(1);
    setModalOpen(true);
  };

  return (
    <>
      <section
        className="dashboard-panel clinic-dashboard-panel clinic-activity-panel"
        aria-label="Recent activity timeline"
        style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Recent Activity
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Important branch events happening inside the clinic today.
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={openModal}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                width: 'auto'
              }}
            >
              <Sparkles size={13} style={{ color: 'var(--primary)' }} />
              View All ({items.length})
            </button>
          )}
        </div>

        <div className="clinic-activity-feed" style={{ position: 'relative' }}>
          {previewItems.map((item, index) => {
            const Icon = item.icon ?? iconMap[activityIcons[index] ?? 'payment'];
            const isLastItem = index === previewItems.length - 1 && items.length > 5;

            return (
              <div
                key={item.id}
                style={{
                  opacity: isLastItem ? 0.45 : 1,
                  filter: isLastItem ? 'blur(0.8px)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <ActivityTimelineItem
                  icon={Icon}
                  title={item.title}
                  description={item.description}
                  time={item.time}
                />
              </div>
            );
          })}

          {/* Bottom Gradient Fade & View More Overlay */}
          {items.length > 5 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '75px',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, var(--card-bg) 90%)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: '0.25rem',
                pointerEvents: 'none'
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={openModal}
                style={{
                  pointerEvents: 'auto',
                  padding: '0.35rem 0.95rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--card-bg)',
                  boxShadow: 'var(--shadow-md)',
                  borderRadius: '999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  width: 'auto'
                }}
              >
                + {items.length - 4} More Activities &bull; View All
              </button>
            </div>
          )}
        </div>
      </section>

      {/* View All Modal with Pagination (5 per page) */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1.5rem'
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '620px',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '85vh',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--background)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Activity size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Clinic Recent Activity Log
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Complete timeline for this branch ({items.length} total events)
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setModalOpen(false)}
                style={{
                  padding: '0.35rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '30px',
                  height: '30px',
                  minWidth: 'auto'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body - Activity List */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: '320px' }}>
              <div className="clinic-activity-feed">
                {modalItems.map((item, index) => {
                  const Icon = item.icon ?? iconMap[activityIcons[index] ?? 'payment'];

                  return (
                    <ActivityTimelineItem
                      key={item.id}
                      icon={Icon}
                      title={item.title}
                      description={item.description}
                      time={item.time}
                    />
                  );
                })}
              </div>
            </div>

            {/* Modal Footer with 5-per-page Pagination */}
            <div
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--background)'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Page {modalPage} of {totalModalPages} ({items.length} total events)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={modalPage <= 1}
                  onClick={() => setModalPage((p) => Math.max(1, p - 1))}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'auto' }}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={modalPage >= totalModalPages}
                  onClick={() => setModalPage((p) => Math.min(totalModalPages, p + 1))}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem', width: 'auto' }}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
