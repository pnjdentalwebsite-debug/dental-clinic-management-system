import { useEffect, useMemo, useState } from 'react';
import { FileText, Plus, Search, ShieldCheck, UserCheck, Users, X } from 'lucide-react';
import { StaffSummaryCard } from '../components/StaffSummaryCard';
import { StaffDirectoryTable } from '../components/StaffDirectoryTable';
import { StaffProfilePreview } from '../components/StaffProfilePreview';
import { mockStaffService } from '../services/mockStaffService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type { StaffMemberRecord, StaffStatus, StaffSummary } from '../types/staffManagement';

interface Props {
  loggedClinicName?: string;
  loggedUserEmail?: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onAddStaff?: () => void;
  onViewStaff?: (staffId: string) => void;
  onEditStaff?: (staffId: string) => void;
}

export function StaffManagementPage({
  loggedClinicName: _loggedClinicName,
  loggedUserEmail = '',
  showToast,
  onAddStaff,
  onViewStaff,
  onEditStaff
}: Props) {
  const [staffList, setStaffList] = useState<StaffMemberRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StaffStatus>('ALL');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const subscriberId = useMemo(() => {
    const users = mockPlatformManagementService.listUsers();
    const matchedUser = users.find((user: any) => user.email?.toLowerCase() === loggedUserEmail.toLowerCase());
    return matchedUser?.subscriberId || matchedUser?.id || '';
  }, [loggedUserEmail]);

  const loadData = () => {
    const data = mockStaffService.getStaffBySubscriberId(subscriberId);
    setStaffList(data);
    if (data.length > 0 && !selectedStaffId) {
      setSelectedStaffId(data[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, [subscriberId]);

  const summary: StaffSummary = useMemo(() => {
    return mockStaffService.getSummary(subscriberId);
  }, [staffList, subscriberId]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const name = `${item.firstName || ''} ${item.middleName || ''} ${item.lastName || ''} ${item.extensionName || ''}`.toLowerCase();
      const matchesSearch =
        !q ||
        name.includes(q) ||
        item.staffNumber.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.mobileNumber.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || item.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [staffList, searchQuery, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Paginated records
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  const selectedStaff = useMemo(() => {
    if (!selectedStaffId) return null;
    return staffList.find((s) => s.id === selectedStaffId) || null;
  }, [staffList, selectedStaffId]);

  // Selection handlers
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedStaff.map((s) => s.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedStaff.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleSelectId = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkActivate = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      mockStaffService.setStatus(id, 'active');
    });
    showToast(`Successfully activated ${selectedIds.length} staff members.`, 'success');
    setSelectedIds([]);
    loadData();
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach((id) => {
      mockStaffService.setStatus(id, 'inactive');
    });
    showToast(`Successfully deactivated ${selectedIds.length} staff members.`, 'warning');
    setSelectedIds([]);
    loadData();
  };

  const handleAction = (action: string, staff: StaffMemberRecord) => {
    if (action === 'View Staff Member') {
      setSelectedStaffId(staff.id);
      if (onViewStaff) {
        onViewStaff(staff.id);
      }
    } else if (action === 'Edit Staff Member') {
      if (onEditStaff) {
        onEditStaff(staff.id);
      }
    } else if (action === 'Save As Draft') {
      mockStaffService.setStatus(staff.id, 'draft');
      showToast(`Staff member "${staff.firstName} ${staff.lastName}" moved to draft.`, 'info');
      loadData();
    } else if (action === 'Activate Staff Member') {
      mockStaffService.setStatus(staff.id, 'active');
      showToast(`Staff member "${staff.firstName} ${staff.lastName}" is now active.`, 'success');
      loadData();
    } else if (action === 'Deactivate Staff Member') {
      mockStaffService.setStatus(staff.id, 'inactive');
      showToast(`Staff member "${staff.firstName} ${staff.lastName}" deactivated.`, 'warning');
      loadData();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', width: '100%', paddingBottom: '3rem' }}>
      {/* Page Header */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: 'var(--card-pad)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
            Staff Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            Manage staff accounts, clinic assignments, system privileges, and access restrictions.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAddStaff}
          style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '40px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Plus size={16} /> Add Staff Member
        </button>
      </div>

      {/* 4 Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--card-gap)' }}>
        <StaffSummaryCard
          label="Total Staff"
          value={summary.total}
          icon={Users}
          desc="Registered clinic employees"
          status="info"
        />
        <StaffSummaryCard
          label="Active Staff"
          value={summary.active}
          icon={UserCheck}
          desc="Currently active members"
          status="success"
        />
        <StaffSummaryCard
          label="Staff Roles"
          value={summary.rolesCount}
          icon={ShieldCheck}
          desc="Distinct designations assigned"
          status="warning"
        />
        <StaffSummaryCard
          label="Draft / Inactive"
          value={summary.draft + summary.inactive}
          icon={FileText}
          desc="Pending or disabled accounts"
          status="neutral"
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name, ID, phone, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '2.35rem',
              paddingRight: searchQuery ? '2.2rem' : '0.85rem',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              fontSize: '0.85rem'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--background)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          {(['ALL', 'active', 'draft', 'inactive'] as const).map((filterKey) => {
            const isActive = statusFilter === filterKey;
            const label =
              filterKey === 'ALL'
                ? 'All Staff'
                : filterKey.charAt(0).toUpperCase() + filterKey.slice(1);
            return (
              <button
                key={filterKey}
                type="button"
                onClick={() => setStatusFilter(filterKey)}
                style={{
                  padding: '0.35rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--card-bg)' : 'transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Directory Split Layout (Aligned Height) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 3fr) minmax(320px, 1.15fr)',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        {/* Table Column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <StaffDirectoryTable
            staffList={paginatedStaff}
            selectedStaffId={selectedStaffId || undefined}
            onSelectStaff={(id) => setSelectedStaffId(id)}
            onAction={handleAction}
            selectedIds={selectedIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectId={handleToggleSelectId}
            onBulkActivate={handleBulkActivate}
            onBulkDeactivate={handleBulkDeactivate}
            onClearSelection={() => setSelectedIds([])}
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={filteredStaff.length}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>

        {/* Quick Profile Preview Drawer Column */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <StaffProfilePreview
            staff={selectedStaff}
            onClose={() => setSelectedStaffId(null)}
            onView={() => {
              if (selectedStaff && onViewStaff) {
                onViewStaff(selectedStaff.id);
              }
            }}
            onEdit={() => {
              if (selectedStaff && onEditStaff) {
                onEditStaff(selectedStaff.id);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
