import type { ReactNode } from 'react';

interface Props {
  sectionLabel: string;
  title: string;
  subtitle?: string;
  date?: string;
  actions?: ReactNode;
}

export function ClinicPageHeader({ sectionLabel, title, subtitle, date, actions }: Props) {
  return (
    <section className="clinic-page-header">
      <div className="clinic-page-header__copy">
        <p className="clinic-page-header__section">{sectionLabel}</p>
        <h1 className="clinic-page-header__title">{title}</h1>
        {subtitle && <p className="clinic-page-header__subtitle">{subtitle}</p>}
      </div>
      <div className="clinic-page-header__meta">
        {date && <span className="clinic-page-header__date">{date}</span>}
        {actions}
      </div>
    </section>
  );
}
