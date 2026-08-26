import { Building, ArrowRight } from 'lucide-react';

interface BranchProps {
  name: string;
  location: string;
  status: string;
  contact: string;
  hours: string;
  onEnter: () => void;
}

export function ClinicBranchCard({ name, location, status, contact, hours, onEnter }: BranchProps) {
  const isActive = status.toLowerCase() === 'active';

  return (
    <div style={{
      padding: '1.5rem',
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1.25rem',
      transition: 'var(--transition)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
        <div style={{
          padding: '0.6rem',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Building size={18} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{name}</strong>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.1rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: isActive ? 'var(--success-light)' : 'var(--danger-light)',
              color: isActive ? 'var(--success)' : 'var(--danger)'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? 'var(--success)' : 'var(--danger)' }}></span>
              {status}
            </span>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Location: {location}</span>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Phone: {contact} | Hours: {hours}</span>
        </div>
      </div>
      <button
        type="button"
        className="btn btn-outline"
        style={{
          width: 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          fontSize: '0.8rem',
          padding: '0.5rem 1rem',
          height: '36px',
          borderRadius: 'var(--radius-sm)'
        }}
        onClick={onEnter}
      >
        <span>Enter Clinic Branch</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
