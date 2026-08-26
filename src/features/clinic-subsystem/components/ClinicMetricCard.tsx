import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  value: string;
  description: string;
  trend?: string;
  trendStatus?: 'positive' | 'negative' | 'neutral';
  variant?: 'primary' | 'teal' | 'warning' | 'success';
}

const variantClassMap = {
  primary: 'clinic-metric-card--primary',
  teal: 'clinic-metric-card--teal',
  warning: 'clinic-metric-card--warning',
  success: 'clinic-metric-card--success'
} as const;

export function ClinicMetricCard({ icon: Icon, title, value, description, trend, trendStatus = 'neutral', variant = 'primary' }: Props) {
  return (
    <article className={`clinic-metric-card ${variantClassMap[variant]}`}>
      <div className="clinic-metric-card__icon" aria-hidden="true">
        <Icon size={18} />
      </div>
      <div className="clinic-metric-card__body">
        <span className="clinic-metric-card__label">{title}</span>
        <strong className="clinic-metric-card__value">{value}</strong>
        <p className="clinic-metric-card__description">{description}</p>
        {trend && <span className={`clinic-metric-card__trend clinic-metric-card__trend--${trendStatus}`}>{trend}</span>}
      </div>
    </article>
  );
}
