import { CreditCard, FileClock, RefreshCcw, UserPlus } from 'lucide-react';
import { ClinicActivityItem } from '../../components/ClinicActivityItem';
import type { DashboardActivityItem } from '../dashboard.mock';

interface Props {
  items: DashboardActivityItem[];
}

const iconMap = {
  patient: UserPlus,
  appointment: FileClock,
  recall: RefreshCcw,
  payment: CreditCard
} as const;

export function ActivityTimeline({ items }: Props) {
  return (
    <div className="clinic-activity-feed">
      {items.map((item, index) => {
        const icon = index === 0 ? 'patient' : index === 1 ? 'appointment' : index === 2 ? 'recall' : 'payment';
        const Icon = iconMap[icon];
        return <ClinicActivityItem key={item.id} icon={Icon} title={item.title} description={item.description} timestamp={item.time} />;
      })}
    </div>
  );
}
