import { ShieldCheck, Calendar } from 'lucide-react';

export function SecurityPreferenceCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <strong>Two-Factor Authentication (2FA)</strong>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Secure your clinic owner account with two-factor authentication codes.</span>
        <button type="button" className="btn btn-outline btn-sm" style={{ width: 'fit-content', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
          Enable 2FA
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <strong>Password Management</strong>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Change your account login credentials regularly.</span>
        <button type="button" className="btn btn-outline btn-sm" style={{ width: 'fit-content', padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
          Update Password
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
        <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Recent Login Activity</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          <span>Active Session: 120.28.191.10 (Quezon City, PH)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          <Calendar size={14} />
          <span>Logged in: July 28, 2026 at 12:05 AM</span>
        </div>
      </div>
    </div>
  );
}
