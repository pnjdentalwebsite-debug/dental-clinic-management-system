import { Calendar, CalendarDays, IdCard, MapPin, Pencil, Phone, Stethoscope, User, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DentistStatusBadge } from './DentistStatusBadge';
import type { AssociateDentistRecord } from '../types/associateDentists';

interface Props {
  dentist: AssociateDentistRecord | null;
  onClose: () => void;
  onView?: () => void;
  onEdit?: () => void;
}

export function DentistProfilePreview({ dentist, onClose, onView, onEdit }: Props) {
  if (!dentist) {
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
          <User size={28} style={{ opacity: 0.6 }} />
        </div>
        <div>
          <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '0.2rem' }}>
            No Dentist Selected
          </strong>
          <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '200px' }}>
            Select an associate dentist from the directory to inspect details.
          </p>
        </div>
      </div>
    );
  }

  const fullName = [dentist.firstName, dentist.middleName, dentist.lastName, dentist.extensionName]
    .filter(Boolean)
    .join(' ');

  const initials =
    `${dentist.firstName?.charAt(0) || ''}${dentist.lastName?.charAt(0) || ''}`.toUpperCase() ||
    'DR';

  const activeDays = dentist.workSchedule
    ? Object.entries(dentist.workSchedule)
        .filter(([_, val]) => val?.enabled)
        .map(([day]) => day.slice(0, 3))
    : [];

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
        aria-label="Close associate preview"
        style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px',
          borderRadius: '6px'
        }}
      >
        <X size={18} />
      </button>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '1.25rem',
          marginBottom: '1.25rem'
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '20px',
            background: dentist.calendarColor
              ? `linear-gradient(135deg, ${dentist.calendarColor}25, ${dentist.calendarColor}45)`
              : 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(20,184,166,0.14))',
            color: dentist.calendarColor || 'var(--primary)',
            border: `2px solid ${dentist.calendarColor ? dentist.calendarColor + '60' : 'rgba(99, 102, 241, 0.25)'}`,
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
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fullName}</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {dentist.associateNumber}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <DentistStatusBadge status={dentist.status} />
          {dentist.calendarColor && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px',
                background: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)'
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: dentist.calendarColor
                }}
              />
              Color Tag
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.85rem' }}>
        <Detail
          icon={Stethoscope}
          label="Designation & Specialization"
          value={`${dentist.designation || 'Associate'} • ${dentist.specialization || 'General Dentistry'}`}
        />
        <Detail icon={Phone} label="Mobile Number" value={dentist.mobileNumber || 'Not set'} />
        <Detail icon={MapPin} label="Clinic / Practice Address" value={dentist.address || 'Not set'} />
        <Detail
          icon={IdCard}
          label="License / PTR / S2"
          value={`PRC: ${dentist.licenseNumber || '—'} | PTR: ${dentist.ptrNumber || '—'} | S2: ${dentist.s2LicenseNumber || '—'}`}
        />
        {activeDays.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <CalendarDays size={16} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Weekly Schedule</div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {activeDays.map((d) => (
                  <span
                    key={d}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      color: 'var(--primary)'
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        <Detail
          icon={Calendar}
          label="Date Registered"
          value={
            dentist.createdAt
              ? !isNaN(Date.parse(dentist.createdAt))
                ? new Date(dentist.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })
                : dentist.createdAt
              : 'N/A'
          }
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-outline"
          style={{ flex: 1, minWidth: '120px', height: '38px', fontSize: '0.85rem' }}
          onClick={onView}
        >
          View Profile
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ flex: 1, minWidth: '120px', height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
          onClick={onEdit}
        >
          <Pencil size={14} /> Edit Associate
        </button>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <Icon size={16} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
      <div style={{ wordBreak: 'break-word' }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{label}</div>
        <strong style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.84rem' }}>{value}</strong>
      </div>
    </div>
  );
}
