interface Props {
  greeting: string;
  userFirstName: string;
  moduleTitle: string;
  currentDateLabel: string;
}

export function ClinicDashboardHeader({
  greeting,
  userFirstName,
  moduleTitle,
  currentDateLabel
}: Props) {
  return (
    <section className="dashboard-panel clinic-dashboard-header">
      <div className="clinic-dashboard-header__content">
        <span className="clinic-dashboard-header__eyebrow">
          {greeting}, {userFirstName}
        </span>
        <h1 className="clinic-dashboard-header__title">{moduleTitle}</h1>
        <p className="clinic-dashboard-header__description">
          Manage your clinic operations from one place.
        </p>
      </div>
      <div className="clinic-dashboard-header__meta">
        <span className="clinic-dashboard-header__date">{currentDateLabel}</span>
      </div>
    </section>
  );
}
