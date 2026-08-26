import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building, Building2, Filter, Search, ShieldAlert, Store } from 'lucide-react';
import { ClinicBranchSummaryCard } from '../components/ClinicBranchSummaryCard';
import { ClinicBranchTable } from '../components/ClinicBranchTable';
import { ClinicBranchProfilePreview } from '../components/ClinicBranchProfilePreview';
import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';

interface Props {
  loggedClinicName: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onEnterBranch?: (clinicId: string, branchName: string) => void;
  loggedUserEmail: string;
  onAddBranch?: () => void;
  onViewBranch?: (clinicId: string) => void;
  onEditBranch?: (clinicId: string) => void;
}

type BranchRow = {
  id: string;
  name: string;
  location: string;
  status: string;
  contact: string;
  hours: string;
  created: string;
  email?: string;
};

export function ClinicBranchesPage({
  loggedClinicName,
  showToast,
  onEnterBranch,
  loggedUserEmail,
  onAddBranch,
  onViewBranch,
  onEditBranch
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'active' | 'draft' | 'inactive'>('all');
  const [branchRows, setBranchRows] = useState<BranchRow[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const subscriberId = useMemo(() => {
    if (!loggedUserEmail) return '';
    const subscribers = mockPlatformManagementService.listSubscribers();
    const matchedSub = subscribers.find(s => s.email?.toLowerCase() === loggedUserEmail.toLowerCase());
    if (matchedSub?.id) return matchedSub.id;

    const users = mockPlatformManagementService.listUsers();
    const matchedUser = users.find((user: any) => user.email?.toLowerCase() === loggedUserEmail?.toLowerCase());
    if (matchedUser?.subscriberId) {
      return matchedUser.subscriberId;
    }

    return '';
  }, [loggedUserEmail]);

  const mapBranchRows = useCallback(() => {
    const dbClinics = subscriberId ? mockClinicService.getClinicsBySubscriberId(subscriberId) : [];
    return dbClinics.length > 0
      ? dbClinics.map((clinic) => ({
          id: clinic.id,
          name: clinic.name,
          location: `${clinic.city}, ${clinic.province}`,
          status:
            clinic.status === 'active'
              ? 'Active'
              : clinic.status === 'pending'
                ? 'Pending'
              : clinic.status === 'inactive'
                ? 'Inactive'
                : clinic.status === 'draft'
                  ? 'Draft'
                  : 'Archived',
          contact: clinic.contactNumber,
          hours: 'Mon - Sat: 9:00 AM - 6:00 PM',
          created: clinic.createdAt || '2026-01-01',
          email: clinic.email
        }))
      : [];
  }, [loggedClinicName, subscriberId]);

  useEffect(() => {
    const rows = mapBranchRows();
    setBranchRows(rows);
    setSelectedBranchId((current) => {
      if (current && rows.some((r) => r.id === current)) return current;
      return rows[0]?.id || '';
    });
  }, [mapBranchRows]);

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
    selectedIds.forEach((id) => {
      mockClinicService.activateClinic(id);
    });
    setBranchRows(mapBranchRows());
    showToast(`Activated ${selectedIds.length} selected clinic branches.`, 'success');
    setSelectedIds([]);
  };

  const handleBulkDeactivate = () => {
    selectedIds.forEach((id) => {
      mockClinicService.deactivateClinic(id, 'Bulk deactivated from branch table');
    });
    setBranchRows(mapBranchRows());
    showToast(`Deactivated ${selectedIds.length} selected clinic branches.`, 'warning');
    setSelectedIds([]);
  };

  const handleAction = (action: string, branch: BranchRow) => {
    if (action === 'Enter Clinic') {
      if (onEnterBranch) {
        onEnterBranch(branch.id, branch.name);
      } else {
        showToast(`Opening ${branch.name} branch workspace.`, 'success');
      }
    } else if (action === 'View Details') {
      onViewBranch?.(branch.id);
    } else if (action === 'Edit Branch') {
      onEditBranch?.(branch.id);
    } else if (action === 'Deactivate') {
      const result = mockClinicService.deactivateClinic(branch.id, 'Marked inactive from clinic branch workspace.');
      if (!result.ok || !result.data) {
        showToast(result.error || `Unable to set ${branch.name} inactive.`, 'error');
        return;
      }
      setBranchRows(mapBranchRows());
      showToast(`${result.data.name} is now inactive.`, 'warning');
    } else if (action === 'Activate') {
      const result = mockClinicService.activateClinic(branch.id);
      if (!result.ok || !result.data) {
        showToast(result.error || `Unable to reactivate ${branch.name}.`, 'error');
        return;
      }
      setBranchRows(mapBranchRows());
      showToast(`${result.data.name} has been reactivated.`, 'success');
    } else {
      showToast(`Branch action "${action}" is not available yet for ${branch.name}.`, 'info');
    }
  };

  const handleAddBranch = () => {
    if (!subscriberId && !onAddBranch) {
      showToast('This clinic owner account has no subscriber context yet, so branch creation is blocked.', 'error');
      return;
    }
    onAddBranch?.();
  };

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
        <ClinicBranchSummaryCard label="Total Branches" value={branchRows.length} icon={Building2} desc="Registered clinic locations" status="info" />
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
        />
        <ClinicBranchProfilePreview
          branch={selectedBranch}
          onClose={() => setSelectedBranchId('')}
          onView={() => selectedBranch && onViewBranch?.(selectedBranch.id)}
          onEdit={() => selectedBranch && onEditBranch?.(selectedBranch.id)}
          onEnterWorkspace={() => selectedBranch && onEnterBranch?.(selectedBranch.id, selectedBranch.name)}
        />
      </div>
    </div>
  );
}
