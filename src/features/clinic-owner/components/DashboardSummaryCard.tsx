import type { ComponentType } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string }>;
  trend?: string;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function DashboardSummaryCard({ label, value, icon: Icon, trend, status = 'neutral' }: Props) {
  return (
    <div className={`metric-card ${status}`} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '1.5rem',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-sm)',
      transition: 'var(--transition)',
      height: '110px'
    }}>
      <div className="metric-card-icon" style={{
        padding: '0.75rem',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--background)'
      }}>
        <Icon size={22} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</span>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</strong>
        {trend && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{trend}</span>}
      </div>
    </div>
  );
}
