import { useMemo } from 'react';
import { ClinicPageHeader } from '../../components/ClinicPageHeader';
import { WaitlistQueue } from '../components/waitlist/WaitlistQueue';
import { getClinicScheduleItems, getLocalDateKey } from '../scheduleStorage';
import type { CalendarScheduleItem } from '../types';
import type { WaitlistEntry } from '../components/waitlist/WaitlistCard';

interface Props {
  currentClinic: any;
  onReturnToDashboard: () => void;
}

export function WaitlistPage(_props: Props) {
  const { currentClinic, onReturnToDashboard } = _props;
  const todayDateKey = useMemo(() => getLocalDateKey(), []);
  const currentDateLabel = useMemo(() => new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }), []);

  const queue = useMemo(() => (
    getClinicScheduleItems(undefined, currentClinic?.id)
      .filter((item) => item.date === todayDateKey)
      .map(mapScheduleToWaitlistEntry)
  ), [todayDateKey, currentClinic?.id]);

  return (
    <div className="scheduling-waitlist">
      <ClinicPageHeader
        sectionLabel="PATIENT SCHEDULES"
        title="Daily Waitlist"
        subtitle="Manage today's patient queue."
        date={currentDateLabel}
        actions={(
          <button type="button" className="btn btn-outline scheduling-waitlist__return" onClick={onReturnToDashboard}>
            Return to Branch Dashboard
          </button>
        )}
      />

      <div className="clinic-dashboard-panel scheduling-waitlist__panel">
        {queue.length > 0 ? (
          <WaitlistQueue queue={queue} />
        ) : (
          <div className="clinic-dashboard-empty-state scheduling-waitlist__empty">
            <strong>No scheduled queue for today.</strong>
            <p>Daily Waitlist now reflects current-date records from the Calendar type legend schedule.</p>
            <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={onReturnToDashboard}>
              Return to Branch Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function mapScheduleToWaitlistEntry(item: CalendarScheduleItem): WaitlistEntry {
  return {
    id: `waitlist-${item.id}`,
    patientId: item.patientId || item.id,
    patientName: item.patientName || 'Untitled Patient',
    procedure: item.treatmentTag || item.procedure || item.title,
    scheduledTime: item.time || formatScheduleTime(item),
    arrivalTime: item.startTime ? 'Pending arrival' : 'Any time',
    priority: getWaitlistPriority(item),
    status: getWaitlistStatus(item.status)
  };
}

function formatScheduleTime(item: CalendarScheduleItem) {
  if (!item.startTime) return 'Any time';
  if (!item.endTime) return item.startTime;
  return `${item.startTime} - ${item.endTime}`;
}

function getWaitlistPriority(item: CalendarScheduleItem): WaitlistEntry['priority'] {
  if (item.type === 'google' || item.type === 'events') return 'Urgent';
  if (item.type === 'birthdays') return 'Normal';
  if (item.type === 'online') return 'Urgent';
  return 'Normal';
}

function getWaitlistStatus(status: CalendarScheduleItem['status']): WaitlistEntry['status'] {
  if (status === 'Waiting' || status === 'In Treatment' || status === 'Completed' || status === 'Cancelled') {
    return status;
  }
  if (status === 'No Show') return 'Cancelled';
  return 'Waiting';
}
