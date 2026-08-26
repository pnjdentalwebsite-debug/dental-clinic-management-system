import type { ReactNode } from 'react';

interface Props {
  title: string;
  value?: string;
  description?: string;
  children?: ReactNode;
}

export function AnalyticsCard({ title, value, description, children }: Props) {
  return (
    <article className="analytics-card">
      <div className="analytics-card__header">
        <h3>{title}</h3>
        {value && <strong>{value}</strong>}
      </div>
      {description && <p className="analytics-card__description">{description}</p>}
      {children}
    </article>
  );
}
