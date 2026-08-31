import { Circle } from 'lucide-react';

export function SetupProgressCard() {
  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Clinic Setup Progress</h3>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
        <Circle size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '1px' }} />
        <div>
          <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Setup progress unavailable</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4 }}>
            Authoritative master-file and personnel setup progress remains deferred to later Clinic Owner real-data cutovers.
          </span>
        </div>
      </div>
    </div>
  );
}
