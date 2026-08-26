interface Props {
  status: string;
}

export function DentistStatusBadge({ status }: Props) {
  const norm = status?.toLowerCase() || 'inactive';
  const isActive = norm === 'active';
  const isDraft = norm === 'draft';
  const isWarning = norm === 'on_leave' || norm === 'on leave' || norm === 'pending';

  let bg = 'var(--danger-light)';
  let color = 'var(--danger)';

  if (isActive) {
    bg = 'var(--success-light)';
    color = 'var(--success)';
  } else if (isDraft) {
    bg = 'rgba(99, 102, 241, 0.12)';
    color = 'var(--primary)';
  } else if (isWarning) {
    bg = 'var(--warning-light)';
    color = 'var(--warning)';
  }

  const label = status.replace('_', ' ');

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
        textTransform: 'capitalize'
      }}
    >
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: color }} />
      {label}
    </span>
  );
}
