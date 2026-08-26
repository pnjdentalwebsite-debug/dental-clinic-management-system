import { CalendarPlus2, FolderOpen, Plus, Rows3 } from 'lucide-react';

interface ActionItem {
  id: string;
  label: string;
  description: string;
  icon: 'add-patient' | 'appointment' | 'calendar' | 'records';
}

interface Props {
  actions: ActionItem[];
  onAction: (label: string) => void;
}

const iconMap = {
  'add-patient': Plus,
  appointment: CalendarPlus2,
  calendar: Rows3,
  records: FolderOpen
};

export function ClinicQuickActions({ actions, onAction }: Props) {
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
            <button
              key={action.id}
              type="button"
              className="clinic-quick-actions__button"
              onClick={() => onAction(action.label)}
            >
              <div className="clinic-quick-actions__icon" aria-hidden="true">
                <Icon size={16} />
              </div>
              <div className="clinic-quick-actions__text">
                <strong>{action.label}</strong>
                <span>{action.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
