import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  timestamp: string;
}

export function ClinicActivityItem({ icon: Icon, title, description, timestamp }: Props) {
  return (
    <article className="clinic-activity-item">
      <div className="clinic-activity-item__timeline" aria-hidden="true">
        <span className="clinic-activity-item__dot" />
        <span className="clinic-activity-item__line" />
      </div>
      <div className="clinic-activity-item__icon" aria-hidden="true">
        <Icon size={16} />
      </div>
      <div className="clinic-activity-item__content">
        <strong className="clinic-activity-item__title">{title}</strong>
        <p className="clinic-activity-item__description">{description}</p>
      </div>
      <time className="clinic-activity-item__timestamp">{timestamp}</time>
    </article>
  );
}
