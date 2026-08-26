export function NotificationPreferencePanel() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
        <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
        <div>
          <strong>Email Notifications</strong>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Receive daily and monthly operational summaries via email.</span>
        </div>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
        <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
        <div>
          <strong>System Alerts</strong>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Get notified on system updates, backup runs, and alerts.</span>
        </div>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
        <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
        <div>
          <strong>Report Notifications</strong>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alert when new analytical audits are compiled.</span>
        </div>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
        <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
        <div>
          <strong>Staff Activity Updates</strong>
          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Realtime logs of staff shifts and practitioner changes.</span>
        </div>
      </label>
    </div>
  );
}
