import {
  LayoutDashboard,
  Users,
  Calendar,
  List,
  BarChart3,
  FileText,
  Settings,
  FolderOpen,
  Menu,
  LogOut,
  HelpCircle
} from 'lucide-react';

interface Props {
  currentRoute: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  onNavigate: (name: string, route: string) => void;
  onLogout: () => void;
  mobileSidebarOpen: boolean;
  currentClinic: any;
  role?: 'clinic_owner' | 'associate' | 'staff';
  permissions?: Record<string, boolean>;
}

export function ClinicSubsystemSidebar({
  currentRoute,
  sidebarCollapsed,
  setSidebarCollapsed,
  onNavigate,
  onLogout,
  mobileSidebarOpen,
  currentClinic,
  role = 'clinic_owner',
  permissions = {}
}: Props) {
  const clinicId = currentClinic?.id || 'unknown-branch';

  const staffSections = [{
      title: 'Main Hub',
      items: [
        { name: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, route: `/clinic/${clinicId}/dashboard` }
      ]
    }, {
      title: 'User Management',
      items: [
        { name: 'Patients', label: 'Patients', icon: Users, route: `/clinic/${clinicId}/patients` }
      ]
    }, {
      title: 'Patient Schedules',
      items: [
        { name: 'Calendar', label: 'Calendar', icon: Calendar, route: `/clinic/${clinicId}/calendar` },
        { name: 'Daily Waitlist', label: 'Daily Waitlist', icon: List, route: `/clinic/${clinicId}/waitlist` }
      ]
    }, {
      title: 'Analytics & Reports',
      items: [
        { name: 'Overview Results', label: 'Overview Results', icon: BarChart3, route: `/clinic/${clinicId}/analytics` },
        { name: 'Daily Results', label: 'Daily Results', icon: FileText, route: `/clinic/${clinicId}/analytics/daily` }
      ]
    }];

  const ownerOrAssociateSections = [{
      title: 'Main Hub',
      items: [
        { name: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, route: `/clinic/${clinicId}/dashboard` }
      ]
    },
    {
      title: 'User Management',
      items: [
        { name: 'Patients', label: 'Patients', icon: Users, route: `/clinic/${clinicId}/patients` }
      ]
    },
    {
      title: 'Patient Schedules',
      items: [
        ...(role === 'associate' && permissions.viewCalendar === false ? [] : [{ name: 'Calendar', label: 'Calendar', icon: Calendar, route: `/clinic/${clinicId}/calendar` }]),
        { name: 'Daily Waitlist', label: 'Daily Waitlist', icon: List, route: `/clinic/${clinicId}/waitlist` }
      ]
    },
    {
      title: 'Analytics & Reports',
      items: [
        { name: 'Overview Results', label: 'Overview Results', icon: BarChart3, route: `/clinic/${clinicId}/analytics` },
        { name: 'Daily Results', label: 'Daily Results', icon: FileText, route: `/clinic/${clinicId}/analytics/daily` }
      ]
    },
    {
      title: 'Settings',
      items: [
        ...(role === 'clinic_owner' ? [{ name: 'Settings', label: 'Settings', icon: Settings, route: `/clinic/${clinicId}/settings` }] : []),
        { name: 'Master File Directory', label: 'Master File Directory', icon: FolderOpen, route: `/clinic/${clinicId}/master-files/dashboard` }
      ]
    }];

  const sections = role === 'staff' ? staffSections : ownerOrAssociateSections;

  const displayClinicName = currentClinic?.name || currentClinic?.legalBusinessName || 'Clinic';

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`} aria-label="Clinic Subsystem Sidebar">
      <div className="sidebar-header clinic-subsystem-sidebar__header">
        <div className="clinic-subsystem-sidebar__identity clinic-subsystem-sidebar__identity--compact">
          <strong className="clinic-subsystem-sidebar__title" title={displayClinicName}>
            {displayClinicName}
          </strong>
          <button
            className="sidebar-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Clinic Subsystem Navigation" style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map(section => (
          <div key={section.title} className="sidebar-section">
            <span className="sidebar-section-title">{section.title}</span>
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = item.name === 'Master File Directory'
                ? currentRoute.startsWith(`/clinic/${clinicId}/master-files`)
                : currentRoute === item.route;
              return (
                <button
                  key={item.name}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => onNavigate(item.name, item.route)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon size={18} />
                  <span className="sidebar-link-text">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-link"
          style={{ padding: sidebarCollapsed ? '0' : '0.625rem 0.75rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
          onClick={() => alert('Help center (mock UI).')}
          title="Help"
        >
          <HelpCircle size={18} />
          <span className="sidebar-link-text">Help</span>
        </button>
        <button
          className="sidebar-link danger"
          style={{ padding: sidebarCollapsed ? '0' : '0.625rem 0.75rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
          onClick={onLogout}
          title="Exit Branch"
        >
          <LogOut size={18} />
          <span className="sidebar-link-text">Exit Branch</span>
        </button>
      </div>
    </aside>
  );
}
