interface Props {
  time: string;
  patientName: string;
  procedure: string;
  dentist: string;
  status: 'Confirmed' | 'Waiting' | 'Completed' | 'Cancelled';
}

const statusClassMap = {
  Confirmed: 'clinic-appointment-item__status--confirmed',
  Waiting: 'clinic-appointment-item__status--waiting',
  Completed: 'clinic-appointment-item__status--completed',
  Cancelled: 'clinic-appointment-item__status--cancelled'
} as const;

export function AppointmentListItem({ time, patientName, procedure, dentist, status }: Props) {
  return (
    <article className="clinic-appointment-item">
      <div className="clinic-appointment-item__time">{time}</div>
      <div className="clinic-appointment-item__body">
        <strong className="clinic-appointment-item__patient">{patientName}</strong>
        <span className="clinic-appointment-item__procedure">{procedure}</span>
        <span className="clinic-appointment-item__dentist">{dentist}</span>
      </div>
      <span className={`clinic-appointment-item__status ${statusClassMap[status]}`}>{status}</span>
    </article>
  );
}
