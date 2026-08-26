interface Props {
  status: 'Scheduled' | 'Confirmed' | 'Waiting' | 'In Treatment' | 'Completed' | 'Cancelled' | 'No Show';
}

export function AppointmentStatusBadge({ status }: Props) {
  return <span className={`appointment-status-badge appointment-status-badge--${status.toLowerCase().replace(/\s+/g, '-')}`}>{status}</span>;
}
