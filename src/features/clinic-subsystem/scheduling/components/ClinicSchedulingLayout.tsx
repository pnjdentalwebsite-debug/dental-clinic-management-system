import type { ReactNode } from 'react';

interface Props {
  currentRoute: string;
  currentClinic: any;
  onNavigate: (route: string) => void;
  children: ReactNode;
}

export function ClinicSchedulingLayout({ currentRoute: _currentRoute, currentClinic: _currentClinic, onNavigate: _onNavigate, children }: Props) {
  return (
    <div className="scheduling-layout">
      <div className="scheduling-layout__content">
        {children}
      </div>
    </div>
  );
}
