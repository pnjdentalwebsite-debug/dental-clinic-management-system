import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function QuickActionCard({ label, description, icon: Icon, onClick }: Props) {
  return (
    <button type="button" className="clinic-quick-actions__button" onClick={onClick}>
      <div className="clinic-quick-actions__icon" aria-hidden="true">
        <Icon size={16} />
      </div>
      <div className="clinic-quick-actions__text">
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
    </button>
  );
}
