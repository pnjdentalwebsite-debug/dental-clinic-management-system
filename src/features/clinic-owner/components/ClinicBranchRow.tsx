import { useState } from 'react';
import { Phone } from 'lucide-react';
import { ClinicBranchStatusBadge } from './ClinicBranchStatusBadge';
import { ClinicBranchActionMenu } from './ClinicBranchActionMenu';

interface BranchItem {
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
}

interface Props {
  branch: BranchItem;
  isSelected?: boolean;
  onSelect?: () => void;
  isChecked?: boolean;
  onToggleCheck?: (e: React.MouseEvent) => void;
  onAction: (action: string, branch: BranchItem) => void;
}

export function ClinicBranchRow({
  branch,
  isSelected,
  onSelect,
  isChecked,
  onToggleCheck,
  onAction
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const initials = branch.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase() || 'BR';

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
    <tr
      onClick={onSelect}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.05)' : isChecked ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
        transition: 'background-color 0.15s ease'
      }}
    >
      <td
        style={{ padding: '0.9rem 1rem', width: '40px' }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck?.(e);
        }}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={() => {}}
          style={{ cursor: 'pointer' }}
        />
      </td>

      {/* Branch Name with Icon Avatar */}
      <td style={{ padding: '0.9rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(20,184,166,0.12))',
              color: 'var(--primary)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.82rem',
              fontWeight: 700,
              flexShrink: 0
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'grid', gap: '0.1rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
              {branch.name}
            </span>
            <span title={branch.id} style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {branch.clinicNumber || branch.id}
            </span>
            <span style={{ fontSize: '0.7rem', color: branch.isPrimary ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
              {branch.isPrimary ? 'Primary Clinic' : branch.branchType === 'satellite' ? 'Satellite Clinic' : 'Clinic Branch'}
            </span>
          </div>
        </div>
      </td>

      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
        {branch.location}
      </td>

      <td style={{ padding: '0.9rem 1rem' }}>
        <ClinicBranchStatusBadge status={branch.status} />
      </td>

      {/* Contact with Hover Popover Blip */}
      <td style={{ padding: '0.9rem 1rem', position: 'relative' }}>
        <div
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary)',
            fontSize: '0.84rem',
            position: 'relative',
            cursor: 'help'
          }}
        >
          <Phone size={13} style={{ color: 'var(--text-muted)' }} />
          <span>{branch.contact ? `${branch.contact.slice(0, 10)}...` : '—'}</span>

          {showTooltip && branch.contact && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%) translateY(-6px)',
                backgroundColor: '#1e293b',
                color: '#ffffff',
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 9999,
                pointerEvents: 'none'
              }}
            >
              {branch.contact}
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  borderWidth: '4px',
                  borderStyle: 'solid',
                  borderColor: '#1e293b transparent transparent transparent'
                }}
              />
            </div>
          )}
        </div>
      </td>

      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
        {branch.hours}
      </td>

      <td style={{ padding: '0.9rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        {formattedDate}
      </td>

      <td
        style={{ padding: '0.9rem 1rem', textAlign: 'right' }}
        onClick={(e) => e.stopPropagation()}
      >
        <ClinicBranchActionMenu status={branch.status} onAction={(action) => onAction(action, branch)} />
      </td>
    </tr>
  );
}
