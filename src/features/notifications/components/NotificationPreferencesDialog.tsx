import { 
  Lock, 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  CheckCheck, 
  RotateCcw,
  Info
} from 'lucide-react';
import { Modal } from '../../../components/overlays/Modal';
import { mockNotificationService } from '../services/mockNotificationService';
import type { NotificationCategory, NotificationPreference } from '../types';

interface Props {
  open: boolean;
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}

const categoryMeta: Record<NotificationCategory, { label: string; desc: string }> = {
  registration: { label: 'Registrations', desc: 'New dental subscriber registration signups' },
  subscriber: { label: 'Subscribers', desc: 'Subscriber account lifecycle & tier updates' },
  user: { label: 'Users', desc: 'Staff, dentist, and admin credential events' },
  plan: { label: 'Plans', desc: 'Pricing tier changes and quota configuration' },
  subscription: { label: 'Subscriptions', desc: 'Renewals, plan upgrades, and expirations' },
  payment: { label: 'Payments', desc: 'SaaS invoices, GCash/Card ledger transactions' },
  clinic: { label: 'Clinics', desc: 'Branch creations, operational chairs sync' },
  laboratory: { label: 'Laboratories', desc: 'Partner lab orders and work statuses' },
  announcement: { label: 'Announcements', desc: 'Broadcast notices and maintenance windows' },
  system: { label: 'System Alerts', desc: 'Storage capacity, database integrity & backups' },
  security: { label: 'Security Alerts', desc: 'Privileged operations & failed auth locks' },
  data_quality: { label: 'Data Quality', desc: 'Audit log integrity & validation anomalies' }
};

export function NotificationPreferencesDialog({ open, userId, onClose, onUpdated }: Props) {
  const preferences = mockNotificationService.getNotificationPreferences(userId);

  const update = (preference: NotificationPreference, patch: Partial<NotificationPreference>) => {
    mockNotificationService.updateNotificationPreferences(userId, preference.category, patch);
    onUpdated();
  };

  const setAllChannel = (channel: keyof NotificationPreference, enabled: boolean) => {
    preferences.forEach(p => {
      if (channel === 'inAppEnabled' && p.mandatory) return; // preserve mandatory security
      mockNotificationService.updateNotificationPreferences(userId, p.category, { [channel]: enabled });
    });
    onUpdated();
  };

  const resetDefaults = () => {
    preferences.forEach(p => {
      mockNotificationService.updateNotificationPreferences(userId, p.category, {
        inAppEnabled: true,
        emailPlaceholderEnabled: p.category === 'security' || p.category === 'payment',
        smsPlaceholderEnabled: p.category === 'security',
        pushPlaceholderEnabled: true
      });
    });
    onUpdated();
  };

  return (
    <Modal
      open={open}
      title="Multi-Channel Notification Matrix"
      description="Configure real-time delivery channels across all 12 platform domains. System security alerts enforce mandatory in-app delivery."
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            onClick={resetDefaults}
          >
            <RotateCcw size={13} /> Reset Policy Defaults
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: 'auto', padding: '0.45rem 1.25rem', fontSize: '0.85rem' }}
            onClick={onClose}
          >
            Save & Close
          </button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Compliance Ribbon */}
        <div style={{
          backgroundColor: '#eff6ff',
          borderRadius: '10px',
          border: '1px solid #bfdbfe',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          fontSize: '0.8rem',
          color: '#1e40af'
        }}>
          <Info size={18} style={{ flexShrink: 0, color: '#2563eb' }} />
          <div>
            <strong>Mandatory Delivery Policies Enforced:</strong> In-App delivery for <code style={{ fontFamily: 'monospace' }}>security</code>, <code style={{ fontFamily: 'monospace' }}>system</code>, and <code style={{ fontFamily: 'monospace' }}>data_quality</code> cannot be disabled to ensure full administrative audit compliance.
          </div>
        </div>

        {/* Quick Batch Selectors */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Quick Toggle:
          </span>
          <button
            type="button"
            className="btn btn-outline"
            style={{ height: '28px', padding: '0 0.55rem', fontSize: '0.75rem', borderRadius: '6px' }}
            onClick={() => setAllChannel('inAppEnabled', true)}
          >
            <Bell size={12} /> All In-App ON
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ height: '28px', padding: '0 0.55rem', fontSize: '0.75rem', borderRadius: '6px' }}
            onClick={() => setAllChannel('emailPlaceholderEnabled', true)}
          >
            <Mail size={12} /> All Email ON
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ height: '28px', padding: '0 0.55rem', fontSize: '0.75rem', borderRadius: '6px' }}
            onClick={() => setAllChannel('smsPlaceholderEnabled', true)}
          >
            <MessageSquare size={12} /> All SMS ON
          </button>
        </div>

        {/* 500px High-Density Table */}
        <div style={{
          maxHeight: '440px',
          overflowY: 'auto',
          border: '1px solid #e2e8f0',
          borderRadius: '10px'
        }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 5, borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontWeight: 700, color: '#475569' }}>System Domain</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', width: '90px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Bell size={13} color="#2563eb" /> In-App
                  </div>
                </th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', width: '90px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Mail size={13} color="#16a34a" /> Email
                  </div>
                </th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', width: '90px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <MessageSquare size={13} color="#7c3aed" /> SMS
                  </div>
                </th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#475569', width: '90px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                    <Smartphone size={13} color="#d97706" /> Push
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {preferences.map(preference => {
                const meta = categoryMeta[preference.category] || { label: preference.category, desc: '' };
                return (
                  <tr key={preference.category} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{meta.label}</strong>
                        {preference.mandatory && (
                          <span style={{
                            fontSize: '0.675rem',
                            fontWeight: 700,
                            padding: '0.1rem 0.4rem',
                            borderRadius: '4px',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.2rem'
                          }}>
                            <Lock size={10} /> Mandatory
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.725rem', color: '#64748b', display: 'block', marginTop: '0.15rem' }}>
                        {meta.desc}
                      </span>
                    </td>

                    {/* In-App Checkbox */}
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      {preference.mandatory ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', color: '#16a34a' }}>
                          <CheckCheck size={16} />
                          <Lock size={11} color="#dc2626" />
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={preference.inAppEnabled}
                          onChange={e => update(preference, { inAppEnabled: e.target.checked })}
                          aria-label={`${meta.label} In-App Delivery`}
                        />
                      )}
                    </td>

                    {/* Email Checkbox */}
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={preference.emailPlaceholderEnabled}
                        onChange={e => update(preference, { emailPlaceholderEnabled: e.target.checked })}
                        aria-label={`${meta.label} Email Delivery`}
                      />
                    </td>

                    {/* SMS Checkbox */}
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={preference.smsPlaceholderEnabled}
                        onChange={e => update(preference, { smsPlaceholderEnabled: e.target.checked })}
                        aria-label={`${meta.label} SMS Delivery`}
                      />
                    </td>

                    {/* Push Checkbox */}
                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
                      <input
                        type="checkbox"
                        checked={preference.pushPlaceholderEnabled}
                        onChange={e => update(preference, { pushPlaceholderEnabled: e.target.checked })}
                        aria-label={`${meta.label} Push Delivery`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}
