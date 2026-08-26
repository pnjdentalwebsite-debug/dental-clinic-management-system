import { useState } from 'react';
import { Phone, Shield } from 'lucide-react';
import { StaffStatusBadge } from './StaffStatusBadge';
import { StaffActionMenu } from './StaffActionMenu';
import type { StaffMemberRecord } from '../types/staffManagement';

interface Props {
  staff: StaffMemberRecord;
  isSelected?: boolean;
  onSelect: () => void;
  isChecked?: boolean;
  onToggleCheck?: (e: React.MouseEvent) => void;
  onAction: (action: string, staff: StaffMemberRecord) => void;
}

export function StaffTableRow({
  staff,
  isSelected = false,
  onSelect,
  isChecked = false,
  onToggleCheck,
  onAction
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Format as LAST NAME, FIRST NAME (excluding middle name)
  const nameFormatted = `${staff.lastName || ''}, ${staff.firstName || ''}${
    staff.extensionName ? ` ${staff.extensionName}` : ''
  }`;

  const initials = `${staff.firstName?.charAt(0) || ''}${staff.lastName?.charAt(0) || ''}`.toUpperCase() || 'ST';

  return (
    <tr
      onClick={onSelect}
      style={{
        borderBottom: '1px solid var(--border)',
        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : isChecked ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease'
      }}
      className="staff-table-row"
    >
      <td
        style={{ padding: '0.85rem 1rem', width: '40px' }}
        onClick={(e) => {
          e.stopPropagation();
          onToggleCheck?.(e);
        }}
      >
        <input
          type="checkbox"
          style={{ cursor: 'pointer' }}
          checked={isChecked}
          onChange={() => {}}
          aria-label={`Select staff member ${nameFormatted}`}
        />
      </td>
      <td style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14), rgba(168, 85, 247, 0.14))',
              color: 'var(--primary)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
              flexShrink: 0
            }}
          >
            {initials}
          </div>
          <div style={{ display: 'grid', gap: '0.15rem' }}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{nameFormatted}</strong>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {staff.staffNumber}
            </span>
          </div>
        </div>
      </td>
      <td style={{ padding: '0.85rem 1rem', minWidth: '150px' }}>
        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Shield size={12} style={{ color: 'var(--primary)' }} />
          {staff.role || 'Dental Assistant'}
        </span>
      </td>
      <td style={{ padding: '0.85rem 1rem', minWidth: '160px', whiteSpace: 'nowrap' }}>
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            color: 'var(--text-secondary)',
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Phone size={13} style={{ color: 'var(--primary)', flexShrink: 0 }} />
          <span>{staff.mobileNumber || '—'}</span>

          {/* Hover popup modal blip */}
          {showTooltip && staff.mobileNumber && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                backgroundColor: 'rgba(15, 23, 42, 0.96)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                zIndex: 999,
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Phone size={12} style={{ color: '#38bdf8' }} />
              <span>{staff.mobileNumber}</span>
              {staff.phoneNumber && (
                <span style={{ fontSize: '0.68rem', opacity: 0.75, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '0.35rem' }}>
                  Tel: {staff.phoneNumber}
                </span>
              )}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: '150px', whiteSpace: 'nowrap' }}>
        {staff.email || '—'}
      </td>
      <td style={{ padding: '0.85rem 1rem', minWidth: '110px' }}>
        <StaffStatusBadge status={staff.status} />
      </td>
      <td
        style={{ padding: '0.85rem 1rem', textAlign: 'right', minWidth: '80px' }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <StaffActionMenu status={staff.status} onAction={(action) => onAction(action, staff)} />
      </td>
    </tr>
  );
}
