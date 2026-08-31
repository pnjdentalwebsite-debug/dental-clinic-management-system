import { useMemo, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react';
import type { ClinicOwnerBootstrap } from '../../../infrastructure/supabase/clinicOwnerApi';

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  icon: any;
  color: string;
}

interface ActivityFeedProps {
  events: ClinicOwnerBootstrap['auditEvents'];
}

function humanize(value: string) {
  return value
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Activity Recorded';
}

function formatTimestamp(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'Time unavailable';
  return new Date(parsed).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const itemsPerPage = 5;

  const activities: ActivityFeedItem[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      timestamp: formatTimestamp(event.createdAt),
      event: humanize(event.eventType),
      details: `${humanize(event.entityType)} event recorded in the authenticated organization scope.`,
      icon: Activity,
      color: '#3b82f6',
    }));
  }, [events]);

  const previewActivities = activities.slice(0, 5);
  const totalModalPages = Math.ceil(activities.length / itemsPerPage) || 1;
  const modalActivities = activities.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);

  const openModal = () => {
    setModalPage(1);
    setModalOpen(true);
  };

  return (
    <>
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: 'var(--card-pad)',
          borderRadius: 'var(--radius-lg)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Activity size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</h3>
          </div>
          {activities.length > 0 && (
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
              View All ({activities.length})
            </button>
          )}
        </div>

        {/* Timeline container */}
        <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
          {/* Vertical line */}
          <div
            style={{
              position: 'absolute',
              left: '7px',
              top: '8px',
              bottom: '12px',
              width: '2px',
              backgroundColor: 'var(--border)'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {previewActivities.length === 0 && (
              <div style={{ marginLeft: '-1.5rem', padding: '1rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <strong style={{ display: 'block', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No recent activity</strong>
                No RLS-visible audit events are available for this organization.
              </div>
            )}
            {previewActivities.map((act, index) => {
              const Icon = act.icon;
              const isLastItem = index === previewActivities.length - 1 && activities.length > 5;

              return (
                <div
                  key={act.id}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    position: 'relative',
                    opacity: isLastItem ? 0.45 : 1,
                    filter: isLastItem ? 'blur(0.8px)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: '-1.85rem',
                      top: '3px',
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--card-bg)',
                      border: `3px solid ${act.color}`,
                      zIndex: 2
                    }}
                  />

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', width: '100%' }}>
                    <div
                      style={{
                        padding: '0.4rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: `${act.color}15`,
                        color: act.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <Icon size={14} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{act.event}</strong>
                        <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{act.timestamp}</small>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>{act.details}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Gradient Fade & View More Overlay */}
          {activities.length > 5 && (
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
                + {activities.length - 4} More Activities &bull; View All
              </button>
            </div>
          )}
        </div>
      </div>

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
                    Complete chronological history ({activities.length} total events)
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
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, minHeight: '340px' }}>
              <div style={{ position: 'relative', paddingLeft: '1.5rem' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '7px',
                    top: '8px',
                    bottom: '12px',
                    width: '2px',
                    backgroundColor: 'var(--border)'
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                  {modalActivities.map((act) => {
                    const Icon = act.icon;
                    return (
                      <div key={act.id} style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
                        <div
                          style={{
                            position: 'absolute',
                            left: '-1.85rem',
                            top: '3px',
                            width: '15px',
                            height: '15px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--card-bg)',
                            border: `3px solid ${act.color}`,
                            zIndex: 2
                          }}
                        />

                        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', width: '100%' }}>
                          <div
                            style={{
                              padding: '0.45rem',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: `${act.color}15`,
                              color: act.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            <Icon size={16} />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                              <strong style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{act.event}</strong>
                              <small style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{act.timestamp}</small>
                            </div>
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{act.details}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                Page {modalPage} of {totalModalPages} ({activities.length} total events)
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
