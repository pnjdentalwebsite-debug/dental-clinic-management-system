interface Props {
  title: string;
  description: string;
}

export function DashboardSectionHeader({ title, description }: Props) {
  return (
    <div className="clinic-dashboard-section__header">
      <h2 className="clinic-dashboard-section__title">{title}</h2>
      <p className="clinic-dashboard-section__description">{description}</p>
    </div>
  );
}
