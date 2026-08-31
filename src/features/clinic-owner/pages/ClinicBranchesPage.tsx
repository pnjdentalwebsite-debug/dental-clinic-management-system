import { useEffect, useMemo, useState } from 'react';
import { Building, Building2, Filter, Search, ShieldAlert, Store } from 'lucide-react';
import { ClinicBranchSummaryCard } from '../components/ClinicBranchSummaryCard';
import { ClinicBranchTable } from '../components/ClinicBranchTable';
import { ClinicBranchProfilePreview } from '../components/ClinicBranchProfilePreview';
import { useClinicOwnerRead } from '../realData/ClinicOwnerReadProvider';
import type { ClinicOwnerQuotaUsage } from '../../../infrastructure/supabase/clinicOwnerApi';

interface Props {
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

type BranchRow = {
  id: string;
  clinicNumber: string;
  isPrimary: boolean;
  branchType: string;
  name: string;
  location: string;
  status: string;
  contact: string;
  hours: string;
  created: string;
  email?: string;
};

function formatClinicAddress(clinic: {
  addressLine1: string;
  addressLine2: string | null;
  barangay: string | null;
  city: string;
  province: string;
  postalCode: string | null;
}) {
  return [clinic.addressLine1, clinic.addressLine2, clinic.barangay, clinic.city, clinic.province, clinic.postalCode]
    .filter(Boolean)
    .join(', ') || 'Address unavailable';
}

function displayStatus(status: string) {
  if (!status) return 'Unavailable';
  return status.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatClinicQuota(quota: ClinicOwnerQuotaUsage) {
  const { activeUsage, limit } = quota;
  if (limit.kind === 'number') return `${activeUsage} / ${limit.value}`;
  if (limit.kind === 'unlimited') return `${activeUsage} / Unlimited`;
  if (limit.kind === 'not_included') return `${activeUsage} / Not included`;
  return 'Unavailable';
}

export function ClinicBranchesPage({ showToast }: Props) {
  const ownerRead = useClinicOwnerRead();
  const bootstrap = ownerRead.bootstrap;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'draft' | 'inactive'>('all');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const branchRows = useMemo<BranchRow[]>(() => (
    bootstrap?.clinics.map((clinic) => ({
          id: clinic.id,
          clinicNumber: clinic.clinicNumber,
          isPrimary: clinic.isPrimary,
          branchType: clinic.branchType,
          name: clinic.name,
          location: formatClinicAddress(clinic),
          status: displayStatus(clinic.status),
          contact: clinic.contactNumber || 'Not available',
          hours: 'Unavailable',
          created: clinic.createdAt || 'Unavailable',
          email: clinic.email || undefined,
        })) ?? []
  ), [bootstrap]);

  useEffect(() => {
    setSelectedBranchId((current) => {
      if (current && branchRows.some((row) => row.id === current)) return current;
      return branchRows[0]?.id || '';
    });
  }, [branchRows]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, statusFilter]);

  const filteredBranches = useMemo(() => {
    return branchRows.filter((branch) => {
      const matchesStatus =
        statusFilter === 'all' ||
        branch.status.toLowerCase() === statusFilter.toLowerCase();
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchesStatus;

      const matchesSearch =
        branch.name.toLowerCase().includes(term) ||
        branch.location.toLowerCase().includes(term) ||
        branch.contact.toLowerCase().includes(term) ||
        branch.id.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [branchRows, statusFilter, searchTerm]);

  const paginatedBranches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBranches.slice(start, start + pageSize);
  }, [filteredBranches, currentPage, pageSize]);

  const selectedBranch = branchRows.find((b) => b.id === selectedBranchId) || null;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedBranches.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedBranches.map((b) => b.id));
    }
  };

  const handleToggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkActivate = () => {
    showToast('Branch activation is read-only until Phase 2E.3B.2.', 'info');
  };

  const handleBulkDeactivate = () => {
    showToast('Branch deactivation is read-only until Phase 2E.3B.2.', 'info');
  };

  const handleAction = (action: string, branch: BranchRow) => {
    if (action === 'Enter Clinic') {
      showToast(`Opening ${branch.name} is unavailable until its real-data workspace cutover.`, 'info');
    } else if (action === 'View Details') {
      showToast(`Real branch details for ${branch.name} are read-only here until Phase 2E.3B.2.`, 'info');
    } else if (action === 'Edit Branch') {
      showToast(`Editing ${branch.name} is read-only until Phase 2E.3B.2.`, 'info');
    } else {
      showToast(`Branch action "${action}" is read-only until Phase 2E.3B.2.`, 'info');
    }
  };

  const handleAddBranch = () => {
    showToast('Branch creation is read-only until Phase 2E.3B.2.', 'info');
  };

  if (ownerRead.status !== 'ready' || !bootstrap) {
    return (
      <div className="dashboard-panel" role={ownerRead.loading ? 'status' : 'alert'}>
        <h2>{ownerRead.loading ? 'Loading Clinic Branches…' : 'Clinic Branches unavailable'}</h2>
        <p>{ownerRead.loading ? 'Loading your RLS-protected clinic directory.' : ownerRead.error}</p>
      </div>
    );
  }

  const clinicQuota = formatClinicQuota(bootstrap.quotas.clinics);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', width: '100%' }}>
      {/* Page Header */}
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Clinic Branches</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage all locations under your dental organization.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddBranch}
          style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem' }}
        >
          + Add Branch
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 'var(--card-gap)', flexWrap: 'wrap' }}>
        <ClinicBranchSummaryCard label="Total Branches" value={branchRows.length} icon={Building2} desc={`Clinic quota: ${clinicQuota}`} status="info" />
        <ClinicBranchSummaryCard label="Active Branches" value={branchRows.filter(b => b.status.toLowerCase() === 'active').length} icon={Building} desc="Currently operating" status="success" />
        <ClinicBranchSummaryCard label="Pending Branches" value={branchRows.filter(b => b.status.toLowerCase() === 'pending').length} icon={Store} desc="Awaiting payment approval" status="warning" />
        <ClinicBranchSummaryCard label="Inactive Branches" value={branchRows.filter(b => b.status.toLowerCase() === 'inactive').length} icon={ShieldAlert} desc="Temporarily unavailable" status="neutral" />
      </div>

      {/* Search Bar & Status Filter Tabs */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--card-bg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search branch by name, location, contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.4rem',
                height: '38px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--background)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter:</span>
          {(['all', 'pending', 'active', 'draft', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '8px',
                border: statusFilter === tab ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: statusFilter === tab ? 'var(--primary)' : 'var(--background)',
                color: statusFilter === tab ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s ease'
              }}
            >
              {tab === 'all' ? 'All Branches' : tab === 'pending' ? 'Pending' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Split Directory Table + Side Quick Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(320px, 1.15fr)', gap: '1.5rem', alignItems: 'stretch' }}>
        <ClinicBranchTable
          branches={paginatedBranches}
          selectedBranchId={selectedBranchId}
          onSelectBranch={setSelectedBranchId}
          onAction={handleAction}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectId={handleToggleSelectId}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onClearSelection={handleClearSelection}
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredBranches.length}
          onPageChange={setCurrentPage}
          emptyTitle={branchRows.length === 0 ? 'No clinic branches yet' : 'No clinic branches found'}
          emptyDescription={branchRows.length === 0 ? 'No clinic records exist in the authenticated tenant scope.' : 'Try adjusting your search query or filter criteria.'}
        />
        <ClinicBranchProfilePreview
          branch={selectedBranch}
          onClose={() => setSelectedBranchId('')}
          onView={() => selectedBranch && handleAction('View Details', selectedBranch)}
          onEdit={() => selectedBranch && handleAction('Edit Branch', selectedBranch)}
          onEnterWorkspace={() => selectedBranch && handleAction('Enter Clinic', selectedBranch)}
        />
      </div>
    </div>
  );
}
