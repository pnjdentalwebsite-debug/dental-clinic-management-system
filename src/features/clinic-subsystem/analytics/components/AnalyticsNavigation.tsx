interface Props {
  currentRoute: string;
  clinicId: string;
  onNavigate: (route: string) => void;
}

const tabs = [
  { label: 'Overview Results', suffix: 'overview' },
  { label: 'Daily Results', suffix: 'daily' }
];

export function AnalyticsNavigation({ currentRoute, clinicId, onNavigate }: Props) {
  return (
    <nav className="analytics-navigation" aria-label="Analytics navigation">
      {tabs.map((tab) => {
        const route = `/clinic/${clinicId}/analytics/${tab.suffix}`;
        const active = currentRoute === route;
        return (
          <button
            key={tab.suffix}
            type="button"
            className={`analytics-navigation__item ${active ? 'is-active' : ''}`}
            onClick={() => onNavigate(route)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
