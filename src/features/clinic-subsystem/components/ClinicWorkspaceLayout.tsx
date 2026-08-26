import { useState, type ReactNode } from 'react';
import { ClinicSubsystemSidebar } from './ClinicSubsystemSidebar';
import { ClinicSubsystemNavbar } from './ClinicSubsystemNavbar';
import { GlobalAnnouncementBanner } from '../../announcements/components/GlobalAnnouncementBanner';
import { emitOpenAddPatient, queueAddPatientOpen } from '../patients/shared/addPatientNavigation';

interface Props {
  currentRoute: string;
  loggedUserName: string;
  loggedUserEmail: string;
  onLogout: () => void;
  onNavigate: (name: string, route: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  children: ReactNode;
  currentClinic: any;
  role?: 'clinic_owner' | 'associate' | 'staff';
  permissions?: Record<string, boolean>;
}

export function ClinicWorkspaceLayout({
  currentRoute,
  loggedUserName,
  loggedUserEmail,
  onLogout,
  onNavigate,
  showToast,
  children,
  currentClinic,
  role = 'clinic_owner',
  permissions = {}
}: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const clinicPatientsRoute = `/clinic/${currentClinic?.id || 'unknown-branch'}/patients`;

  const handleNavbarAddPatient = () => {
    queueAddPatientOpen(currentClinic?.id);
    if (currentRoute !== clinicPatientsRoute) {
      onNavigate('Patients', clinicPatientsRoute);
    }
    window.setTimeout(() => {
      emitOpenAddPatient();
    }, 0);
  };

  return (
    <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar Component */}
      <ClinicSubsystemSidebar
        currentRoute={currentRoute}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onNavigate={(name, route) => {
          onNavigate(name, route);
          setMobileSidebarOpen(false);
        }}
        onLogout={onLogout}
        mobileSidebarOpen={mobileSidebarOpen}
        currentClinic={currentClinic}
        role={role}
        permissions={permissions}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Navbar Component */}
        <ClinicSubsystemNavbar
          loggedUserName={loggedUserName}
          loggedUserEmail={loggedUserEmail}
          onLogout={onLogout}
          onToggleSidebarMobile={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onAddPatient={handleNavbarAddPatient}
          showToast={showToast}
          currentClinic={currentClinic}
          role={role}
        />

        {/* Global In-App Announcement Banner */}
        <GlobalAnnouncementBanner
          userId="usr-dentist-1"
          userRole={role === 'clinic_owner' ? 'clinic_owner' : role}
          clinicId={currentClinic?.id}
          currentRoute={currentRoute}
          onNavigate={(route) => onNavigate('Announcement', route)}
          showToast={showToast}
        />

        {/* Workspace body */}
        <main className="main-content">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setMobileSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}
