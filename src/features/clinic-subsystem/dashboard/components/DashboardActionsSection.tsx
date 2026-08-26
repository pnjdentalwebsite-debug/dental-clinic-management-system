import { CalendarPlus2, FolderOpen, Plus, Rows3 } from 'lucide-react';
import type { DashboardQuickActionItem } from '../dashboard.mock';
import { QuickActionCard } from './QuickActionCard';

interface Props {
  actions: DashboardQuickActionItem[];
  onAction: (label: string) => void;
}

const iconMap = {
  'add-patient': Plus,
  appointment: CalendarPlus2,
  calendar: Rows3,
  records: FolderOpen
} as const;

export function DashboardActionsSection({ actions, onAction }: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-panel">
      <div className="clinic-dashboard-panel__header">
        <div>
          <h2 className="clinic-dashboard-panel__title">Quick Actions</h2>
          <p className="clinic-dashboard-panel__subtitle">Placeholder branch actions for upcoming workflows.</p>
        </div>
      </div>
      <div className="clinic-quick-actions">
        {actions.map((action) => {
          const Icon = iconMap[action.icon];
          return (
            <QuickActionCard
              key={action.id}
              label={action.label}
              description={action.description}
              icon={Icon}
              onClick={() => onAction(action.label)}
            />
          );
        })}
      </div>
    </section>
  );
}
