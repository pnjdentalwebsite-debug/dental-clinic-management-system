import { WaitlistStatusBadge } from './WaitlistStatusBadge';
import { WaitlistActions } from './WaitlistActions';

export interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  procedure: string;
  scheduledTime: string;
  arrivalTime: string;
  priority: 'Normal' | 'Urgent' | 'Emergency';
  status: 'Waiting' | 'Called' | 'In Treatment' | 'Completed' | 'Cancelled';
}

interface Props {
  entry: WaitlistEntry;
}

export function WaitlistCard({ entry }: Props) {
  return (
    <article className={`waitlist-card waitlist-card--${entry.priority.toLowerCase()}`}>
      <div className="waitlist-card__main">
        <div className="waitlist-card__identity">
          <strong>{entry.patientName}</strong>
          <span>Patient ID: {entry.patientId}</span>
        </div>

        <div className="waitlist-card__details">
          <div>
            <span>Procedure</span>
            <strong>{entry.procedure}</strong>
          </div>
          <div>
            <span>Scheduled</span>
            <strong>{entry.scheduledTime}</strong>
          </div>
          <div>
            <span>Arrival</span>
            <strong>{entry.arrivalTime}</strong>
          </div>
        </div>
      </div>

      <div className="waitlist-card__meta">
        <div className="waitlist-card__flags">
          <span className={`waitlist-priority waitlist-priority--${entry.priority.toLowerCase()}`}>{entry.priority}</span>
          <WaitlistStatusBadge status={entry.status} />
        </div>

        <WaitlistActions />
      </div>
    </article>
  );
}
