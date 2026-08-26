export interface AppointmentStatusHistoryEntry {
  status: string;
  time: string;
}

interface Props {
  history: AppointmentStatusHistoryEntry[];
}

export function AppointmentStatusHistory({ history }: Props) {
  return (
    <div className="appointment-status-history">
      <h4>Status History</h4>
      {history.length > 0 ? (
        <ul className="appointment-status-history__list">
          {history.map((entry, index) => (
            <li key={`${entry.status}-${entry.time}-${index}`} className="appointment-status-history__item">
              <strong>{entry.status}</strong>
              <span>{entry.time}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="appointment-status-history__empty">No status updates yet.</p>
      )}
    </div>
  );
}
