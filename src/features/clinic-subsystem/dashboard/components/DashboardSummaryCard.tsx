import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  onSeeAll: () => void;
  actionLabel?: string;
}

export function DashboardSummaryCard({
  title,
  description,
  icon: Icon,
  children,
  onSeeAll,
  actionLabel = 'See All'
}: Props) {
  return (
    <article className="dashboard-panel dashboard-summary-card">
      <div className="dashboard-summary-card__header">
        <div className="dashboard-summary-card__copy">
          <div className="dashboard-summary-card__title-row">
            <div className="dashboard-summary-card__icon" aria-hidden="true">
              <Icon size={16} />
            </div>
            <div>
              <h2 className="dashboard-summary-card__title">{title}</h2>
              <p className="dashboard-summary-card__description">{description}</p>
            </div>
          </div>
        </div>
        <button type="button" className="dashboard-summary-card__action" onClick={onSeeAll}>
          {actionLabel} &gt;
        </button>
      </div>

      <div className="dashboard-summary-card__body">{children}</div>
    </article>
  );
}
