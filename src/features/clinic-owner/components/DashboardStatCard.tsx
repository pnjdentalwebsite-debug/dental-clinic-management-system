import type { ComponentType } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: ComponentType<{ size?: number; className?: string }>;
  trend?: string;
  status?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function DashboardStatCard({ label, value, icon: Icon, trend, status = 'neutral' }: Props) {
  return (
    <div className={`metric-card ${status}`} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="metric-card-icon" style={{ padding: '0.75rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} />
      </div>
      <div className="metric-card-details" style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="metric-card-label" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{label}</span>
        <strong className="metric-card-value" style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, margin: '0.125rem 0', color: 'var(--text-primary)' }}>{value}</strong>
        {trend && <span className="metric-card-trend" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{trend}</span>}
      </div>
    </div>
  );
}
