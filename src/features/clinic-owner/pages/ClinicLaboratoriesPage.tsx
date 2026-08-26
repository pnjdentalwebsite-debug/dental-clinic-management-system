import { useMemo, useState, useEffect } from 'react';
import { Award, Clock, Filter, FlaskConical, Search } from 'lucide-react';
import { ClinicLaboratorySummaryCard } from '../components/ClinicLaboratorySummaryCard';
import { ClinicLaboratoryTable } from '../components/ClinicLaboratoryTable';
import { ClinicLaboratoryProfilePreview } from '../components/ClinicLaboratoryProfilePreview';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { resolveClinicOwnerContext } from '../services/tenantScope';

interface LabRow {
  id: string;
  name: string;
  type: string;
  location: string;
  services: string;
  status: string;
  rawStatus?: string;
  turnaroundTime: string;
}

interface Props {
  loggedClinicName: string;
  loggedUserEmail: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onAddLaboratory: () => void;
  onViewLaboratory: (laboratoryId: string) => void;
  onEditLaboratory: (laboratoryId: string) => void;
}

export function ClinicLaboratoriesPage({
  loggedClinicName,
  loggedUserEmail,
  showToast,
  onAddLaboratory,
  onViewLaboratory,
  onEditLaboratory
}: Props) {
  const [version, setVersion] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'inactive'>('all');
  const [selectedLabId, setSelectedLabId] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const ownerContext = useMemo(
    () => resolveClinicOwnerContext(loggedUserEmail, loggedClinicName),
    [loggedUserEmail, loggedClinicName]
  );
  const subscriberId = ownerContext.subscriberId;

  const refresh = () => setVersion((prev) => prev + 1);

  const labs = useMemo(() => {
    mockLaboratoryService.initializeLaboratories();
    if (!subscriberId) return [];
    return mockLaboratoryService.getLaboratoriesBySubscriberId(subscriberId);
  }, [subscriberId, version]);

  const labRows = useMemo<LabRow[]>(
    () =>
      labs.map((lab) => {
        const activeServices = mockLaboratoryService
          .getLaboratoryServices(lab.id)
          .filter((service) => service.status === 'active');
        return {
          id: lab.id,
          name: lab.name,
          type: lab.laboratoryType.replaceAll('_', ' '),
          location: [lab.city, lab.province].filter(Boolean).join(', '),
          services: activeServices.length
            ? activeServices.slice(0, 3).map((service) => service.name).join(', ')
            : 'No active services configured',
          status:
            lab.status === 'active'
              ? 'Connected'
              : lab.status === 'draft'
                ? 'Draft'
                : lab.status === 'inactive'
                  ? 'Inactive'
                  : lab.status === 'pending'
                    ? 'Pending'
                    : 'Archived',
          rawStatus: lab.status,
          turnaroundTime: `${lab.defaultTurnaroundDays}-${Math.max(lab.defaultTurnaroundDays, lab.rushTurnaroundDays)} Days`
        };
      }),
    [labs]
  );

  useEffect(() => {
    if (labRows.length > 0) {
      setSelectedLabId((current) => {
        if (current && labRows.some((r) => r.id === current)) return current;
        return labRows[0].id;
      });
    }
  }, [labRows]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [searchTerm, statusFilter]);

  const filteredLabs = useMemo(() => {
    return labRows.filter((lab) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && (lab.rawStatus === 'active' || lab.status === 'Connected')) ||
        (statusFilter === 'draft' && (lab.rawStatus === 'draft' || lab.status === 'Draft')) ||
        (statusFilter === 'inactive' && (lab.rawStatus === 'inactive' || lab.status === 'Inactive'));

      const term = searchTerm.toLowerCase().trim();
      if (!term) return matchesStatus;

      const matchesSearch =
        lab.name.toLowerCase().includes(term) ||
        lab.type.toLowerCase().includes(term) ||
        lab.location.toLowerCase().includes(term) ||
        lab.services.toLowerCase().includes(term) ||
        lab.id.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }, [labRows, statusFilter, searchTerm]);

  const paginatedLabs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLabs.slice(start, start + pageSize);
  }, [filteredLabs, currentPage, pageSize]);

  const selectedLab = labRows.find((l) => l.id === selectedLabId) || null;

  const handleToggleSelectAll = () => {
    if (selectedIds.length === paginatedLabs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedLabs.map((l) => l.id));
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
      mockLaboratoryService.activateLaboratory(id);
    });
    refresh();
    showToast(`Connected ${selectedIds.length} selected laboratories.`, 'success');
    setSelectedIds([]);
  };

  const handleBulkDeactivate = () => {
    selectedIds.forEach((id) => {
      mockLaboratoryService.deactivateLaboratory(id, 'Bulk deactivated from laboratory workspace');
    });
    refresh();
    showToast(`Deactivated ${selectedIds.length} selected laboratories.`, 'warning');
    setSelectedIds([]);
  };

  const handleAction = (action: string, lab: LabRow) => {
    const target = mockLaboratoryService.getLaboratoryById(lab.id);
    if (!target) {
      showToast('Laboratory record could not be found.', 'error');
      return;
    }

    if (action === 'view') {
      onViewLaboratory(target.id);
      return;
    }

    if (action === 'edit') {
      onEditLaboratory(target.id);
      return;
    }

    if (action === 'services') {
      onViewLaboratory(target.id);
      showToast(`Opened ${target.name}. Switch to the Services tab to manage its catalog.`, 'info');
      return;
    }

    if (action === 'deactivate') {
      const result = mockLaboratoryService.deactivateLaboratory(target.id, 'Clinic owner temporarily disabled this laboratory.');
      if (!result.ok) {
        showToast(result.error || 'Laboratory could not be deactivated.', 'error');
        return;
      }
      refresh();
      showToast(`Laboratory ${target.laboratoryNumber} deactivated successfully.`, 'success');
      return;
    }

    if (action === 'activate') {
      const result = mockLaboratoryService.activateLaboratory(target.id);
      if (!result.ok) {
        showToast(result.error || 'Laboratory could not be activated.', 'error');
        return;
      }
      refresh();
      showToast(`Laboratory ${target.laboratoryNumber} activated successfully.`, 'success');
      return;
    }

    if (action === 'archive') {
      const result = mockLaboratoryService.archiveLaboratory(target.id, 'Archived from clinic laboratory workspace.');
      if (!result.ok) {
        showToast(result.error || 'Laboratory could not be archived.', 'error');
        return;
      }
      refresh();
      showToast(`Laboratory ${target.laboratoryNumber} archived successfully.`, 'warning');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--section-gap)', width: '100%' }}>
      {/* Page Header */}
      <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Dental Laboratories</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Manage laboratories connected with your clinic.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onAddLaboratory}
          style={{ width: 'auto', padding: '0.5rem 1.25rem', height: '38px', fontSize: '0.85rem' }}
        >
          + Add Laboratory
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 'var(--card-gap)', flexWrap: 'wrap' }}>
        <ClinicLaboratorySummaryCard label="Total Laboratories" value={labs.length} icon={FlaskConical} desc="Registered partner labs" status="info" />
        <ClinicLaboratorySummaryCard label="Connected Labs" value={labs.filter(l => l.status === 'active').length} icon={FlaskConical} desc="Currently linked" status="success" />
        <ClinicLaboratorySummaryCard label="Active Services" value={labs.reduce((total, lab) => total + mockLaboratoryService.getLaboratoryServices(lab.id).filter(service => service.status === 'active').length, 0)} icon={Award} desc="Available services" status="warning" />
        <ClinicLaboratorySummaryCard label="Draft / Inactive" value={labs.filter(l => l.status !== 'active').length} icon={Clock} desc="Pending or disabled" status="neutral" />
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
              placeholder="Search lab by name, type, location, services..."
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
              {tab === 'all' ? 'All Laboratories' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Split Directory Table + Side Quick Preview */}
      {!subscriberId ? (
        <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginTop: 0 }}>
            {ownerContext.status === 'pending_approval' ? 'Account approval in progress' : 'No subscriber context found'}
          </h3>
          <p style={{ marginBottom: 0, color: 'var(--text-secondary)' }}>
            {ownerContext.message ||
              'This clinic owner account is missing subscriber linkage, so the dental laboratories workspace cannot load yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(320px, 1.15fr)', gap: '1.5rem', alignItems: 'stretch' }}>
          <ClinicLaboratoryTable
            labs={paginatedLabs}
            selectedLabId={selectedLabId}
            onSelectLab={setSelectedLabId}
            onAction={handleAction}
            selectedIds={selectedIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectId={handleToggleSelectId}
            onBulkActivate={handleBulkActivate}
            onBulkDeactivate={handleBulkDeactivate}
            onClearSelection={handleClearSelection}
            currentPage={currentPage}
            pageSize={pageSize}
            totalCount={filteredLabs.length}
            onPageChange={setCurrentPage}
          />
          <ClinicLaboratoryProfilePreview
            lab={selectedLab}
            onClose={() => setSelectedLabId('')}
            onView={() => selectedLab && onViewLaboratory?.(selectedLab.id)}
            onEdit={() => selectedLab && onEditLaboratory?.(selectedLab.id)}
            onManageServices={() => selectedLab && handleAction('services', selectedLab)}
          />
        </div>
      )}
    </div>
  );
}
