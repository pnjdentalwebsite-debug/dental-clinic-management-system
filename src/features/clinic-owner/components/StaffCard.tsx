import { StaffStatusBadge } from './StaffStatusBadge';

interface StaffItem {
  id: string;
  name: string;
  role: string;
  branch: string;
  contact: string;
  status: string;
  joined: string;
}

interface Props {
  staff: StaffItem;
  onAction: (action: string, staff: StaffItem) => void;
}

export function StaffCard({ staff, onAction }: Props) {
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
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>{staff.name}</strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{staff.role}</span>
        </div>
        <StaffStatusBadge status={staff.status} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span><strong>Branch:</strong> {staff.branch}</span>
        <span><strong>Contact:</strong> {staff.contact}</span>
        <span><strong>Joined:</strong> {staff.joined}</span>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => onAction('View Profile', staff)}
        >
          Profile
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
          onClick={() => onAction('Change Role', staff)}
        >
          Change Role
        </button>
      </div>
    </div>
  );
}
