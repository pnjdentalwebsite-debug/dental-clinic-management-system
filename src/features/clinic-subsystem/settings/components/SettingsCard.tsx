import type { ReactNode } from 'react';

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsCard({ title, description, children }: Props) {
  return (
    <article className="settings-card">
      <div className="settings-card__header">
        <div>
          <h3>{title}</h3>
          {description && <p>{description}</p>}
        </div>
      </div>
      <div className="settings-card__body">
        {children}
      </div>
    </article>
  );
}
