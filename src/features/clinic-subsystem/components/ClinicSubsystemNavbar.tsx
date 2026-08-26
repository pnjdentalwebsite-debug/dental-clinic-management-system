import { useState } from 'react';
import { Search, Plus, Bell, LogOut, ChevronDown, Menu } from 'lucide-react';

interface Props {
  loggedUserName: string;
  loggedUserEmail: string;
  onLogout: () => void;
  onToggleSidebarMobile: () => void;
  onAddPatient?: () => void;
  showToast: (msg: string, type?: 'success' | 'info') => void;
  currentClinic: any;
  role?: 'clinic_owner' | 'associate' | 'staff';
}

export function ClinicSubsystemNavbar({
  loggedUserName,
  loggedUserEmail,
  onLogout,
  onToggleSidebarMobile,
  onAddPatient,
  showToast,
  currentClinic,
  role = 'clinic_owner'
}: Props) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const roleLabel = role === 'associate' ? 'Associate Dentist' : role === 'staff' ? 'Clinic Staff' : 'Clinic Owner';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      showToast(`Searching patient database for "${searchVal}" (mock UI).`, 'info');
    }
  };

  const handleAddPatient = () => {
    if (onAddPatient) {
      onAddPatient();
      return;
    }
    showToast('Add Patient stepper wizard flow is not connected on this screen yet.', 'info');
  };

  return (
    <header className="top-nav">
      <div className="top-nav-left" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
        <button className="hamburger-btn" onClick={onToggleSidebarMobile} aria-label="Toggle mobile navigation">
          <Menu size={20} />
        </button>

        {/* Patient Search and Add Button */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '480px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search patient name, ID, contact..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 1rem 0.45rem 2.25rem',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary compact-action"
            onClick={handleAddPatient}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              whiteSpace: 'nowrap',
              height: '34px',
              padding: '0 0.75rem',
              fontSize: '0.8rem',
              width: 'auto'
            }}
          >
            <Plus size={14} /> Add Patient
          </button>
        </form>
      </div>

      <div className="top-nav-right" style={{ gap: '0.75rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.75rem', lineHeight: 1.2 }}>
          <strong style={{ color: 'var(--text-primary)' }}>{roleLabel}</strong>
          <span style={{ color: 'var(--text-muted)' }}>{currentClinic?.name || currentClinic?.legalBusinessName || 'Clinic Workspace'}</span>
        </div>
        <span className="badge-prototype" style={{ background: 'var(--success-light)', color: 'var(--success)', borderColor: 'transparent', fontSize: '0.75rem' }}>
          ● Active
        </span>
        
        <button className="top-nav-btn" aria-label="Notifications" onClick={() => alert('Branch notifications feature (mock only).')}>
          <Bell size={18} />
        </button>

        {/* User profile avatar dropdown */}
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
                <small style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  Role: {roleLabel}
                </small>
              </div>
              <button className="profile-dropdown-item" onClick={() => alert('Profile and account preferences (mock).')}>
                Account Settings
              </button>
              <button className="profile-dropdown-item" onClick={() => alert('Switch branch console option (mock).')}>
                Switch Branch
              </button>
              <button className="profile-dropdown-item danger" onClick={onLogout}>
                <LogOut size={14} /> Exit Branch
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
