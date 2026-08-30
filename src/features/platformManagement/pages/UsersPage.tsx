import { useMemo, useState } from 'react';
import {
  Eye,
  KeyRound,
  PauseCircle,
  PlayCircle,
  XCircle,
  Users,
  UserCheck,
  Stethoscope,
  Building2,
  Clock,
  MapPin,
  Search,
  Trash2,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { Modal } from '../../../components/overlays/Modal';
import { RowActionMenu } from '../../../components/overlays/RowActionMenu';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { platformAdminClinicService as mockClinicService, platformAdminDirectoryService as mockPlatformManagementService } from '../realData/platformAdminRealDataService';
import { usePlatformAdminReadModel } from '../realData/PlatformAdminReadProvider';
import type { PlatformUser, SortState, UserFilters } from '../types';

interface UsersPageProps {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell: () => void;
}

type UserAction = 'suspend' | 'reactivate' | 'deactivate' | 'reset_password' | 'reassign_branch' | 'delete' | null;

const PAGE_SIZE = 8;
const defaultFilters: UserFilters = {
  search: '',
  role: 'all',
  subscriberId: 'all',
  clinicId: 'all',
  accountStatus: 'all',
  registeredDate: ''
};

const formatStatus = (value: string) => value.replaceAll('_', ' ');

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`status-badge ${mockPlatformManagementService.getStatusBadgeClass(status)}`}
    style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}
  >
    {formatStatus(status)}
  </span>
);

export function UsersPage({ navigate, showToast, refreshShell }: UsersPageProps) {
  const { revision, refresh: refreshRealData } = usePlatformAdminReadModel();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filters, setFilters] = useState<UserFilters>(defaultFilters);
  const [activeTab, setActiveTab] = useState<'all' | 'associate' | 'staff' | 'suspended'>('all');
  const [sort, setSort] = useState<SortState>({ field: 'registeredAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);
  const [selectedAction, setSelectedAction] = useState<UserAction>(null);
  const [selectedClinicIds, setSelectedClinicIds] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Exclude primary subscriber accounts (clinic_owner) so this page exclusively manages clinic personnel
  const allUsers = useMemo(() => {
    return mockPlatformManagementService.listUsers().filter(u => u.role !== 'clinic_owner');
  }, [refreshKey, revision]);

  const subscribers = useMemo(() => {
    return mockPlatformManagementService.listSubscribers();
  }, [refreshKey, revision]);

  const clinics = useMemo(() => {
    return mockClinicService.listClinics();
  }, [refreshKey, revision]);

  // Tab and search filtering
  const displayedUsers = useMemo(() => {
    let filtered = allUsers;

    if (activeTab === 'associate') filtered = filtered.filter(u => u.role === 'associate');
    if (activeTab === 'staff') filtered = filtered.filter(u => u.role === 'staff');
    if (activeTab === 'suspended') filtered = filtered.filter(u => u.accountStatus === 'suspended' || u.accountStatus === 'deactivated');

    if (filters.search.trim()) {
      const term = filters.search.trim().toLowerCase();
      filtered = filtered.filter(u => {
        const sub = subscribers.find(s => s.id === u.subscriberId);
        const userClinicsList = clinics.filter(c => u.clinicIds.includes(c.id));
        const clinicNames = userClinicsList.map(c => c.name).join(' ').toLowerCase();
        return (
          u.fullName.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term) ||
          u.mobileNumber.toLowerCase().includes(term) ||
          u.position.toLowerCase().includes(term) ||
          (sub?.businessName || '').toLowerCase().includes(term) ||
          (sub?.email || '').toLowerCase().includes(term) ||
          clinicNames.includes(term) ||
          u.userNumber.toLowerCase().includes(term)
        );
      });
    }

    if (filters.subscriberId !== 'all') {
      filtered = filtered.filter(u => u.subscriberId === filters.subscriberId);
    }
    if (filters.clinicId !== 'all') {
      filtered = filtered.filter(u => u.clinicIds.includes(filters.clinicId));
    }
    if (filters.accountStatus !== 'all') {
      filtered = filtered.filter(u => u.accountStatus === filters.accountStatus);
    }

    return mockPlatformManagementService.sortUsers(filtered, sort);
  }, [allUsers, activeTab, filters, subscribers, clinics, sort]);

  const pageCount = Math.max(1, Math.ceil(displayedUsers.length / PAGE_SIZE));
  const pagedUsers = mockPlatformManagementService.paginateUsers(displayedUsers, page, PAGE_SIZE);

  // Hero KPI Computations
  const totalPersonnel = allUsers.length;
  const activePersonnel = allUsers.filter(u => u.accountStatus === 'active').length;
  const totalDentists = allUsers.filter(u => u.role === 'associate').length;
  const totalStaff = allUsers.filter(u => u.role === 'staff').length;

  const changeSort = (field: string) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSubscriberForUser = (subscriberId?: string) => {
    if (!subscriberId) return undefined;
    return subscribers.find(item => item.id === subscriberId || item.subscriberNumber === subscriberId);
  };

  const getUserClinics = (user: PlatformUser) => {
    return clinics.filter(clinic => user.clinicIds.includes(clinic.id));
  };

  const getWorkScheduleText = (user: PlatformUser) => {
    const activeDays = Object.entries(user.workSchedule ?? {}).filter(([, schedule]) => schedule.enabled);
    if (activeDays.length === 0) return 'Not configured';
    return activeDays.map(([day, schedule]) => `${day.slice(0, 3)}: ${schedule.startTime || '—'} - ${schedule.endTime || '—'}`).join(' • ');
  };

  const openAction = (user: PlatformUser, action: UserAction) => {
    setSelectedUser(user);
    setSelectedAction(action);
    setSelectedClinicIds([...user.clinicIds]);
    setReason('');
  };

  const closeAction = () => {
    setSelectedUser(null);
    setSelectedAction(null);
    setReason('');
    setIsSubmitting(false);
  };

  const completeAction = () => {
    if (!selectedUser || !selectedAction) return;
    if ((selectedAction === 'suspend' || selectedAction === 'deactivate') && !reason.trim()) {
      showToast('Please provide a reason before confirming.', 'error');
      return;
    }
    setIsSubmitting(true);

    if (selectedAction === 'reset_password') {
      showToast('Personnel credential reset is unavailable until an approved secure mutation contract is deployed.', 'warning');
      closeAction();
      return;
    }

    if (selectedAction === 'reassign_branch') {
      const result = mockPlatformManagementService.updateUser(selectedUser.id, { clinicIds: selectedClinicIds });
      setIsSubmitting(false);
      showToast(result.error || 'Branch reassignment is unavailable until an approved secure mutation contract is deployed.', 'warning');
      return;
    }

    const result =
      selectedAction === 'suspend' ? mockPlatformManagementService.suspendUser(selectedUser.id, reason) :
      selectedAction === 'reactivate' ? mockPlatformManagementService.reactivateUser(selectedUser.id) :
      selectedAction === 'deactivate' ? mockPlatformManagementService.deactivateUser(selectedUser.id, reason) :
      selectedAction === 'delete' ? mockPlatformManagementService.deleteUser(selectedUser.id) :
      { ok: false, error: 'Unsupported action.' };

    if (result.ok) {
      showToast(selectedAction === 'delete' ? 'User permanently removed from platform.' : 'User status updated successfully.', 'success');
      setRefreshKey(k => k + 1);
      refreshShell();
      closeAction();
    } else {
      setIsSubmitting(false);
      showToast(result.error || 'Operation failed.', 'error');
    }
  };

  const renderActions = (user: PlatformUser) => {
    const userClinicList = getUserClinics(user);
    return (
      <RowActionMenu
        ariaLabel={`Actions for personnel ${user.userNumber}`}
        items={[
          { id: 'view', label: 'View Personnel Profile', icon: Eye, onSelect: () => navigate(`/platform/users/${user.id}`) },
          { id: 'reassign', label: 'Change Branch Assignment', icon: Building2, onSelect: () => openAction(user, 'reassign_branch') },
          { id: 'reset', label: 'Reset User Password', icon: KeyRound, onSelect: () => openAction(user, 'reset_password') },
          { id: 'sep-relationships', separator: true },
          { id: 'subscriber', label: 'View Subscriber Org', icon: Users, disabled: !user.subscriberId, onSelect: () => navigate(`/platform/subscribers/${user.subscriberId}`) },
          { id: 'clinic', label: 'View Primary Branch', icon: MapPin, disabled: userClinicList.length === 0, onSelect: () => navigate(`/platform/clinics/${userClinicList[0]?.id || ''}`) },
          { id: 'sep-account', separator: true },
          { id: 'suspend', label: 'Suspend Account', icon: PauseCircle, hidden: user.accountStatus !== 'active', destructive: true, onSelect: () => openAction(user, 'suspend') },
          { id: 'reactivate', label: 'Reactivate Account', icon: PlayCircle, hidden: user.accountStatus !== 'suspended', onSelect: () => openAction(user, 'reactivate') },
          { id: 'deactivate', label: 'Deactivate Account', icon: XCircle, hidden: user.accountStatus === 'deactivated', destructive: true, onSelect: () => openAction(user, 'deactivate') },
          { id: 'sep-danger', separator: true },
          { id: 'delete', label: 'Delete Personnel Permanently', icon: Trash2, destructive: true, onSelect: () => openAction(user, 'delete') }
        ]}
      />
    );
  };

  return (
    <main className="main-content">
      <PlatformPageHeader
        title="Clinic Staff & Doctors Directory"
        subtitle="Directory of associate dentists, clinic staff, and team accounts across all dental branches."
        breadcrumbs={['Platform', 'Clinic Accounts', 'Clinic Staff & Doctors']}
        secondaryAction={{
          label: 'Refresh Personnel',
          icon: RefreshCw,
          onClick: () => {
            void refreshRealData();
            setRefreshKey(k => k + 1);
            refreshShell();
            showToast('Personnel directory refreshed.', 'info');
          }
        }}
      />

      {/* HERO METRICS BANNER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Personnel</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{totalPersonnel}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Registered by subscribers</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Personnel</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>{activePersonnel}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>In active operational standing</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Associate Dentists</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
              <Stethoscope size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0284c7' }}>{totalDentists}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Licensed clinicians</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Auxiliary Staff</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#9333ea' }}>{totalStaff}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Dental assistants & front desk</div>
        </div>
      </div>

      {/* FILTER TABS & CONTROLS */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => { setActiveTab('all'); setPage(1); }}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              All Personnel ({totalPersonnel})
            </button>
            <button
              className={`tab-btn ${activeTab === 'associate' ? 'active' : ''}`}
              onClick={() => { setActiveTab('associate'); setPage(1); }}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              Associate Dentists ({totalDentists})
            </button>
            <button
              className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => { setActiveTab('staff'); setPage(1); }}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              Clinic Staff ({totalStaff})
            </button>
            <button
              className={`tab-btn ${activeTab === 'suspended' ? 'active' : ''}`}
              onClick={() => { setActiveTab('suspended'); setPage(1); }}
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem', borderRadius: '8px' }}
            >
              Suspended ({allUsers.filter(u => u.accountStatus === 'suspended' || u.accountStatus === 'deactivated').length})
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
            <button
              className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline'}`}
              style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              onClick={() => setViewMode('cards')}
            >
              Card Grid
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px', height: '40px', fontSize: '0.875rem' }}
              placeholder="Search by personnel name, email, phone, branch, subscriber..."
              value={filters.search}
              onChange={e => { setFilters(prev => ({ ...prev, search: e.target.value })); setPage(1); }}
            />
          </div>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '180px', height: '40px', fontSize: '0.85rem' }}
            value={filters.subscriberId}
            onChange={e => { setFilters(prev => ({ ...prev, subscriberId: e.target.value })); setPage(1); }}
          >
            <option value="all">All Subscribers</option>
            {subscribers.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.businessName}</option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '180px', height: '40px', fontSize: '0.85rem' }}
            value={filters.clinicId}
            onChange={e => { setFilters(prev => ({ ...prev, clinicId: e.target.value })); setPage(1); }}
          >
            <option value="all">All Clinic Branches</option>
            {clinics.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '140px', height: '40px', fontSize: '0.85rem' }}
            value={filters.accountStatus}
            onChange={e => { setFilters(prev => ({ ...prev, accountStatus: e.target.value })); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="table-container" style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  <button className="table-sort" onClick={() => changeSort('fullName')}>Personnel & Role</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Subscriber Organization</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Designated Branch (Destino)</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Work Hours / Schedule</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Contact & Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map(user => {
                const sub = getSubscriberForUser(user.subscriberId);
                const userClinicsList = getUserClinics(user);
                const initials = user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                const isDentist = user.role === 'associate';

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* PERSONNEL & ROLE */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: isDentist ? '#e0f2fe' : '#f3e8ff',
                          color: isDentist ? '#0369a1' : '#7e22ce',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{user.fullName}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              backgroundColor: isDentist ? '#f0f9ff' : '#faf5ff',
                              color: isDentist ? '#0284c7' : '#9333ea',
                              border: isDentist ? '1px solid #bae6fd' : '1px solid #e9d5ff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              {isDentist ? <Stethoscope size={10} /> : <Users size={10} />}
                              {user.position || (isDentist ? 'Associate Dentist' : 'Clinic Staff')}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{user.userNumber}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PARENT SUBSCRIBER */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                          {sub?.businessName || 'Unassigned Clinic'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                          <span style={{ color: '#64748b' }}>Clinic Owner:</span> <strong style={{ color: '#0f172a' }}>{sub?.primaryClinicName || sub?.businessName || 'N/A'}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.1rem' }}>
                          {sub?.email || ''}
                        </div>
                      </div>
                    </td>

                    {/* DESIGNATED CLINIC BRANCH */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {userClinicsList.map(c => (
                          <span
                            key={c.id}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#0f172a',
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              width: 'fit-content'
                            }}
                          >
                            <MapPin size={12} color="#64748b" />
                            {c.name}
                          </span>
                        ))}
                        {userClinicsList.length === 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>All subscriber facilities</span>
                        )}
                      </div>
                    </td>

                    {/* WORK SCHEDULE */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} color="#0284c7" />
                        <span>{getWorkScheduleText(user)}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', display: 'inline-block' }}>
                        📅 6 Days / Week (Standard Shift)
                      </span>
                    </td>

                    {/* CONTACT & STATUS */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }}>{user.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.mobileNumber}</div>
                      <div style={{ marginTop: '0.3rem' }}>
                        <StatusBadge status={user.accountStatus} />
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {renderActions(user)}
                    </td>
                  </tr>
                );
              })}

              {pagedUsers.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                    No clinic personnel records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {pagedUsers.map(user => {
            const sub = getSubscriberForUser(user.subscriberId);
            const userClinicsList = getUserClinics(user);
            const initials = user.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
            const isDentist = user.role === 'associate';

            return (
              <div
                key={user.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: isDentist ? '#e0f2fe' : '#f3e8ff',
                        color: isDentist ? '#0369a1' : '#7e22ce',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem'
                      }}>
                        {initials}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{user.fullName}</h3>
                        <span style={{ fontSize: '0.75rem', color: isDentist ? '#0284c7' : '#9333ea', fontWeight: 600 }}>
                          {user.position || (isDentist ? 'Associate Dentist' : 'Clinic Staff')}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={user.accountStatus} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Subscriber Clinic:</strong> {sub?.businessName || 'Unassigned'}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Clinic Owner:</strong> {sub?.primaryClinicName || sub?.businessName || 'N/A'} ({sub?.email || 'N/A'})
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Branch Destino:</strong> {userClinicsList.map(c => c.name).join(', ') || 'No branch assigned'}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Hours:</strong> {getWorkScheduleText(user)}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Contact:</strong> {user.email} • {user.mobileNumber}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{user.userNumber}</span>
                  {renderActions(user)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {pageCount > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing {pagedUsers.length} of {displayedUsers.length} personnel
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn btn-outline"
              style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
              Page {page} of {pageCount}
            </span>
            <button
              className="btn btn-outline"
              style={{ width: 'auto', padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
              disabled={page === pageCount}
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ACTION MODAL */}
      <Modal
        open={Boolean(selectedAction && selectedUser)}
        title={
          selectedAction === 'delete' ? 'Delete Personnel Permanently' :
          selectedAction === 'reassign_branch' ? 'Manage Clinic Branch Destination' :
          selectedAction === 'reset_password' ? 'Reset User Password' :
          selectedAction === 'suspend' ? 'Suspend Personnel Access' :
          selectedAction === 'reactivate' ? 'Reactivate Personnel Access' :
          selectedAction === 'deactivate' ? 'Deactivate Personnel Account' :
          'Personnel Action'
        }
        description={selectedUser?.fullName}
        onClose={isSubmitting ? () => undefined : closeAction}
        closeOnBackdrop={!isSubmitting}
        closeOnEscape={!isSubmitting}
        role={selectedAction === 'suspend' || selectedAction === 'deactivate' || selectedAction === 'delete' ? 'alertdialog' : 'dialog'}
        footer={(
          <>
            <button className="btn btn-outline" style={{ width: 'auto' }} onClick={closeAction} disabled={isSubmitting}>Cancel</button>
            <button
              className="btn btn-primary"
              style={{ width: 'auto', backgroundColor: selectedAction === 'suspend' || selectedAction === 'deactivate' || selectedAction === 'delete' ? '#dc2626' : undefined }}
              onClick={completeAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : selectedAction === 'delete' ? 'Delete Permanently' : 'Confirm'}
            </button>
          </>
        )}
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedAction === 'reassign_branch' && (
              <div>
                <label className="form-label" style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>
                  Select Designated Clinic Branches for {selectedUser.fullName}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {clinics
                    .filter(c => !selectedUser.subscriberId || c.subscriberId === selectedUser.subscriberId)
                    .map(clinic => {
                      const isChecked = selectedClinicIds.includes(clinic.id);
                      return (
                        <label
                          key={clinic.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            border: isChecked ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                            backgroundColor: isChecked ? '#eff6ff' : '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedClinicIds([...selectedClinicIds, clinic.id]);
                              } else {
                                setSelectedClinicIds(selectedClinicIds.filter(id => id !== clinic.id));
                              }
                            }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>{clinic.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{clinic.addressLine1 || clinic.city} • {clinic.id}</div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            {selectedAction === 'reset_password' && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                  This will generate a secure one-time temporary password for <strong>{selectedUser.email}</strong> and require them to set a new password upon their next login to their branch terminal.
                </p>
              </div>
            )}

            {(selectedAction === 'suspend' || selectedAction === 'deactivate') && (
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Reason for Action *</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Disciplinary hold, schedule pause, employment review..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                />
              </div>
            )}

            {selectedAction === 'reactivate' && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                  Confirm reactivation of <strong>{selectedUser.fullName}</strong>. They will immediately regain operational access to their designated clinic branch terminals.
                </p>
              </div>
            )}

            {selectedAction === 'delete' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '8px' }}>
                  <ShieldAlert size={18} />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Permanent Personnel Deletion Warning</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.5 }}>
                  Are you sure you want to permanently delete <strong>{selectedUser.fullName}</strong> ({selectedUser.position || selectedUser.role})?
                </p>
                <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                  This action will remove their credentials, schedule appointments assignment, and clinic station authorization permanently.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </main>
  );
}
