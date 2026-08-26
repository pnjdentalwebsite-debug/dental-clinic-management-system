
import { 
  LayoutDashboard, 
  Building, 
  FlaskConical, 
  UserSquare2, 
  Users, 
  BarChart3, 
  DollarSign, 
  FileText, 
  Settings,
  Menu,
  RotateCcw,
  LogOut
} from 'lucide-react';

interface Props {
  currentRoute: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  onNavigate: (name: string, route: string) => void;
  onResetMock: () => void;
  onLogout: () => void;
  mobileSidebarOpen: boolean;
}

export function ClinicOwnerSidebar({
  currentRoute,
  sidebarCollapsed,
  setSidebarCollapsed,
  onNavigate,
  onResetMock,
  onLogout,
  mobileSidebarOpen
}: Props) {
  const sections = [
    {
      title: 'Hub',
      items: [
        { name: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard, route: '/clinic/dashboard' }
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Clinic Branches', label: 'Clinic Branches', icon: Building, route: '/clinic/branches' },
        { name: 'Dental Laboratories', label: 'Dental Laboratories', icon: FlaskConical, route: '/clinic/laboratories' },
        { name: 'Associate Dentists', label: 'Associate Dentists', icon: UserSquare2, route: '/clinic/dentists' },
        { name: 'Staff Management', label: 'Staff Management', icon: Users, route: '/clinic/staff' }
      ]
    },
    {
      title: 'Insights',
      items: [
        { name: 'Analytics', label: 'Analytics', icon: BarChart3, route: '/clinic/analytics' },
        { name: 'Sales Overview', label: 'Sales Overview', icon: DollarSign, route: '/clinic/sales' },
        { name: 'Daily Reports', label: 'Daily Reports', icon: FileText, route: '/clinic/daily-reports' }
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'General Settings', label: 'General Settings', icon: Settings, route: '/clinic/settings' }
      ]
    }
  ];

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`} aria-label="Clinic Owner Sidebar">
      <div className="sidebar-header">
        <div 
          className="sidebar-brand" 
          onClick={() => onNavigate('Dashboard', '/clinic/dashboard')} 
          style={{ cursor: 'pointer' }}
        >
          <FlaskConical size={28} className="sidebar-logo" />
          <span className="sidebar-brand-name">Clinic Console</span>
        </div>
        <button 
          className="sidebar-collapse-btn" 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={18} />
        </button>
      </div>

      <nav className="sidebar-nav" aria-label="Clinic Owner Navigation">
        {sections.map(section => (
          <div key={section.title} className="sidebar-section">
            <span className="sidebar-section-title">{section.title}</span>
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;
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
          className="sidebar-link warning" 
          style={{ border: '1px solid rgba(255,255,255,0.1)', padding: sidebarCollapsed ? '0' : '0.625rem 0.75rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }} 
          onClick={onResetMock}
          title="Reset Mock Data"
        >
          <RotateCcw size={18} />
          <span className="sidebar-link-text">Reset Mock Data</span>
        </button>
        <button 
          className="sidebar-link danger" 
          style={{ padding: sidebarCollapsed ? '0' : '0.625rem 0.75rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
          onClick={onLogout}
          title="Sign Out"
        >
          <LogOut size={18} />
          <span className="sidebar-link-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
