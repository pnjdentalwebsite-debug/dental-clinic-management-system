import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  onAction: () => void;
  footerLabel?: string;
  footerValue?: string;
  footerContent?: ReactNode;
  children: ReactNode;
}

export function DashboardListCard({
  title,
  description,
  icon: Icon,
  actionLabel = 'See All',
  onAction,
  footerLabel,
  footerValue,
  footerContent,
  children
}: Props) {
  return (
    <article className="dashboard-panel dashboard-summary-card dashboard-list-card">
      <div className="dashboard-summary-card__header dashboard-list-card__header">
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
        <button type="button" className="dashboard-summary-card__action dashboard-list-card__action" onClick={onAction}>
          {actionLabel} &gt;
        </button>
      </div>

      <div className="dashboard-list-card__items">{children}</div>

      {footerContent ?? (
        <div className="dashboard-list-card__footer">
          <span>{footerLabel}</span>
          <strong>{footerValue}</strong>
        </div>
      )}
    </article>
  );
}
