import { ClinicLaboratoryStatusBadge } from './ClinicLaboratoryStatusBadge';

interface LabItem {
  id: string;
  name: string;
  type: string;
  location: string;
  services: string;
  status: string;
  turnaroundTime: string;
}

interface Props {
  lab: LabItem;
  onAction: (action: string, lab: LabItem) => void;
}

export function ClinicLaboratoryCard({ lab, onAction }: Props) {
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
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{lab.name}</strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lab.type}</span>
        </div>
        <ClinicLaboratoryStatusBadge status={lab.status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span><strong>Location:</strong> {lab.location}</span>
        <span><strong>Services:</strong> {lab.services}</span>
        <span><strong>Turnaround:</strong> {lab.turnaroundTime}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => onAction('View Details', lab)}
        >
          Details
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => onAction('Manage Services', lab)}
        >
          Services
        </button>
      </div>
    </div>
  );
}
