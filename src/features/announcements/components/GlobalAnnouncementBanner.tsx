import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Megaphone, 
  ShieldAlert, 
  X, 
  CheckCircle2, 
  Wrench, 
  CreditCard, 
  Sparkles, 
  ChevronRight,
  Info
} from 'lucide-react';
import { mockAnnouncementService } from '../services/mockAnnouncementService';
import type { Announcement, AnnouncementPriority, AnnouncementType } from '../types';

interface Props {
  userId?: string;
  userRole?: string;
  subscriberId?: string;
  clinicId?: string;
  planId?: string;
  currentRoute?: string;
  onNavigate?: (route: string) => void;
  showToast?: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const DISMISSED_KEY = 'pnj_dismissed_announcements';
const ACKNOWLEDGED_KEY = 'pnj_acknowledged_announcements';

const getStoredList = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredList = (key: string, ids: string[]) => {
  localStorage.setItem(key, JSON.stringify(ids));
};

const getCategoryIcon = (type: AnnouncementType) => {
  switch (type) {
    case 'maintenance': return Wrench;
    case 'emergency':
    case 'security': return ShieldAlert;
    case 'subscription':
    case 'payment': return CreditCard;
    case 'feature_release': return Sparkles;
    case 'policy':
    case 'service_update': return Info;
    default: return Megaphone;
  }
};

const getPriorityTheme = (priority: AnnouncementPriority) => {
  switch (priority) {
    case 'urgent':
      return {
        bg: '#fef2f2',
        border: '#fca5a5',
        text: '#991b1b',
        badgeBg: '#fee2e2',
        badgeColor: '#dc2626',
        btnBg: '#dc2626',
        btnColor: '#ffffff'
      };
    case 'high':
      return {
        bg: '#fff7ed',
        border: '#fdba74',
        text: '#9a3412',
        badgeBg: '#ffedd5',
        badgeColor: '#ea580c',
        btnBg: '#ea580c',
        btnColor: '#ffffff'
      };
    case 'normal':
      return {
        bg: '#eff6ff',
        border: '#bfdbfe',
        text: '#1e40af',
        badgeBg: '#dbeafe',
        badgeColor: '#2563eb',
        btnBg: '#2563eb',
        btnColor: '#ffffff'
      };
    case 'low':
    default:
      return {
        bg: '#f8fafc',
        border: '#cbd5e1',
        text: '#334155',
        badgeBg: '#e2e8f0',
        badgeColor: '#475569',
        btnBg: '#475569',
        btnColor: '#ffffff'
      };
  }
};

export function GlobalAnnouncementBanner({
  userId = 'usr-admin-1',
  userRole = 'platform_owner',
  currentRoute,
  onNavigate,
  showToast
}: Props) {
  const [version, setVersion] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => getStoredList(DISMISSED_KEY));
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>(() => getStoredList(ACKNOWLEDGED_KEY));
  const [detailModalAnnouncement, setDetailModalAnnouncement] = useState<Announcement | null>(null);

  // Periodic check & storage sync
  useEffect(() => {
    const handleStorage = () => setVersion(v => v + 1);
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(() => setVersion(v => v + 1), 5000);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Fetch all published active announcements
  const publishedAnnouncements = useMemo(() => {
    return mockAnnouncementService.listAnnouncements().filter(ann => {
      if (ann.status !== 'published') return false;
      if (ann.expiresAt && new Date(ann.expiresAt) < new Date()) return false;
      return true;
    });
  }, [version]);

  // Find active mandatory acknowledgement announcement that is not acknowledged yet
  const mandatoryAnnouncement = useMemo(() => {
    // Platform owner / developer managing platform console is not blocked by mandatory modal
    if (userRole === 'platform_owner') return null;

    for (const ann of publishedAnnouncements) {
      if (!ann.requiresAcknowledgement) continue;
      if (acknowledgedIds.includes(ann.id)) continue;
      if (dismissedIds.includes(ann.id)) continue;

      const recipients = mockAnnouncementService.getAnnouncementRecipients(ann.id);
      const userRec = recipients.find(r => r.userId === userId);
      // If user is a recipient and has acknowledged
      if (userRec && userRec.acknowledgedAt) {
        continue;
      }
      return ann;
    }
    return null;
  }, [publishedAnnouncements, userId, userRole, acknowledgedIds, dismissedIds, version]);

  // Find top featured or high-priority announcement for top banner
  const bannerAnnouncement = useMemo(() => {
    // Don't show top broadcast banner inside the Announcements Management pages if platform owner
    if (userRole === 'platform_owner' && currentRoute && currentRoute.startsWith('/platform/announcements')) {
      return null;
    }

    for (const ann of publishedAnnouncements) {
      if (dismissedIds.includes(ann.id)) continue;
      if (mandatoryAnnouncement?.id === ann.id) continue;
      if (ann.featured || ann.priority === 'urgent' || ann.priority === 'high') {
        return ann;
      }
    }
    return null;
  }, [publishedAnnouncements, dismissedIds, mandatoryAnnouncement, userRole, currentRoute]);

  const handleDismiss = useCallback((annId: string) => {
    const next = Array.from(new Set([...dismissedIds, annId]));
    setDismissedIds(next);
    saveStoredList(DISMISSED_KEY, next);
    mockAnnouncementService.dismissAnnouncement(annId, userId);
    setVersion(v => v + 1);
    if (showToast) {
      showToast('Announcement banner dismissed.', 'info');
    }
  }, [dismissedIds, userId, showToast]);

  const handleAcknowledge = useCallback((annId: string) => {
    const nextAck = Array.from(new Set([...acknowledgedIds, annId]));
    const nextDismiss = Array.from(new Set([...dismissedIds, annId]));
    setAcknowledgedIds(nextAck);
    setDismissedIds(nextDismiss);
    saveStoredList(ACKNOWLEDGED_KEY, nextAck);
    saveStoredList(DISMISSED_KEY, nextDismiss);
    mockAnnouncementService.acknowledgeAnnouncement(annId, userId);
    setVersion(v => v + 1);
    if (showToast) {
      showToast('Announcement acknowledged successfully.', 'success');
    }
  }, [acknowledgedIds, dismissedIds, userId, showToast]);

  return (
    <>
      {/* 1. TOP IN-APP BROADCAST BANNER */}
      {bannerAnnouncement && (
        <div style={{
          backgroundColor: getPriorityTheme(bannerAnnouncement.priority).bg,
          borderBottom: `1px solid ${getPriorityTheme(bannerAnnouncement.priority).border}`,
          color: getPriorityTheme(bannerAnnouncement.priority).text,
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.825rem',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          position: 'relative',
          zIndex: 40
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '280px' }}>
            {(() => {
              const Icon = getCategoryIcon(bannerAnnouncement.announcementType);
              return <Icon size={18} style={{ flexShrink: 0 }} />;
            })()}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.675rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: getPriorityTheme(bannerAnnouncement.priority).badgeBg,
                color: getPriorityTheme(bannerAnnouncement.priority).badgeColor,
                fontWeight: 700,
                textTransform: 'uppercase'
              }}>
                {bannerAnnouncement.priority}
              </span>

              <strong style={{ fontWeight: 700 }}>{bannerAnnouncement.title}</strong>
              <span style={{ opacity: 0.9 }}>— {bannerAnnouncement.summary}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setDetailModalAnnouncement(bannerAnnouncement)}
              style={{
                backgroundColor: 'transparent',
                border: `1px solid ${getPriorityTheme(bannerAnnouncement.priority).border}`,
                color: getPriorityTheme(bannerAnnouncement.priority).text,
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              Read Full Notice <ChevronRight size={12} />
            </button>

            <button
              type="button"
              onClick={() => handleDismiss(bannerAnnouncement.id)}
              aria-label="Dismiss banner"
              title="Dismiss announcement banner"
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: getPriorityTheme(bannerAnnouncement.priority).text,
                padding: '0.25rem',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: 0.8,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 2. MANDATORY ACKNOWLEDGEMENT OVERLAY MODAL */}
      {mandatoryAnnouncement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '2px solid #ef4444',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              backgroundColor: '#fef2f2',
              borderBottom: '1px solid #fecaca',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                  flexShrink: 0
                }}>
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{
                      fontSize: '0.675rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: '#fee2e2',
                      color: '#dc2626',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      MANDATORY SYSTEM NOTICE
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {mandatoryAnnouncement.announcementNumber}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#991b1b', margin: '0.2rem 0 0 0' }}>
                    {mandatoryAnnouncement.title}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleAcknowledge(mandatoryAnnouncement.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#991b1b',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px'
                }}
                title="Close / Proceed"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.75rem' }}>
                {mandatoryAnnouncement.summary}
              </div>

              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.825rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                color: '#1e293b'
              }}>
                {mandatoryAnnouncement.content}
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '8px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                fontSize: '0.75rem',
                color: '#92400e',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Info size={16} color="#d97706" style={{ flexShrink: 0 }} />
                <span>
                  This is a mandatory system advisory. You must acknowledge receipt to continue utilizing clinical and administrative features.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#fafafa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto', fontSize: '0.8rem', color: '#64748b' }}
                onClick={() => handleAcknowledge(mandatoryAnnouncement.id)}
              >
                Proceed / Dismiss
              </button>

              <button
                type="button"
                className="btn btn-primary"
                style={{
                  backgroundColor: '#dc2626',
                  borderColor: '#dc2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  width: 'auto'
                }}
                onClick={() => handleAcknowledge(mandatoryAnnouncement.id)}
              >
                <CheckCircle2 size={16} />
                I Acknowledge & Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. OPTIONAL DETAIL MODAL FOR READ FULL NOTICE */}
      {detailModalAnnouncement && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Megaphone size={18} color="#2563eb" />
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>Platform Announcement</strong>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalAnnouncement(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                {detailModalAnnouncement.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
                {detailModalAnnouncement.summary}
              </p>
              <div style={{
                padding: '1rem',
                borderRadius: '10px',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                color: '#1e293b'
              }}>
                {detailModalAnnouncement.content}
              </div>
            </div>

            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ width: 'auto', fontSize: '0.8rem', color: '#64748b' }}
                onClick={() => {
                  handleDismiss(detailModalAnnouncement.id);
                  setDetailModalAnnouncement(null);
                }}
              >
                Dismiss Top Banner
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {userRole === 'platform_owner' && onNavigate && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ width: 'auto', fontSize: '0.8rem', color: '#2563eb', borderColor: '#bfdbfe' }}
                    onClick={() => {
                      handleDismiss(detailModalAnnouncement.id);
                      setDetailModalAnnouncement(null);
                      onNavigate(`/platform/announcements/${detailModalAnnouncement.id}`);
                    }}
                  >
                    Open Record Details
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: 'auto', fontSize: '0.85rem' }}
                  onClick={() => setDetailModalAnnouncement(null)}
                >
                  Close Notice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
