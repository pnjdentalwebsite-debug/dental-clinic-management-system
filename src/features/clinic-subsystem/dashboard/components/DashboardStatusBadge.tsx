interface Props {
  label: string;
  variant: 'confirmed' | 'waiting' | 'completed' | 'no-show' | 'today' | 'balance' | 'neutral';
}

export function DashboardStatusBadge({ label, variant }: Props) {
  return <span className={`dashboard-status-badge dashboard-status-badge--${variant}`}>{label}</span>;
}
