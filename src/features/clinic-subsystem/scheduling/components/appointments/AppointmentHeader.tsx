interface Props {
  moduleTitle: string;
  currentDateLabel: string;
}

export function AppointmentHeader({ moduleTitle, currentDateLabel }: Props) {
  return (
    <div className="appointment-header">
      <div className="appointment-header__copy">
        <p className="appointment-header__eyebrow">Appointments</p>
        <h2>{moduleTitle}</h2>
      </div>
      <div className="appointment-header__date">
        <span>Current date</span>
        <strong>{currentDateLabel}</strong>
      </div>
    </div>
  );
}
