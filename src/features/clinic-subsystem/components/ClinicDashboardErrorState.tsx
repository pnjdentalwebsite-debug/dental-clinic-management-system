import { RefreshCcw } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ClinicDashboardErrorState({ message, onRetry }: Props) {
  return (
    <div className="clinic-dashboard-state clinic-dashboard-state--error" role="alert">
      <div className="clinic-dashboard-state__body">
        <strong>Unable to load clinic dashboard data.</strong>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-outline clinic-dashboard-state__action" onClick={onRetry}>
          <RefreshCcw size={16} />
          Retry
        </button>
      )}
    </div>
  );
}
