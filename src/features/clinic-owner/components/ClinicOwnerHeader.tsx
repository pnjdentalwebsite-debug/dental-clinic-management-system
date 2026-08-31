import { useState } from 'react';
import { Menu, RefreshCw, Bell, LogOut, ChevronDown, CheckCircle2 } from 'lucide-react';

interface Props {
  roleLabel?: string;
  loggedUserName: string;
  loggedClinicName: string;
  loggedPlanName: string;
  loggedUserEmail: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  onLogout: () => void;
  onToggleSidebarMobile: () => void;
}

export function ClinicOwnerHeader({
  roleLabel = 'Clinic Owner',
  loggedUserName,
  loggedClinicName,
  loggedPlanName,
  loggedUserEmail,
  isRefreshing,
  onRefresh,
  onLogout,
  onToggleSidebarMobile
}: Props) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isRoleWorkspace = roleLabel !== 'Clinic Owner';

  return (
    <header className="top-nav">
      <div className="top-nav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="hamburger-btn" onClick={onToggleSidebarMobile} aria-label="Toggle mobile navigation">
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.08rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{roleLabel}</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{loggedClinicName}</span>
          </div>
          {!isRoleWorkspace && <span className="badge-prototype" style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'var(--primary-border)', fontSize: '0.75rem', padding: '0.1rem 0.5rem', whiteSpace: 'nowrap' }}>
            {loggedPlanName} Subscription
          </span>}
        </div>
      </div>
      <div className="top-nav-right">
        <button className="top-nav-btn" onClick={onRefresh} aria-label="Refresh application state">
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : {}} />
        </button>
        <div className="profile-menu-container" style={{ position: 'relative' }}>
        <button className="top-nav-btn" aria-label="Notifications" onClick={() => setNotificationsOpen((open) => !open)}>
          <Bell size={18} />
        </button>
        {notificationsOpen && <div className="profile-dropdown role-notifications" style={{ right: 0, top: '100%', position: 'absolute', marginTop: '0.5rem', zIndex: 100, minWidth: '260px' }}><div className="profile-dropdown-header"><p className="profile-name">Notifications</p><p className="profile-email">Your workspace is up to date.</p></div><div className="profile-dropdown-item"><CheckCircle2 size={14} /> No new notifications</div></div>}
        </div>
        <div className="profile-menu-container" style={{ position: 'relative' }}>
          <button className="profile-trigger" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div className="profile-avatar">{loggedUserName.slice(0, 1)}</div>
            <ChevronDown size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>
          {profileDropdownOpen && (
            <div className="profile-dropdown" style={{ right: 0, top: '100%', position: 'absolute', marginTop: '0.5rem', zIndex: 100 }}>
              <div className="profile-dropdown-header">
                <p className="profile-name">{loggedUserName}</p>
                <p className="profile-email">{loggedUserEmail}</p>
                <p className="profile-email">Role: {roleLabel}</p>
              </div>
              <button className="profile-dropdown-item danger" onClick={onLogout}>
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
