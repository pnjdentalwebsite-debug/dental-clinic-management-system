import { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Filter, Plus, Search, ShieldAlert, Stethoscope, UserSquare2 } from 'lucide-react';
import { DentistSummaryCard } from '../components/DentistSummaryCard';
import { DentistDirectoryTable } from '../components/DentistDirectoryTable';
import { DentistProfilePreview } from '../components/DentistProfilePreview';
import { mockAssociateDentistService } from '../services/mockAssociateDentistService';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type { AssociateDentistRecord } from '../types/associateDentists';

interface Props {
  loggedClinicName?: string;
  loggedUserEmail?: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onAddDentist?: () => void;
  onViewDentist?: (dentistId: string) => void;
  onEditDentist?: (dentistId: string) => void;
}

export function AssociateDentistsPage({
  loggedClinicName: _loggedClinicName,
  loggedUserEmail = 'clinic-owner',
  showToast,
  onAddDentist,
  onViewDentist,
  onEditDentist
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');

  const [dentists, setDentists] = useState<AssociateDentistRecord[]>([]);
  const [selectedDentistId, setSelectedDentistId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const subscriberId = useMemo(() => {
    const users = mockPlatformManagementService.listUsers();
    const matchedUser = users.find((user: any) => user.email?.toLowerCase() === loggedUserEmail.toLowerCase());
    return matchedUser?.subscriberId || matchedUser?.id || '';
  }, [loggedUserEmail]);

  const refreshDentists = useCallback(() => {
    const rows = mockAssociateDentistService.getDentistsBySubscriberId(subscriberId);
    setDentists(rows);
    setSelectedDentistId((current) => {
      if (current && rows.some((row) => row.id === current)) return current;
      return rows[0]?.id || '';
    });
  }, [subscriberId]);

  useEffect(() => {
    refreshDentists();
  }, [refreshDentists]);

  // Reset pagination to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, statusFilter]);

  const summary = useMemo(() => mockAssociateDentistService.getSummary(subscriberId), [dentists, subscriberId]);

  const filteredDentists = useMemo(() => {
    return dentists.filter((dentist) => {
      const matchesStatus = statusFilter === 'all' || dentist.status === statusFilter;
      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchesStatus;

      const fullName = `${dentist.firstName} ${dentist.lastName} ${dentist.middleName || ''}`.toLowerCase();
      const matchesSearch =
        fullName.includes(term) ||
        dentist.associateNumber?.toLowerCase().includes(term) ||
        dentist.specialization?.toLowerCase().includes(term) ||
        dentist.designation?.toLowerCase().includes(term) ||
        dentist.mobileNumber?.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [dentists, statusFilter, searchTerm]);

  // Slice for 10 data per page pagination
  const paginatedDentists = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDentists.slice(start, start + pageSize);
  }, [filteredDentists, currentPage, pageSize]);

  const selectedDentist = dentists.find((item) => item.id === selectedDentistId) || null;

  // Bulk action handlers
  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const pageIds = paginatedDentists.map((d) => d.id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = new Set(paginatedDentists.map((d) => d.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    }
  };

  const handleToggleSelectId = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const handleBulkActivate = () => {
    if (selectedIds.length === 0) return;
    let count = 0;
    selectedIds.forEach((id) => {
      const res = mockAssociateDentistService.setStatus(id, 'active');
      if (res.ok) count++;
    });
    refreshDentists();
    setSelectedIds([]);
    showToast(`Successfully activated ${count} associate ${count === 1 ? 'dentist' : 'dentists'}.`, 'success');
  };

  const handleBulkDeactivate = () => {
    if (selectedIds.length === 0) return;
    let count = 0;
    selectedIds.forEach((id) => {
      const res = mockAssociateDentistService.setStatus(id, 'inactive');
      if (res.ok) count++;
    });
    refreshDentists();
    setSelectedIds([]);
    showToast(`Marked ${count} associate ${count === 1 ? 'dentist' : 'dentists'} as inactive.`, 'warning');
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleAction = (action: string, dentist: AssociateDentistRecord) => {
    if (action === 'View Associate Dentist') {
      onViewDentist?.(dentist.id);
      return;
    }

    if (action === 'Edit Associate Dentist') {
      onEditDentist?.(dentist.id);
      return;
    }

    if (action === 'Save As Draft') {
      const draftData = mockAssociateDentistService.toFormData(dentist);
      const result = mockAssociateDentistService.updateDentist(dentist.id, draftData, loggedUserEmail, true);
      if (!result.ok || !result.data) {
        showToast(result.error || 'Associate dentist draft could not be saved.', 'error');
        return;
      }
      refreshDentists();
      showToast(`${result.data.associateNumber} saved as draft.`, 'info');
      return;
    }

    if (action === 'Activate Associate Dentist') {
      const result = mockAssociateDentistService.setStatus(dentist.id, 'active');
      if (!result.ok || !result.data) {
        showToast(result.error || 'Associate dentist could not be activated.', 'error');
        return;
      }
      refreshDentists();
      showToast(`${result.data.associateNumber} is now active.`, 'success');
      return;
    }

    if (action === 'Set Associate Dentist Inactive') {
      const result = mockAssociateDentistService.setStatus(dentist.id, 'inactive');
      if (!result.ok || !result.data) {
        showToast(result.error || 'Associate dentist could not be updated.', 'error');
        return;
      }
      refreshDentists();
      showToast(`${result.data.associateNumber} marked inactive.`, 'warning');
      return;
    }
  };

  const handleAddDentist = () => {
    onAddDentist?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', width: '100%' }}>
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
            Associate Dentists
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Manage licensed dentists, clinical specialties, and weekly work availability.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAddDentist}
          style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} /> Add Dentist
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div style={{ display: 'flex', gap: 'var(--card-gap)', flexWrap: 'wrap' }}>
        <DentistSummaryCard
          label="Total Associates"
          value={summary.total}
          icon={UserSquare2}
          desc="Registered dentists"
          status="info"
        />
        <DentistSummaryCard
          label="Active Dentists"
          value={summary.active}
          icon={Award}
          desc="Practicing & rostered"
          status="success"
        />
        <DentistSummaryCard
          label="Specialties"
          value={dentists.filter((d) => Boolean(d.specialization)).length}
          icon={Stethoscope}
          desc="Specialized focus areas"
          status="neutral"
        />
        <DentistSummaryCard
          label="Draft / Inactive"
          value={summary.draft + summary.inactive}
          icon={ShieldAlert}
          desc="Pending setup or inactive"
          status="warning"
        />
      </div>

      {/* Filter / Search Bar */}
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
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search associate by name, ID, or specialization..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '2.25rem',
                paddingRight: '0.75rem',
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
          {(['all', 'active', 'draft', 'inactive'] as const).map((tab) => (
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
              {tab === 'all' ? 'All Dentists' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Directory Table + Selected Profile Quick Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(320px, 1.15fr)', gap: '1.5rem', alignItems: 'stretch' }}>
        <DentistDirectoryTable
          dentists={paginatedDentists}
          selectedDentistId={selectedDentistId}
          onSelectDentist={setSelectedDentistId}
          onAction={handleAction}
          selectedIds={selectedIds}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelectId={handleToggleSelectId}
          onBulkActivate={handleBulkActivate}
          onBulkDeactivate={handleBulkDeactivate}
          onClearSelection={handleClearSelection}
          currentPage={currentPage}
          pageSize={pageSize}
          totalCount={filteredDentists.length}
          onPageChange={setCurrentPage}
        />
        <DentistProfilePreview
          dentist={selectedDentist}
          onClose={() => setSelectedDentistId('')}
          onView={() => selectedDentist && onViewDentist?.(selectedDentist.id)}
          onEdit={() => selectedDentist && onEditDentist?.(selectedDentist.id)}
        />
      </div>
    </div>
  );
}
