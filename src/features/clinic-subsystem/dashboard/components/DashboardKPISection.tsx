import type { DashboardKPIItem } from '../dashboard.mock';
import { DashboardKPICard } from './DashboardKPICard';

interface Props {
  items: DashboardKPIItem[];
}

export function DashboardKPISection({ items }: Props) {
  return (
    <section className="clinic-dashboard-section clinic-dashboard-section--kpi" aria-label="KPI overview">
      <div className="clinic-dashboard-metrics">
        {items.map((item) => (
          <DashboardKPICard
            key={item.id}
            icon={item.icon}
            title={item.title}
            value={item.value}
            description={item.description}
            trend={item.trend}
            trendStatus={item.trendStatus}
          />
        ))}
      </div>
    </section>
  );
}
