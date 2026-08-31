import { ArrowRightCircle, Building2, Calendar, Clock, MapPin, Pencil, Phone, ShieldCheck, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ClinicBranchStatusBadge } from './ClinicBranchStatusBadge';

export interface BranchRecordDetails {
  id: string;
  clinicNumber: string;
  isPrimary: boolean;
  branchType: string;
  name: string;
  location: string;
  status: string;
  contact: string;
  hours: string;
  created: string;
  email?: string;
  dentistCount?: number;
  chairCount?: number;
}

interface Props {
  branch: BranchRecordDetails | null;
  onClose: () => void;
  onView?: () => void;
  onEdit?: () => void;
  onEnterWorkspace?: () => void;
}

export function ClinicBranchProfilePreview({ branch, onClose, onView, onEdit, onEnterWorkspace }: Props) {
  if (!branch) {
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
          <Building2 size={28} style={{ opacity: 0.6 }} />
        </div>
        <div>
          <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem', marginBottom: '0.2rem' }}>
            No Branch Selected
          </strong>
          <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '200px' }}>
            Select a branch location from the table to inspect details.
          </p>
        </div>
      </div>
    );
  }

  const initials = branch.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase() || 'BR';

  const isActive = branch.status.toLowerCase() === 'active';

  const formattedDate = branch.created
    ? !isNaN(Date.parse(branch.created))
      ? new Date(branch.created).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : branch.created
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
        aria-label="Close branch preview"
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
            background: 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(20,184,166,0.14))',
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
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{branch.name}</h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
            {branch.clinicNumber || branch.id}
          </span>
          <span style={{ fontSize: '0.72rem', color: branch.isPrimary ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700 }}>
            {branch.isPrimary ? 'Primary Clinic' : branch.branchType === 'satellite' ? 'Satellite Clinic' : 'Clinic Branch'}
          </span>
        </div>
        <ClinicBranchStatusBadge status={branch.status} />
      </div>

      {/* Details Grid */}
      <div style={{ display: 'grid', gap: '0.85rem', fontSize: '0.85rem' }}>
        <Detail icon={MapPin} label="Branch Location" value={branch.location || 'Not specified'} />
        <Detail icon={Phone} label="Contact Number" value={branch.contact || 'Not available'} />
        <Detail icon={Clock} label="Operating Hours" value={branch.hours || 'Mon - Sat: 9:00 AM - 6:00 PM'} />
        {branch.email && <Detail icon={ShieldCheck} label="Branch Email" value={branch.email} />}
        <Detail icon={Calendar} label="Date Created" value={formattedDate} />
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
        {isActive && onEnterWorkspace && (
          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', height: '38px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            onClick={onEnterWorkspace}
          >
            <ArrowRightCircle size={15} /> Open Branch Workspace
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
            <Pencil size={13} /> Edit Branch
          </button>
        </div>
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
