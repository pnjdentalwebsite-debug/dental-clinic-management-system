import type { ComponentType } from 'react';

interface Props {
  icon?: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ClinicOwnerEmptyState({ icon: Icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="dashboard-panel" style={{
      margin: 0,
      padding: '3rem 2rem',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      backgroundColor: 'var(--card-bg)',
      border: '1px dashed var(--border)',
      minHeight: '280px'
    }}>
      {Icon && (
        <div style={{
          padding: '0.75rem',
          borderRadius: '50%',
          backgroundColor: 'var(--background)',
          color: 'var(--text-muted)',
          marginBottom: '1rem',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={32} />
        </div>
      )}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1.5rem 0', maxWidth: '320px' }}>{description}</p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction} style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
