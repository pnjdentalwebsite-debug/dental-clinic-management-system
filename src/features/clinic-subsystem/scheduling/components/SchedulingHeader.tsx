interface Props {
  moduleTitle: string;
}

export function SchedulingHeader({ moduleTitle }: Props) {
  return (
    <div className="scheduling-header">
      <p className="scheduling-header__eyebrow">Patient Schedules</p>
      <h2 className="scheduling-header__title">{moduleTitle}</h2>
    </div>
  );
}
