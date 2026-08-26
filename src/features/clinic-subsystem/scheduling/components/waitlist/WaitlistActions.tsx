import { PhoneCall, CircleUserRound, ArrowRightCircle } from 'lucide-react';

interface Props {
  onCallPatient?: () => void;
  onViewRecord?: () => void;
  onUpdateStatus?: () => void;
}

export function WaitlistActions({ onCallPatient, onViewRecord, onUpdateStatus }: Props) {
  return (
    <div className="waitlist-actions" aria-label="Waitlist actions">
      <button type="button" className="btn btn-outline waitlist-actions__button" onClick={onCallPatient}>
        <PhoneCall size={14} aria-hidden="true" />
        Call Patient
      </button>
      <button type="button" className="btn btn-outline waitlist-actions__button" onClick={onViewRecord}>
        <CircleUserRound size={14} aria-hidden="true" />
        View Record
      </button>
      <button type="button" className="btn btn-outline waitlist-actions__button" onClick={onUpdateStatus}>
        <ArrowRightCircle size={14} aria-hidden="true" />
        Update Status
      </button>
    </div>
  );
}
