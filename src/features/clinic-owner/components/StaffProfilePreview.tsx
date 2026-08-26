import { Building2, Calendar, FlaskConical, Mail, MapPin, Pencil, Phone, User, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StaffStatusBadge } from './StaffStatusBadge';
import type { StaffMemberRecord } from '../types/staffManagement';

interface Props {
  staff: StaffMemberRecord | null;
  onClose: () => void;
  onView?: () => void;
  onEdit?: () => void;
}

export function StaffProfilePreview({ staff, onClose, onView, onEdit }: Props) {
  if (!staff) {
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
            No Staff Member Selected
          </strong>
          <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '200px' }}>
            Select an employee from the directory to view details and privileges.
          </p>
        </div>
      </div>
    );
  }

  const fullName = [staff.firstName, staff.middleName, staff.lastName, staff.extensionName]
    .filter(Boolean)
    .join(' ');

  const initials = `${staff.firstName?.charAt(0) || ''}${staff.lastName?.charAt(0) || ''}`.toUpperCase() || 'ST';

  const formattedDate = staff.createdAt
    ? !isNaN(Date.parse(staff.createdAt))
      ? new Date(staff.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : staff.createdAt
    : 'N/A';

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
        aria-label="Close staff preview"
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
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.16), rgba(168, 85, 247, 0.16))',
            color: 'var(--primary)',
            border: '2px solid rgba(99, 102, 241, 0.25)',
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
            {staff.staffNumber}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <StaffStatusBadge status={staff.status} />
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)'
            }}
          >
            {staff.role}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.85rem' }}>
        <Detail icon={Mail} label="Email Address" value={staff.email || 'Not set'} />
        <Detail
          icon={Phone}
          label="Contact Numbers"
          value={`Mobile: ${staff.mobileNumber || '—'}${staff.phoneNumber ? ` | Tel: ${staff.phoneNumber}` : ''}`}
        />
        <Detail icon={MapPin} label="Residential Address" value={staff.address || 'Not set'} />

        {/* Authorized Clinics */}
        {staff.authorizedClinics && staff.authorizedClinics.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Building2 size={16} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Authorized Clinics</div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {staff.authorizedClinics.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '6px',
                      background: 'rgba(99, 102, 241, 0.08)',
                      color: 'var(--primary)',
                      border: '1px solid rgba(99, 102, 241, 0.2)'
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Authorized Laboratories */}
        {staff.authorizedLaboratories && staff.authorizedLaboratories.length > 0 && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <FlaskConical size={16} style={{ color: '#0284c7', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Authorized Laboratories</div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {staff.authorizedLaboratories.map((lab) => (
                  <span
                    key={lab}
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
                    {lab}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weekly Work Schedule */}
        {staff.workSchedule && Object.values(staff.workSchedule).some((d) => d?.enabled) && (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Calendar size={16} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Weekly Schedule</div>
              <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                {Object.entries(staff.workSchedule)
                  .filter(([_, val]) => val?.enabled)
                  .map(([day]) => (
                    <span
                      key={day}
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.1)',
                        color: 'var(--primary)'
                      }}
                    >
                      {day.slice(0, 3)}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        )}

        <Detail icon={Calendar} label="Date Registered" value={formattedDate} />
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
          <Pencil size={14} /> Edit Staff
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
