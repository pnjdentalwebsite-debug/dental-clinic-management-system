import type { DashboardActivityItem } from '../dashboard.mock';
import { ActivityTimeline } from './ActivityTimeline';

interface Props {
  items: DashboardActivityItem[];
}

export function DashboardActivitySection({ items }: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-panel">
      <div className="clinic-dashboard-panel__header">
        <div>
          <h2 className="clinic-dashboard-panel__title">Recent Activity</h2>
          <p className="clinic-dashboard-panel__subtitle">Important branch events happening inside the clinic today.</p>
        </div>
      </div>
      <ActivityTimeline items={items} />
    </section>
  );
}
