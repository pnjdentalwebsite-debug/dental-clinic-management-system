import { RotateCcw } from 'lucide-react';

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function SchedulingModuleErrorState({
  message = 'Scheduling data unavailable.',
  onRetry
}: Props) {
  return (
    <div className="scheduling-error-state">
      <strong>{message}</strong>
      <p>We could not load the scheduling workspace right now. You can retry without leaving the clinic module.</p>
      {onRetry && (
        <button type="button" className="btn btn-primary scheduling-error-state__retry" onClick={onRetry}>
          <RotateCcw size={14} aria-hidden="true" />
          Retry
        </button>
      )}
    </div>
  );
}
