import type { DashboardSummaryItem } from '../dashboard.mock';

interface Props {
  items: DashboardSummaryItem[];
  total: string;
}

export function AppointmentSummaryPanel({ items, total }: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-panel clinic-appointment-summary">
      <div className="clinic-dashboard-panel__header">
        <div>
          <h2 className="clinic-dashboard-panel__title">Appointment Summary</h2>
          <p className="clinic-dashboard-panel__subtitle">Compact schedule totals for today.</p>
        </div>
      </div>
      <div className="clinic-appointment-summary__total">
        <span>Today's Total</span>
        <strong>{total}</strong>
      </div>
      <div className="clinic-appointment-summary__list">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.label} className="clinic-appointment-summary__item">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))
        ) : (
          <div className="clinic-dashboard-empty-state clinic-dashboard-empty-state--inline">
            <strong>No summary available yet.</strong>
            <p>Schedule totals will appear here once branch data is available.</p>
          </div>
        )}
      </div>
    </section>
  );
}
