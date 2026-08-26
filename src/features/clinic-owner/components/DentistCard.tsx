import { DentistStatusBadge } from './DentistStatusBadge';

interface DentistItem {
  id: string;
  name: string;
  specialization: string;
  branch: string;
  contact: string;
  status: string;
  joined: string;
}

interface Props {
  dentist: DentistItem;
  onAction: (action: string, dentist: DentistItem) => void;
}

export function DentistCard({ dentist, onAction }: Props) {
  return (
    <div style={{
      padding: '1.25rem',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{dentist.name}</strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{dentist.specialization}</span>
        </div>
        <DentistStatusBadge status={dentist.status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span><strong>Branch:</strong> {dentist.branch}</span>
        <span><strong>Contact:</strong> {dentist.contact}</span>
        <span><strong>Joined:</strong> {dentist.joined}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => onAction('View Profile', dentist)}
        >
          Profile
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => onAction('Assign Branch', dentist)}
        >
          Assign Branch
        </button>
      </div>
    </div>
  );
}
