import { useState } from 'react';
import type { ReactNode } from 'react';
import { ClinicOwnerHeader } from '../../clinic-owner/components/ClinicOwnerHeader';
import { GlobalAnnouncementBanner } from '../../announcements/components/GlobalAnnouncementBanner';
import { RoleConsoleSidebar } from './RoleConsoleSidebar';

interface Props {
  role: 'associate' | 'staff';
  currentRoute: string;
  loggedUserName: string;
  loggedClinicName: string;
  loggedPlanName: string;
  loggedUserEmail: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onNavigate: (route: string) => void;
  children: ReactNode;
}

export function RoleConsoleLayout({ role, currentRoute, loggedUserName, loggedClinicName, loggedPlanName, loggedUserEmail, isRefreshing, onRefresh, onLogout, onNavigate, children }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLabel = role === 'associate' ? 'Associate Dentist' : 'Clinic Staff';
  return <div className={`dashboard-layout role-console role-console--${role}`}>
    <RoleConsoleSidebar role={role} currentRoute={currentRoute} collapsed={collapsed} mobileOpen={mobileOpen} onToggle={() => setCollapsed(!collapsed)} onNavigate={(route) => { onNavigate(route); setMobileOpen(false); }} onLogout={onLogout} />
    <div className="main-wrapper">
      <ClinicOwnerHeader roleLabel={roleLabel} loggedUserName={loggedUserName} loggedClinicName={loggedClinicName} loggedPlanName={loggedPlanName} loggedUserEmail={loggedUserEmail} isRefreshing={isRefreshing} onRefresh={onRefresh} onLogout={onLogout} onToggleSidebarMobile={() => setMobileOpen(!mobileOpen)} />
      <GlobalAnnouncementBanner userId={loggedUserEmail || `${role}-workspace`} userRole={role} currentRoute={currentRoute} onNavigate={onNavigate} />
      <main className="main-content role-console__content">{children}</main>
    </div>
  </div>;
}
