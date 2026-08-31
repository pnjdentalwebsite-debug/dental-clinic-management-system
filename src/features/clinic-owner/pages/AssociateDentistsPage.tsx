import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Filter, Plus, Search, ShieldAlert, Stethoscope, UserSquare2 } from 'lucide-react';
import { DentistSummaryCard } from '../components/DentistSummaryCard';
import { DentistDirectoryTable } from '../components/DentistDirectoryTable';
import { DentistProfilePreview } from '../components/DentistProfilePreview';
import { useClinicOwnerRead } from '../realData/ClinicOwnerReadProvider';
import {
  getClinicOwnerAssociateDirectory,
  type ClinicOwnerAssociateDirectoryItem,
} from '../../../infrastructure/supabase/clinicOwnerAssociateApi';
import type { ClinicOwnerQuotaUsage } from '../../../infrastructure/supabase/clinicOwnerApi';

interface Props {
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onViewDentist?: (membershipId: string) => void;
  onAddDentist?: () => void;
  onEditDentist?: (membershipId: string) => void;
}

type DirectoryState = 'loading' | 'ready' | 'error';

function formatAssociateQuota(quota: ClinicOwnerQuotaUsage | undefined) {
  if (!quota) return 'Unavailable';
  if (quota.limit.kind === 'number') return `${quota.activeUsage} / ${quota.limit.value}`;
  if (quota.limit.kind === 'unlimited') return `${quota.activeUsage} / Unlimited`;
  if (quota.limit.kind === 'not_included') return `${quota.activeUsage} / Not included`;
  return 'Unavailable';
}

export function AssociateDentistsPage({ showToast, onViewDentist, onAddDentist, onEditDentist }: Props) {
  const ownerRead = useClinicOwnerRead();
  const bootstrap = ownerRead.bootstrap;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended' | 'deactivated'>('all');
  const [dentists, setDentists] = useState<ClinicOwnerAssociateDirectoryItem[]>([]);
  const [directoryState, setDirectoryState] = useState<DirectoryState>('loading');
  const [selectedDentistId, setSelectedDentistId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const refreshDentists = useCallback(async () => {
    if (ownerRead.status !== 'ready' || !bootstrap) return;
    setDirectoryState('loading');
    try {
      const rows = await getClinicOwnerAssociateDirectory(bootstrap);
      setDentists(rows);
      setDirectoryState('ready');
      setSelectedDentistId((current) => current && rows.some((row) => row.membershipId === current)
        ? current
        : rows[0]?.membershipId || '');
    } catch {
      setDentists([]);
      setSelectedDentistId('');
      setDirectoryState('error');
    }
  }, [bootstrap, ownerRead.status]);

  useEffect(() => {
    if (ownerRead.status === 'ready' && bootstrap) {
      void refreshDentists();
      return;
    }
    setDentists([]);
    setSelectedDentistId('');
    setDirectoryState(ownerRead.loading ? 'loading' : 'error');
  }, [bootstrap, ownerRead.loading, ownerRead.status, refreshDentists]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, statusFilter]);

  const summary = useMemo(() => ({
    total: dentists.length,
    active: dentists.filter((dentist) => dentist.accountStatus === 'active').length,
    restricted: dentists.filter((dentist) => ['suspended', 'deactivated'].includes(dentist.accountStatus)).length,
    pending: dentists.filter((dentist) => dentist.accountStatus === 'pending').length,
  }), [dentists]);

  const filteredDentists = useMemo(() => dentists.filter((dentist) => {
    const matchesStatus = statusFilter === 'all' || dentist.accountStatus === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesStatus;
    return matchesStatus && [
      dentist.displayName,
      dentist.associateNumber,
      dentist.specialization,
      dentist.designation,
      dentist.mobile,
    ].filter(Boolean).some((value) => value!.toLowerCase().includes(term));
  }), [dentists, searchTerm, statusFilter]);

  const paginatedDentists = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDentists.slice(start, start + pageSize);
  }, [currentPage, filteredDentists]);

  const selectedDentist = dentists.find((dentist) => dentist.membershipId === selectedDentistId) || null;
  const associateQuota = formatAssociateQuota(bootstrap?.quotas.associates);
  const quota = bootstrap?.quotas.associates;
  const canAddAssociate = quota?.limit.kind === 'unlimited'
    || (quota?.limit.kind === 'number' && quota.activeUsage < quota.limit.value);

  const handleAction = (action: string, dentist: ClinicOwnerAssociateDirectoryItem) => {
    if (action === 'View Associate Dentist') {
      onViewDentist?.(dentist.membershipId);
      return;
    }
    if (action === 'Edit Associate Dentist') {
      onEditDentist?.(dentist.membershipId);
      return;
    }
    showToast('Available in a later lifecycle phase.', 'info');
  };

  if (ownerRead.status !== 'ready' || !bootstrap || directoryState === 'loading') {
    return (
      <div className="dashboard-panel" role={ownerRead.loading || directoryState === 'loading' ? 'status' : 'alert'}>
        <h2>{ownerRead.loading || directoryState === 'loading' ? 'Loading Associate Dentists...' : 'Associate Dentist service unavailable'}</h2>
        <p>{ownerRead.loading || directoryState === 'loading'
          ? 'Loading your RLS-protected Associate Dentist directory.'
          : ownerRead.error || 'Associate Dentist service unavailable. Please try again later.'}</p>
      </div>
    );
  }

  if (directoryState === 'error') {
    return (
      <div className="dashboard-panel" role="alert">
        <h2>Associate Dentist service unavailable</h2>
        <p>Associate Dentist data could not be loaded. No mock data was substituted.</p>
        <button type="button" className="btn btn-outline" style={{ width: 'auto' }} onClick={() => void refreshDentists()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', width: '100%' }}>
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Associate Dentists</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>View licensed dentists, clinical specialties, and real clinic assignments.</p>
        </div>
        <button type="button" className="btn btn-primary" disabled={!canAddAssociate} title={!canAddAssociate ? 'The authoritative Associate Dentist quota has been reached.' : undefined} onClick={onAddDentist} style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', opacity: canAddAssociate ? 1 : 0.6, cursor: canAddAssociate ? 'pointer' : 'not-allowed' }}>
          <Plus size={16} /> Add Dentist
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--card-gap)', flexWrap: 'wrap' }}>
        <DentistSummaryCard label="Total Associates" value={summary.total} icon={UserSquare2} desc="Real Associate memberships" status="info" />
        <DentistSummaryCard label="Active Dentists" value={summary.active} icon={Award} desc="Active account status" status="success" />
        <DentistSummaryCard label="Restricted Accounts" value={summary.restricted} icon={ShieldAlert} desc={`${summary.pending} pending account${summary.pending === 1 ? '' : 's'}`} status="warning" />
        <DentistSummaryCard label="Associate Quota" value={associateQuota} icon={Stethoscope} desc="Authoritative plan usage" status="neutral" />
      </div>

      <div className="dashboard-panel" style={{ margin: 0, padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Search associate by name, ID, or specialization..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '0.75rem', height: '38px', fontSize: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }} />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter:</span>
          {(['all', 'active', 'pending', 'suspended', 'deactivated'] as const).map((tab) => (
            <button key={tab} type="button" onClick={() => setStatusFilter(tab)} style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', fontWeight: 600, borderRadius: '8px', border: statusFilter === tab ? '1px solid var(--primary)' : '1px solid var(--border)', background: statusFilter === tab ? 'var(--primary)' : 'var(--background)', color: statusFilter === tab ? '#fff' : 'var(--text-secondary)', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s ease' }}>
              {tab === 'all' ? 'All Dentists' : tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(320px, 1.15fr)', gap: '1.5rem', alignItems: 'stretch' }}>
        <DentistDirectoryTable
          dentists={paginatedDentists}
          selectedDentistId={selectedDentistId}
          onSelectDentist={setSelectedDentistId}
          onAction={handleAction}
          readOnly={false}
          selectedIds={selectedIds}
          onToggleSelectAll={(checked) => setSelectedIds(checked ? paginatedDentists.map((dentist) => dentist.membershipId) : [])}
          onToggleSelectId={(membershipId, checked) => setSelectedIds((current) => checked ? [...current, membershipId] : current.filter((id) => id !== membershipId))}
          onClearSelection={() => setSelectedIds([])}
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredDentists.length}
          onPageChange={setCurrentPage}
        />
        <DentistProfilePreview
          dentist={selectedDentist}
          onClose={() => setSelectedDentistId('')}
          onView={() => selectedDentist && onViewDentist?.(selectedDentist.membershipId)}
          onEdit={() => selectedDentist && onEditDentist?.(selectedDentist.membershipId)}
          readOnly={false}
        />
      </div>
    </div>
  );
}
