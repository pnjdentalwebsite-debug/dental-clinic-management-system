interface Props {
  status: string;
}

export function ClinicBranchStatusBadge({ status }: Props) {
  const isActive = status.toLowerCase() === 'active';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.75rem',
      fontWeight: 600,
      padding: '0.15rem 0.6rem',
      borderRadius: '9999px',
      backgroundColor: isActive ? 'var(--success-light)' : 'var(--danger-light)',
      color: isActive ? 'var(--success)' : 'var(--danger)'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? 'var(--success)' : 'var(--danger)' }}></span>
      {status}
    </span>
  );
}
