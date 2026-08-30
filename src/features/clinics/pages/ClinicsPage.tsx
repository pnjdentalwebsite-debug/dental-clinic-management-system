import { useMemo, useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Search,
  MapPin,
  Phone,
  Stethoscope,
  Users,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { platformAdminClinicService as mockClinicService, platformAdminDirectoryService as mockPlatformManagementService } from '../../platformManagement/realData/platformAdminRealDataService';
import { usePlatformAdminReadModel } from '../../platformManagement/realData/PlatformAdminReadProvider';
import { ClinicActionDialog, type ClinicDialogAction } from '../components/ClinicActionDialog';
import { ClinicActionMenu } from '../components/ClinicActionMenu';
import type { Clinic, ClinicFilters, ClinicSort } from '../types';

interface Props {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell: () => void;
}

const PAGE_SIZE = 8;
const tabs = ['all', 'pending', 'active', 'draft', 'inactive', 'archived'] as const;
const format = (value: string) => value.replaceAll('_', ' ');
const defaultFilters: ClinicFilters = { 
  search: '', 
  subscriberId: 'all', 
  status: 'all', 
  primary: 'all', 
  province: '', 
  city: '', 
  dentistAssignment: 'all', 
  staffAssignment: 'all', 
  createdDate: '', 
  tab: 'all' 
};

export function ClinicsPage({ navigate, showToast, refreshShell }: Props) {
  const showReadOnlyNotice = () => showToast('Clinic editing is unavailable until an approved secure mutation contract is deployed.', 'info');
  const { revision, refresh: refreshRealData } = usePlatformAdminReadModel();
  const [filters, setFilters] = useState<ClinicFilters>(defaultFilters);
  const [sort, setSort] = useState<ClinicSort>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [action, setAction] = useState<ClinicDialogAction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const clinics = useMemo(() => mockClinicService.listClinics(), [refreshKey, revision]);
  const subscribers = useMemo(() => mockPlatformManagementService.listSubscribers(), [refreshKey, revision]);
  const users = useMemo(() => mockPlatformManagementService.listUsers(), [refreshKey, revision]);
  const summary = useMemo(() => mockClinicService.getClinicSummary(), [refreshKey, revision]);
  const displayed = useMemo(() => mockClinicService.sortClinics(mockClinicService.filterClinics(clinics, filters), sort), [clinics, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paged = mockClinicService.paginateClinics(displayed, page, PAGE_SIZE);

  const refresh = () => { 
    void refreshRealData();
    setRefreshKey(prev => prev + 1); 
    refreshShell(); 
    showToast('Clinics registry refreshed.', 'info');
  };

  const getSubscriber = (id: string) => subscribers.find(item => item.id === id || item.subscriberNumber === id) || subscribers[0];
  
  const ownerName = (id?: string) => {
    const user = users.find(item => item.id === id || item.userNumber === id);
    return user?.fullName || 'Angelo Mhyr Lagsac';
  };

  const setFilter = (key: keyof ClinicFilters, value: string) => { 
    setPage(1); 
    setFilters(prev => ({ ...prev, [key]: value })); 
  };

  const changeSort = (field: ClinicSort['field']) => {
    setSort(prev => ({ 
      field, 
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc' 
    }));
  };

  const openAction = (clinic: Clinic, nextAction: ClinicDialogAction) => { 
    setSelectedClinic(clinic); 
    setAction(nextAction); 
  };

  const submitAction = (payload: Record<string, string | boolean>) => {
    if (!selectedClinic || !action) return;
    const result =
      action === 'activate' ? mockClinicService.activateClinic(selectedClinic.id) :
      action === 'deactivate' ? mockClinicService.deactivateClinic(selectedClinic.id, String(payload.reason || '')) :
      action === 'archive' ? mockClinicService.archiveClinic(selectedClinic.id, String(payload.reason || '')) :
      action === 'restore' ? mockClinicService.restoreClinic(selectedClinic.id, true) :
      action === 'set_primary' ? mockClinicService.setPrimaryClinic(selectedClinic.id) :
      action === 'delete_permanent' ? mockClinicService.permanentlyDeleteClinic(selectedClinic.id) :
      action === 'assign_dentist' ? mockClinicService.assignUserToClinic(selectedClinic.id, String(payload.userId || ''), 'associate', String(payload.note || '')) :
      action === 'assign_staff' ? mockClinicService.assignUserToClinic(selectedClinic.id, String(payload.userId || ''), 'staff', String(payload.note || '')) :
      action === 'change_admin' ? mockClinicService.changePrimaryAdministrator(selectedClinic.id, String(payload.userId || ''), String(payload.note || '')) :
      mockClinicService.removeUserFromClinic(String(payload.assignmentId || ''), String(payload.reason || ''));
    if (result.ok) {
      showToast(`Clinic ${action.replace('_', ' ')} completed.`, 'success');
      setRefreshKey(k => k + 1);
      refreshShell();
      setAction(null);
      setSelectedClinic(null);
    } else {
      showToast(result.error || 'Clinic action failed.', 'error');
    }
  };

  const actions = (clinic: Clinic) => (
    <ClinicActionMenu 
      clinic={clinic} 
      onView={() => navigate(`/platform/clinics/${clinic.id}`)} 
      onEdit={showReadOnlyNotice}
      onViewSubscriber={() => navigate(`/platform/subscribers/${clinic.subscriberId}`)} 
      onManageUsers={() => navigate(`/platform/clinics/${clinic.id}`)} 
      onViewLabs={() => showToast('Open the Partner Laboratories module to view real laboratory connections.', 'info')} 
      onActivate={() => openAction(clinic, 'activate')} 
      onDeactivate={() => openAction(clinic, 'deactivate')} 
      onSetPrimary={() => openAction(clinic, 'set_primary')} 
      onRestore={() => openAction(clinic, 'restore')} 
      onArchive={() => openAction(clinic, 'archive')} 
      onDelete={() => openAction(clinic, 'delete_permanent')}
    />
  );

  return (
    <main className="main-content">
      {/* HEADER */}
      <PlatformPageHeader
        title="Dental Clinic Branches"
        subtitle="Manage dental clinic locations, branch details, operating chairs, and assigned personnel."
        breadcrumbs={['Platform', 'Clinics & Laboratories', 'Dental Clinics']}
        secondaryAction={{
          label: 'Refresh Clinics',
          icon: RefreshCw,
          onClick: refresh
        }}
      />

      {/* 4 HERO KPI STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Clinics</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{summary.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Registered and pending facility locations</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Branches</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{summary.active}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>In operational service</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c026d3', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Headquarters</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c026d3' }}>
              <Sparkles size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c026d3' }}>{summary.primary}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Main subscriber clinics</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personnel Assigned</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed' }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed' }}>
            {clinics.reduce((acc, c) => acc + c.dentistUserIds.length + c.staffUserIds.length, 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Dentists & staff on duty</div>
        </div>
      </div>

      {/* FILTER TABS & CONTROLS */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map(t => {
              const count = t === 'all' ? clinics.length : clinics.filter(c => c.status === t).length;
              const isActive = filters.tab === t;
              return (
                <button
                  key={t}
                  className={`tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setFilter('tab', t)}
                  style={{
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.85rem',
                    borderRadius: '8px'
                  }}
                >
                  {format(t)} ({count})
                </button>
              );
            })}
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
              placeholder="Search by clinic name, branch code, city, subscriber..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
            />
          </div>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '180px', height: '40px', fontSize: '0.85rem' }}
            value={filters.subscriberId}
            onChange={e => setFilter('subscriberId', e.target.value)}
          >
            <option value="all">All Subscribers</option>
            {subscribers.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.businessName}</option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ width: 'auto', minWidth: '140px', height: '40px', fontSize: '0.85rem' }}
            value={filters.status}
            onChange={e => setFilter('status', e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
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
                  <button className="table-sort" onClick={() => changeSort('name')}>Clinic & Branch</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Subscriber Organization</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Location & Contact</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Staffing</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(clinic => {
                const sub = getSubscriber(clinic.subscriberId);
                const initials = clinic.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
                const isMain = clinic.isPrimaryClinic || clinic.branchType === 'main';

                return (
                  <tr key={clinic.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* CLINIC & BRANCH */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: isMain ? '#eff6ff' : '#f0fdf4',
                          color: isMain ? '#1d4ed8' : '#15803d',
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
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{clinic.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              backgroundColor: isMain ? '#dbeafe' : '#e2e8f0',
                              color: isMain ? '#1e40af' : '#475569'
                            }}>
                              {isMain ? 'Main Branch' : 'Satellite'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{clinic.clinicNumber}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SUBSCRIBER */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                          {sub?.businessName || clinic.name || 'Clinic'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.15rem' }}>
                          <span style={{ color: '#64748b' }}>Owner:</span> <strong style={{ color: '#0f172a' }}>{ownerName(clinic.primaryOwnerUserId)}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.1rem' }}>
                          {sub?.email || clinic.email || ''}
                        </div>
                      </div>
                    </td>

                    {/* LOCATION & CONTACT */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#334155', fontSize: '0.825rem' }}>
                          <MapPin size={13} color="#64748b" />
                          <span>{clinic.city}, {clinic.province}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#64748b', fontSize: '0.75rem' }}>
                          <Phone size={12} color="#94a3b8" />
                          <span>{clinic.contactNumber || '09538343050'}</span>
                        </div>
                      </div>
                    </td>

                    {/* STAFFING */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          fontWeight: 600
                        }}>
                          <Stethoscope size={11} /> {clinic.dentistUserIds.length} {clinic.dentistUserIds.length === 1 ? 'Dentist' : 'Dentists'}
                        </span>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          backgroundColor: '#faf5ff',
                          color: '#7e22ce',
                          fontWeight: 600
                        }}>
                          <Users size={11} /> {clinic.staffUserIds.length} Staff
                        </span>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: clinic.status === 'active' ? '#ecfdf5' : clinic.status === 'inactive' ? '#fef2f2' : '#f8fafc',
                        color: clinic.status === 'active' ? '#166534' : clinic.status === 'inactive' ? '#991b1b' : '#475569',
                        border: clinic.status === 'active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: clinic.status === 'active' ? '#16a34a' : '#ef4444' }} />
                        {format(clinic.status)}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {actions(clinic)}
                    </td>
                  </tr>
                );
              })}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <Building2 size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#475569' }}>No clinics match the current criteria</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing filters or search keywords.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.85rem', color: '#64748b' }}>
            <div>Showing <strong>{paged.length}</strong> of <strong>{displayed.length}</strong> clinic branches</div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: page === 1 ? '#f8fafc' : '#ffffff',
                  color: page === 1 ? '#cbd5e1' : '#334155',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Page {page} of {pageCount}</span>
              <button
                disabled={page === pageCount}
                onClick={() => setPage(prev => Math.min(pageCount, prev + 1))}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: page === pageCount ? '#f8fafc' : '#ffffff',
                  color: page === pageCount ? '#cbd5e1' : '#334155',
                  cursor: page === pageCount ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
          {paged.map(clinic => {
            const sub = getSubscriber(clinic.subscriberId);
            const initials = clinic.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
            const isMain = clinic.isPrimaryClinic || clinic.branchType === 'main';

            return (
              <div
                key={clinic.id}
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
                        backgroundColor: isMain ? '#eff6ff' : '#f0fdf4',
                        color: isMain ? '#1d4ed8' : '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {initials}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{clinic.name}</h3>
                        <span style={{ fontSize: '0.75rem', color: isMain ? '#1e40af' : '#64748b', fontWeight: 600 }}>
                          {isMain ? 'Primary Main Branch' : 'Satellite Branch'}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: clinic.status === 'active' ? '#ecfdf5' : '#f8fafc',
                      color: clinic.status === 'active' ? '#166534' : '#475569'
                    }}>
                      {format(clinic.status)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Subscriber:</strong> {sub?.businessName || 'Not available'}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Clinic Owner:</strong> {ownerName(clinic.primaryOwnerUserId)} ({sub?.email || 'gelomhyr@gmail.com'})
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Location:</strong> {clinic.addressLine1 ? `${clinic.addressLine1}, ` : ''}{clinic.city}, {clinic.province}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Staffing:</strong> {clinic.dentistUserIds.length} Dentists • {clinic.staffUserIds.length} Staff
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{clinic.clinicNumber}</span>
                  {actions(clinic)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ClinicActionDialog 
        open={Boolean(action && selectedClinic)} 
        action={action} 
        clinic={selectedClinic} 
        users={users} 
        assignments={selectedClinic ? mockClinicService.getClinicAssignments(selectedClinic.id) : []} 
        onClose={() => { setAction(null); setSelectedClinic(null); }} 
        onSubmit={submitAction} 
      />
    </main>
  );
}
