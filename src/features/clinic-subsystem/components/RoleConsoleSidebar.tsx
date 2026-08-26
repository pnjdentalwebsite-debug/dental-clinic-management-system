import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, Users, UserRound, Building2 } from 'lucide-react';

interface Props {
  role: 'associate' | 'staff';
  currentRoute: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export function RoleConsoleSidebar({ role, currentRoute, collapsed, mobileOpen, onToggle, onNavigate, onLogout }: Props) {
  const isAssociate = role === 'associate';
  const items = [
    { label: 'Dashboard', icon: LayoutDashboard, route: `/${role}/workspace` },
    { label: 'Assigned Clinics', icon: Building2, route: `/${role}/workspace#clinics` },
    { label: isAssociate ? 'My Schedule' : 'My Schedule & Tasks', icon: CalendarDays, route: `/${role}/workspace#schedule` },
    { label: 'My Profile', icon: isAssociate ? UserRound : Users, route: `/${role}/workspace#profile` },
    ...(isAssociate ? [{ label: 'Clinical Work', icon: ClipboardList, route: `/${role}/workspace#clinical-work` }] : [])
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} aria-label={`${isAssociate ? 'Associate Dentist' : 'Staff Member'} navigation`}>
      <div className="sidebar-header">
        <div className="sidebar-brand" onClick={() => onNavigate(`/${role}/workspace`)} role="button" tabIndex={0}>
          <Building2 size={28} className="sidebar-logo" />
          <span className="sidebar-brand-name">Clinic Console</span>
        </div>
        <button className="sidebar-collapse-btn" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}><Menu size={18} /></button>
      </div>
      <nav className="sidebar-nav" aria-label="Role workspace navigation">
        <div className="sidebar-section">
          <span className="sidebar-section-title">{isAssociate ? 'Clinical Workspace' : 'Operations Workspace'}</span>
          {items.map((item) => {
            const Icon = item.icon;
            const active = currentRoute === item.route || (item.route.includes('#') && currentRoute === item.route.split('#')[0] && item.label === 'Dashboard');
            return <button key={item.label} className={`sidebar-link ${active ? 'active' : ''}`} onClick={() => onNavigate(item.route)} title={collapsed ? item.label : undefined}><Icon size={18} /><span className="sidebar-link-text">{item.label}</span></button>;
          })}
        </div>
      </nav>
      <div className="sidebar-footer">
        <button className="sidebar-link danger" onClick={onLogout}><LogOut size={18} /><span className="sidebar-link-text">Sign Out</span></button>
      </div>
    </aside>
  );
}
