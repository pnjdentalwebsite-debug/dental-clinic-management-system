interface Props {
  currentRoute: string;
  clinicId: string;
  onNavigate: (route: string) => void;
}

const tabs = [
  { label: 'Calendar', routeSuffix: 'calendar' },
  { label: 'Daily Waitlist', routeSuffix: 'waitlist' }
];

export function ScheduleTabNavigation({ currentRoute, clinicId, onNavigate }: Props) {
  return (
    <nav className="schedule-tabs" aria-label="Scheduling navigation">
      {tabs.map((tab) => {
        const route = `/clinic/${clinicId}/${tab.routeSuffix}`;
        const isActive = currentRoute === route;
        return (
          <button
            key={tab.routeSuffix}
            type="button"
            className={`schedule-tabs__item ${isActive ? 'is-active' : ''}`}
            onClick={() => onNavigate(route)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
