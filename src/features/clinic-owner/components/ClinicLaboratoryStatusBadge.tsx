interface Props {
  status: string;
}

export function ClinicLaboratoryStatusBadge({ status }: Props) {
  const isConnected = status.toLowerCase() === 'connected';
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '0.75rem',
      fontWeight: 600,
      padding: '0.15rem 0.6rem',
      borderRadius: '9999px',
      backgroundColor: isConnected ? 'var(--success-light)' : 'var(--warning-light)',
      color: isConnected ? 'var(--success)' : 'var(--warning)'
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isConnected ? 'var(--success)' : 'var(--warning)' }}></span>
      {status}
    </span>
  );
}
