interface StatusItem {
  id: string;
  label: string;
  value: string;
}

interface Props {
  items: StatusItem[];
}

export function ClinicStatusCard({ items }: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-panel">
      <div className="clinic-dashboard-panel__header">
        <div>
          <h2 className="clinic-dashboard-panel__title">Clinic Status Overview</h2>
          <p className="clinic-dashboard-panel__subtitle">Current branch operations snapshot.</p>
        </div>
      </div>
      <div className="clinic-status-card">
        {items.map((item) => (
          <div key={item.id} className="clinic-status-card__item">
            <span className="clinic-status-card__label">{item.label}</span>
            <strong className="clinic-status-card__value">{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
