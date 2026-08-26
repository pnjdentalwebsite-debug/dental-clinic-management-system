import type { StaffStatus } from '../types/staffManagement';

interface Props {
  status: StaffStatus | string;
}

export function StaffStatusBadge({ status }: Props) {
  const normalized = (status || 'active').toLowerCase();

  let bg = 'var(--success-light)';
  let color = 'var(--success)';
  let label = 'Active';

  if (normalized === 'inactive') {
    bg = 'var(--danger-light)';
    color = 'var(--danger)';
    label = 'Inactive';
  } else if (normalized === 'draft') {
    bg = 'var(--warning-light)';
    color = 'var(--warning)';
    label = 'Draft';
  } else if (normalized === 'on_leave') {
    bg = 'var(--info-light)';
    color = 'var(--info)';
    label = 'On Leave';
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '0.2rem 0.65rem',
        borderRadius: '9999px',
        backgroundColor: bg,
        color: color,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap'
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: color
        }}
      />
      {label}
    </span>
  );
}
