import type { ReactNode } from 'react';
import { DashboardStatusBadge } from './DashboardStatusBadge';

interface Props {
  title: string;
  description?: string;
  meta?: string;
  badgeLabel?: string;
  badgeVariant?: 'confirmed' | 'waiting' | 'completed' | 'no-show' | 'today' | 'balance' | 'neutral';
  selected?: boolean;
  right?: ReactNode;
}

export function DashboardListItem({
  title,
  description,
  meta,
  badgeLabel,
  badgeVariant = 'neutral',
  selected = false,
  right
}: Props) {
  return (
    <article className={`dashboard-list-item ${selected ? 'is-selected' : ''}`}>
      <div className="dashboard-list-item__copy">
        <strong className="dashboard-list-item__title">{title}</strong>
        {description && <p className="dashboard-list-item__description">{description}</p>}
        {meta && <span className="dashboard-list-item__meta">{meta}</span>}
      </div>
      <div className="dashboard-list-item__side">
        {right}
        {badgeLabel && <DashboardStatusBadge label={badgeLabel} variant={badgeVariant} />}
      </div>
    </article>
  );
}
