import { useState } from 'react';
import { Phone } from 'lucide-react';
import { DentistStatusBadge } from './DentistStatusBadge';
import { DentistActionMenu } from './DentistActionMenu';
import type { AssociateDentistRecord } from '../types/associateDentists';

interface Props {
  dentist: AssociateDentistRecord;
  isSelected?: boolean;
  onSelect: () => void;
  isChecked?: boolean;
  onToggleCheck?: (e: React.MouseEvent) => void;
  onAction: (action: string, dentist: AssociateDentistRecord) => void;
}

export function DentistTableRow({
  dentist,
  isSelected = false,
  onSelect,
  isChecked = false,
  onToggleCheck,
  onAction
}: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Format as LAST NAME, FIRST NAME (excluding middle name)
  const nameFormatted = `${dentist.lastName || ''}, ${dentist.firstName || ''}${
    dentist.extensionName ? ` ${dentist.extensionName}` : ''
  }`;

  const initials = `${dentist.firstName?.charAt(0) || ''}${dentist.lastName?.charAt(0) || ''}`.toUpperCase() || 'DR';

  return (
    <tr
      onClick={onSelect}
      style={{
        borderBottom: '1px solid var(--border)',
        background: isSelected ? 'rgba(99, 102, 241, 0.08)' : isChecked ? 'rgba(99, 102, 241, 0.02)' : 'transparent',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease'
      }}
      className="dentist-table-row"
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
          aria-label={`Select dentist ${nameFormatted}`}
        />
      </td>
      <td style={{ padding: '0.85rem 1rem', minWidth: '220px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: dentist.calendarColor
                ? `linear-gradient(135deg, ${dentist.calendarColor}22, ${dentist.calendarColor}44)`
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(20, 184, 166, 0.15))',
              color: dentist.calendarColor || 'var(--primary)',
              border: `1px solid ${dentist.calendarColor ? dentist.calendarColor + '40' : 'rgba(99, 102, 241, 0.2)'}`,
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
              {dentist.associateNumber}
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
            whiteSpace: 'nowrap'
          }}
        >
          {dentist.specialization || 'General Dentistry'}
        </span>
      </td>
      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', minWidth: '130px', whiteSpace: 'nowrap' }}>
        {dentist.designation || 'Associate'}
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
          <span>{dentist.mobileNumber || '—'}</span>

          {/* Hover popup modal blip */}
          {showTooltip && dentist.mobileNumber && (
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
              <span>{dentist.mobileNumber}</span>
              <span style={{ fontSize: '0.68rem', opacity: 0.75, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '0.35rem' }}>
                Primary Line
              </span>
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: '0.85rem 1rem', minWidth: '110px' }}>
        <DentistStatusBadge status={dentist.status} />
      </td>
      <td
        style={{ padding: '0.85rem 1rem', textAlign: 'right', minWidth: '80px' }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <DentistActionMenu status={dentist.status} onAction={(action) => onAction(action, dentist)} />
      </td>
    </tr>
  );
}
