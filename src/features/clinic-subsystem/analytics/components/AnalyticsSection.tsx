import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AnalyticsSection({ title, description, children }: Props) {
  return (
    <section className="analytics-section">
      <div className="analytics-section__header">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="analytics-section__content">
        {children}
      </div>
    </section>
  );
}
