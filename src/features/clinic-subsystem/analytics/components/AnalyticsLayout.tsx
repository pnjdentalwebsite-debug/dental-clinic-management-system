import type { ReactNode } from 'react';

interface Props {
  currentRoute: string;
  currentClinic: any;
  onNavigate: (route: string) => void;
  children: ReactNode;
}

export function AnalyticsLayout({ currentRoute: _currentRoute, currentClinic: _currentClinic, onNavigate: _onNavigate, children }: Props) {
  return (
    <div className="analytics-layout">
      <div className="analytics-layout__content">
        {children}
      </div>
    </div>
  );
}
