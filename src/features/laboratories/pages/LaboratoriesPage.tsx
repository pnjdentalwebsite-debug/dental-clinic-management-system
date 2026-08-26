import { useMemo, useState } from 'react';
import { 
  FlaskConical, 
  Building2, 
  CheckCircle2, 
  Search,
  MapPin,
  Clock,
  PackageCheck,
  RefreshCw
} from 'lucide-react';
import { PlatformPageHeader } from '../../../components/PlatformShared';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import { LaboratoryActionDialog, type LaboratoryDialogAction } from '../components/LaboratoryActionDialog';
import { LaboratoryActionMenu } from '../components/LaboratoryActionMenu';
import { mockLaboratoryService } from '../services/mockLaboratoryService';
import type { Laboratory, LaboratoryFilters, LaboratorySort } from '../types';

interface Props {
  navigate: (route: string) => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  refreshShell: () => void;
}

const PAGE_SIZE = 8;
const tabs = ['all', 'active', 'draft', 'inactive', 'archived'] as const;
const format = (value: string) => value.replaceAll('_', ' ');
const defaultFilters: LaboratoryFilters = { 
  search: '', 
  subscriberId: 'all', 
  laboratoryType: 'all', 
  status: 'all', 
  province: '', 
  city: '', 
  clinicConnection: 'all', 
  preferred: 'all', 
  serviceAvailability: 'all', 
  createdDate: '', 
  tab: 'all' 
};

export function LaboratoriesPage({ navigate, showToast, refreshShell }: Props) {
  const [filters, setFilters] = useState<LaboratoryFilters>(defaultFilters);
  const [sort, setSort] = useState<LaboratorySort>({ field: 'createdAt', direction: 'desc' });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null);
  const [action, setAction] = useState<LaboratoryDialogAction | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const laboratories = useMemo(() => mockLaboratoryService.listLaboratories(), [refreshKey]);
  const subscribers = useMemo(() => mockPlatformManagementService.listSubscribers(), [refreshKey]);
  const summary = useMemo(() => mockLaboratoryService.getLaboratorySummary(), [refreshKey]);
  const displayed = useMemo(() => mockLaboratoryService.sortLaboratories(mockLaboratoryService.filterLaboratories(laboratories, filters), sort), [laboratories, filters, sort]);
  const pageCount = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paged = mockLaboratoryService.paginateLaboratories(displayed, page, PAGE_SIZE);

  const refresh = () => { 
    setRefreshKey(prev => prev + 1); 
    refreshShell(); 
    showToast('Laboratories network refreshed.', 'info');
  };

  const getSubscriber = (id: string) => subscribers.find(item => item.id === id || item.subscriberNumber === id) || subscribers[0];

  const setFilter = (key: keyof LaboratoryFilters, value: string) => { 
    setPage(1); 
    setFilters(prev => ({ ...prev, [key]: value })); 
  };

  const changeSort = (field: LaboratorySort['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openAction = (lab: Laboratory, nextAction: LaboratoryDialogAction) => { 
    setSelectedLab(lab); 
    setAction(nextAction); 
  };

  const runAction = (payload: Record<string, string | boolean | number | string[]>) => {
    if (!selectedLab || !action) return;
    const result =
      action === 'activate' ? mockLaboratoryService.activateLaboratory(selectedLab.id) :
      action === 'deactivate' ? mockLaboratoryService.deactivateLaboratory(selectedLab.id, String(payload.reason || '')) :
      action === 'archive' ? mockLaboratoryService.archiveLaboratory(selectedLab.id, String(payload.reason || '')) :
      action === 'restore' ? mockLaboratoryService.restoreLaboratory(selectedLab.id, true) :
      action === 'delete_permanent' ? mockLaboratoryService.permanentlyDeleteLaboratory(selectedLab.id) :
      { ok: false, error: 'Open laboratory details to manage clinic connections and services.' };
    if (result.ok) {
      showToast(`Laboratory ${action.replace('_', ' ')} completed.`, 'success');
      setRefreshKey(k => k + 1);
      refreshShell();
      setAction(null);
      setSelectedLab(null);
    } else showToast(result.error || 'Laboratory action failed.', 'error');
  };

  const actions = (lab: Laboratory) => (
    <LaboratoryActionMenu 
      laboratory={lab} 
      onView={() => navigate(`/platform/laboratories/${lab.id}`)} 
      onEdit={() => navigate(`/platform/laboratories/${lab.id}/edit`)} 
      onViewSubscriber={() => navigate(`/platform/subscribers/${lab.subscriberId}`)} 
      onManageClinics={() => navigate(`/platform/laboratories/${lab.id}`)} 
      onManageServices={() => navigate(`/platform/laboratories/${lab.id}`)} 
      onActivate={() => openAction(lab, 'activate')} 
      onDeactivate={() => openAction(lab, 'deactivate')} 
      onRestore={() => openAction(lab, 'restore')} 
      onArchive={() => openAction(lab, 'archive')} 
      onDelete={() => openAction(lab, 'delete_permanent')}
    />
  );

  return (
    <main className="main-content">
      {/* HEADER */}
      <PlatformPageHeader
        title="Partner Dental Laboratories"
        subtitle="Directory of partner dental laboratories for crowns, dentures, and clinic orders."
        breadcrumbs={['Platform', 'Clinics & Laboratories', 'Partner Laboratories']}
        secondaryAction={{
          label: 'Refresh Labs',
          icon: RefreshCw,
          onClick: refresh
        }}
      />

      {/* 4 HERO KPI STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Laboratories</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
              <FlaskConical size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>{summary.total}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Registered fabrication partners</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Centers</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>{summary.active}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>In operational fabrication</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connected Clinics</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Building2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>
            {laboratories.reduce((acc, l) => acc + l.clinicIds.length, 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Clinic branches linked</div>
        </div>

        <div style={{ padding: '1.25rem', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Services Catalog</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
              <PackageCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ea580c' }}>
            {laboratories.reduce((acc, l) => acc + mockLaboratoryService.getLaboratoryServices(l.id).filter(s => s.status === 'active').length, 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Active dental prosthetics</div>
        </div>
      </div>

      {/* FILTER TABS & CONTROLS */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.25rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {tabs.map(t => {
              const count = t === 'all' ? laboratories.length : laboratories.filter(l => l.status === t).length;
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
              placeholder="Search by laboratory name, code, city, services..."
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
                  <button className="table-sort" onClick={() => changeSort('name')}>Laboratory & Type</button>
                </th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Subscriber Organization</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Location & Coordinator</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Connections & Services</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Turnaround</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(lab => {
                const sub = getSubscriber(lab.subscriberId);
                const activeServices = mockLaboratoryService.getLaboratoryServices(lab.id).filter(s => s.status === 'active');
                const initials = lab.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

                return (
                  <tr key={lab.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* LAB & TYPE */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: '#faf5ff',
                          color: '#9333ea',
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
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{lab.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              backgroundColor: '#f3e8ff',
                              color: '#7e22ce'
                            }}>
                              {format(lab.laboratoryType)}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{lab.laboratoryNumber}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* SUBSCRIBER */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>
                          {sub?.businessName || 'Platform Partner Lab'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.15rem' }}>
                          <span style={{ color: '#64748b' }}>Owner:</span> <strong style={{ color: '#0f172a' }}>{sub?.primaryClinicName || 'Clinic Partner'}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 600, marginTop: '0.1rem' }}>
                          {sub?.email || ''}
                        </div>
                      </div>
                    </td>

                    {/* LOCATION & COORDINATOR */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#334155', fontSize: '0.825rem' }}>
                          <MapPin size={13} color="#64748b" />
                          <span>{lab.city}, {lab.province}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {lab.contactPersonName} ({lab.contactNumber})
                        </div>
                      </div>
                    </td>

                    {/* CONNECTIONS & SERVICES */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '6px',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          fontWeight: 600
                        }}>
                          <Building2 size={11} /> {lab.clinicIds.length} Connected Clinics
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#475569' }}>
                          {activeServices.length} Active Procedures
                        </span>
                      </div>
                    </td>

                    {/* TURNAROUND */}
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0f172a', fontWeight: 600, fontSize: '0.825rem' }}>
                        <Clock size={13} color="#64748b" />
                        <span>{lab.defaultTurnaroundDays} Days</span>
                      </div>
                      {lab.acceptsRushOrders && (
                        <div style={{ fontSize: '0.7rem', color: '#ea580c', fontWeight: 600 }}>
                          Rush: {lab.rushTurnaroundDays} Days
                        </div>
                      )}
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
                        backgroundColor: lab.status === 'active' ? '#ecfdf5' : '#fef2f2',
                        color: lab.status === 'active' ? '#166534' : '#991b1b',
                        border: lab.status === 'active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: lab.status === 'active' ? '#16a34a' : '#ef4444' }} />
                        {format(lab.status)}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      {actions(lab)}
                    </td>
                  </tr>
                );
              })}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                    <FlaskConical size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#475569' }}>No laboratories match the current criteria</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Try clearing filters or search keywords.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc', fontSize: '0.85rem', color: '#64748b' }}>
            <div>Showing <strong>{paged.length}</strong> of <strong>{displayed.length}</strong> laboratories</div>
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
          {paged.map(lab => {
            const sub = getSubscriber(lab.subscriberId);
            const activeServices = mockLaboratoryService.getLaboratoryServices(lab.id).filter(s => s.status === 'active');
            const initials = lab.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

            return (
              <div
                key={lab.id}
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
                        backgroundColor: '#faf5ff',
                        color: '#9333ea',
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
                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{lab.name}</h3>
                        <span style={{ fontSize: '0.75rem', color: '#7e22ce', fontWeight: 600 }}>
                          {format(lab.laboratoryType)}
                        </span>
                      </div>
                    </div>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: lab.status === 'active' ? '#ecfdf5' : '#f8fafc',
                      color: lab.status === 'active' ? '#166534' : '#475569'
                    }}>
                      {format(lab.status)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '10px' }}>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Subscriber:</strong> {sub?.businessName || 'Angelo Dental Clinic'}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Coordinator:</strong> {lab.contactPersonName} ({lab.contactNumber})
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Location:</strong> {lab.addressLine1 ? `${lab.addressLine1}, ` : ''}{lab.city}, {lab.province}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Turnaround:</strong> {lab.defaultTurnaroundDays} Days {lab.acceptsRushOrders && `(Rush: ${lab.rushTurnaroundDays} Days)`}
                    </div>
                    <div>
                      <strong style={{ color: '#0f172a' }}>Services:</strong> {activeServices.slice(0, 3).map(s => s.name).join(', ')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>{lab.laboratoryNumber}</span>
                  {actions(lab)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LaboratoryActionDialog 
        open={Boolean(action && selectedLab)} 
        action={action} 
        laboratory={selectedLab} 
        onClose={() => { setAction(null); setSelectedLab(null); }} 
        onSubmit={runAction} 
      />
    </main>
  );
}
