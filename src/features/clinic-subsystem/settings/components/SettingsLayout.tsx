import type { ReactNode } from 'react';
import { SettingsHeader } from './SettingsHeader';

interface Props {
  currentClinic: any;
  children: ReactNode;
}

export function SettingsLayout({ children }: Props) {
  return (
    <div className="settings-layout">
      <div className="clinic-dashboard-panel settings-layout__header-panel">
        <SettingsHeader moduleTitle="Settings" />
      </div>
      <div className="settings-layout__content">
        {children}
      </div>
    </div>
  );
}
