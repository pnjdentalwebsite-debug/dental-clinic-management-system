interface Props {
  title: string;
  description: string;
}

export function ClinicDashboardEmptyState({ title, description }: Props) {
  return (
    <div className="clinic-dashboard-empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
