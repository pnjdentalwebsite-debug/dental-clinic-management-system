interface Props {
  status: 'Waiting' | 'Called' | 'In Treatment' | 'Completed' | 'Cancelled';
}

export function WaitlistStatusBadge({ status }: Props) {
  const className = `waitlist-status-badge waitlist-status-badge--${status.toLowerCase().replace(/\s+/g, '-')}`;

  return <span className={className}>{status}</span>;
}
