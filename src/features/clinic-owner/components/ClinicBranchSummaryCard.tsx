import type { ComponentType } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string }>;
  desc?: string;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function ClinicBranchSummaryCard({ label, value, icon: Icon, desc, status = 'neutral' }: Props) {
  return (
    <div className={`metric-card ${status}`} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.25rem',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      flex: 1,
      minWidth: '200px'
    }}>
      <div style={{
        padding: '0.6rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background)',
        color: status === 'success' ? 'var(--success)' : status === 'warning' ? 'var(--warning)' : 'var(--primary)'
      }}>
        <Icon size={20} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</span>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.1rem' }}>{value}</strong>
        {desc && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{desc}</span>}
      </div>
    </div>
  );
}
