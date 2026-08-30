import { useState } from 'react';
import type { ReactNode } from 'react';
import { ClinicOwnerSidebar } from './ClinicOwnerSidebar';
import { ClinicOwnerHeader } from './ClinicOwnerHeader';
import { GlobalAnnouncementBanner } from '../../announcements/components/GlobalAnnouncementBanner';

interface Props {
  currentRoute: string;
  loggedUserName: string;
  loggedClinicName: string;
  loggedPlanName: string;
  loggedUserEmail: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onNavigate: (name: string, route: string) => void;
  onResetMock?: () => void;
  children: ReactNode;
}

export function ClinicOwnerLayout({
  currentRoute,
  loggedUserName,
  loggedClinicName,
  loggedPlanName,
  loggedUserEmail,
  isRefreshing,
  onRefresh,
  onLogout,
  onNavigate,
  onResetMock,
  children
}: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <ClinicOwnerSidebar
        currentRoute={currentRoute}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        mobileSidebarOpen={mobileSidebarOpen}
        onNavigate={(name, route) => {
          onNavigate(name, route);
          setMobileSidebarOpen(false);
        }}
        onResetMock={onResetMock}
        onLogout={onLogout}
      />

      <div className="main-wrapper">
        <ClinicOwnerHeader
          loggedUserName={loggedUserName}
          loggedClinicName={loggedClinicName}
          loggedPlanName={loggedPlanName}
          loggedUserEmail={loggedUserEmail}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onLogout={onLogout}
          onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        <GlobalAnnouncementBanner
          userId="usr-owner-1"
          userRole="clinic_owner"
          currentRoute={currentRoute}
          onNavigate={(route) => onNavigate('Announcement', route)}
        />

        <main className="main-content" style={{ padding: '2rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
