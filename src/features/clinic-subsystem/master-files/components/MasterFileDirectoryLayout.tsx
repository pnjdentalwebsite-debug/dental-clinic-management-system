import { useState, type ReactNode } from 'react';
import { ClinicSubsystemNavbar } from '../../components/ClinicSubsystemNavbar';
import { MasterFileDirectorySidebar } from './MasterFileDirectorySidebar';
import { emitOpenAddPatient, queueAddPatientOpen } from '../../patients/shared/addPatientNavigation';

interface Props {
  currentRoute: string;
  loggedUserName: string;
  loggedUserEmail: string;
  onLogout: () => void;
  onNavigate: (route: string) => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  children: ReactNode;
  currentClinic: any;
  routeBase?: string;
  backRoute?: string;
  backLabel?: string;
  scope?: 'owner' | 'branch';
}

export function MasterFileDirectoryLayout({
  currentRoute,
  loggedUserName,
  loggedUserEmail,
  onLogout,
  onNavigate,
  showToast,
  children,
  currentClinic,
  routeBase,
  backRoute,
  backLabel,
  scope = 'branch'
}: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const clinicPatientsRoute = `/clinic/${currentClinic?.id || 'unknown-branch'}/patients`;

  const handleNavbarAddPatient = () => {
    if (scope === 'owner') {
      showToast('Enter a clinic branch before adding patients.', 'info');
      onNavigate('/clinic/branches');
      return;
    }
    queueAddPatientOpen(currentClinic?.id);
    onNavigate(clinicPatientsRoute);
    window.setTimeout(() => {
      emitOpenAddPatient();
    }, 0);
  };

  return (
    <div className={`dashboard-layout master-file-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <MasterFileDirectorySidebar
        currentRoute={currentRoute}
        clinicId={currentClinic?.id || 'unknown-branch'}
        routeBase={routeBase}
        backRoute={backRoute}
        backLabel={backLabel}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onNavigate={onNavigate}
        currentClinic={currentClinic}
      />

      <div className="main-wrapper">
        <ClinicSubsystemNavbar
          loggedUserName={loggedUserName}
          loggedUserEmail={loggedUserEmail}
          onLogout={onLogout}
          onToggleSidebarMobile={() => undefined}
          onAddPatient={handleNavbarAddPatient}
          showToast={showToast}
          currentClinic={currentClinic}
        />

        <main className="main-content master-file-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
}
