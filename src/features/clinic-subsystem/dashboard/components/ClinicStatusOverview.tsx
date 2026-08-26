import { DashboardSectionHeader } from './DashboardSectionHeader';
import type { DashboardStatusItem } from '../dashboard.status.mock';

interface Props {
  items: DashboardStatusItem[];
}

export function ClinicStatusOverview({ items }: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-panel clinic-status-overview" aria-label="Clinic status overview">
      <DashboardSectionHeader title="Clinic Status Overview" description="Current branch operations snapshot." />
      <div className="clinic-status-overview__grid">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.id} className="clinic-status-overview__card">
              <div className="clinic-status-overview__icon" aria-hidden="true">
                <Icon size={18} />
              </div>
              <div className="clinic-status-overview__content">
                <strong className="clinic-status-overview__value">{item.value}</strong>
                <span className="clinic-status-overview__title">{item.title}</span>
                <p className="clinic-status-overview__description">{item.description}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
