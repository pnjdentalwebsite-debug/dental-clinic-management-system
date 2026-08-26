import { Award, Clock, FlaskConical, MapPin, Pencil, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ClinicLaboratoryStatusBadge } from './ClinicLaboratoryStatusBadge';

export interface LabRecordDetails {
  id: string;
  name: string;
  type: string;
  location: string;
  services: string;
  status: string;
  turnaroundTime: string;
  rawStatus?: string;
  contact?: string;
  email?: string;
}

interface Props {
  lab: LabRecordDetails | null;
  onClose: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onManageServices?: () => void;
}

export function ClinicLaboratoryProfilePreview({ lab, onClose, onView, onEdit, onManageServices }: Props) {
  if (!lab) {
    return (
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: 'var(--card-pad)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: '340px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          gap: '0.9rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)'
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <FlaskConical size={28} style={{ opacity: 0.6 }} />
        </div>
        <div>
          <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '0.2rem' }}>
            No Laboratory Selected
          </strong>
          <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '200px' }}>
            Select a dental laboratory from the directory to inspect services and details.
          </p>
        </div>
      </div>
    );
  }

  const initials = lab.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase() || 'LB';

  const serviceList = lab.services ? lab.services.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div
      className="dashboard-panel"
      style={{
        margin: 0,
        padding: 'var(--card-pad)',
        borderRadius: 'var(--radius-lg)',
        position: 'relative',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close laboratory preview"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: '4px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={18} />
      </button>

      {/* Top Header Card */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(2,132,199,0.14), rgba(147,51,234,0.14))',
            color: '#0284c7',
            border: '2px solid rgba(2, 132, 199, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            fontWeight: 800
          }}
        >
          {initials}
        </div>
        <div style={{ textAlign: 'center', display: 'grid', gap: '0.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{lab.name}</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {lab.type}
          </span>
        </div>
        <ClinicLaboratoryStatusBadge status={lab.status} />
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.85rem' }}>
        <Detail icon={MapPin} label="Laboratory Location" value={lab.location || 'Not specified'} />
        <Detail icon={Clock} label="Turnaround Time" value={lab.turnaroundTime || '3-5 Days'} />
        
        {/* Services Badges */}
        {serviceList.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Award size={16} style={{ color: '#0284c7', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Available Services</div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {serviceList.map((srv) => (
                  <span
                    key={srv}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                      background: 'rgba(2, 132, 199, 0.08)',
                      color: '#0284c7',
                      border: '1px solid rgba(2, 132, 199, 0.2)'
                    }}
                  >
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
        {onManageServices && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            onClick={onManageServices}
          >
            <FlaskConical size={15} /> Manage Services
          </button>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1, minWidth: '110px', height: '36px', fontSize: '0.82rem' }}
            onClick={onView}
          >
            View Details
          </button>
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1, minWidth: '110px', height: '36px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            onClick={onEdit}
          >
            <Pencil size={13} /> Edit Lab
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <Icon size={16} style={{ color: '#0284c7', marginTop: '2px', flexShrink: 0 }} />
      <div style={{ wordBreak: 'break-word' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</div>
        <strong style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.84rem' }}>{value}</strong>
      </div>
    </div>
  );
}
