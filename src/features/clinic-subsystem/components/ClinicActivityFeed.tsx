import { CreditCard, FileClock, RefreshCcw, UserPlus } from 'lucide-react';
import { ClinicActivityItem } from './ClinicActivityItem';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: 'patient' | 'appointment' | 'recall' | 'payment';
}

interface Props {
  items: ActivityItem[];
}

const iconMap = {
  patient: UserPlus,
  appointment: FileClock,
  recall: RefreshCcw,
  payment: CreditCard
} as const;

export function ClinicActivityFeed({ items }: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-panel">
      <div className="clinic-dashboard-panel__header">
        <div>
          <h2 className="clinic-dashboard-panel__title">Recent Activity</h2>
          <p className="clinic-dashboard-panel__subtitle">Important branch events happening inside the clinic today.</p>
        </div>
      </div>
      <div className="clinic-activity-feed">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          return (
            <ClinicActivityItem
              key={item.id}
              icon={Icon}
              title={item.title}
              description={item.description}
              timestamp={item.timestamp}
            />
          );
        })}
      </div>
    </section>
  );
}
