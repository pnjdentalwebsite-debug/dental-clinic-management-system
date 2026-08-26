import { ShieldAlert } from 'lucide-react';

interface Props {
  onBack?: () => void;
}

export function AccessDeniedState({ onBack }: Props) {
  return (
    <div className="dashboard-panel" style={{
      margin: 0,
      padding: '4rem 2rem',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border)',
      minHeight: '300px'
    }}>
      <div style={{
        padding: '0.75rem',
        borderRadius: '50%',
        backgroundColor: 'var(--danger-light)',
        color: 'var(--danger)',
        marginBottom: '1rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ShieldAlert size={32} />
      </div>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Access Restricted</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', maxWidth: '360px' }}>
        You do not have permission to view this section of the clinic console.
      </p>
      {onBack && (
        <button type="button" className="btn btn-outline" onClick={onBack} style={{ width: 'auto', padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
          Back to Dashboard
        </button>
      )}
    </div>
  );
}
