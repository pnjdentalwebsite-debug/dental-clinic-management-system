import { CalendarPlus2, FolderOpen, Plus, Rows3 } from 'lucide-react';
import { DashboardSectionHeader } from './DashboardSectionHeader';
import { QuickActionCard } from './QuickActionCard';
import type { DashboardQuickActionItem } from '../dashboard.mock';

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

export function QuickActionsPanel({ actions, onAction }: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-panel clinic-quick-actions-panel" aria-label="Quick actions">
      <DashboardSectionHeader title="Quick Actions" description="Placeholder branch actions for upcoming workflows." />
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
