import { ChevronLeft, ChevronRight, Power, PowerOff, X } from 'lucide-react';
import { ClinicBranchRow } from './ClinicBranchRow';

interface BranchItem {
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
}

interface Props {
  branches: BranchItem[];
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
  onAction: (action: string, branch: BranchItem) => void;
  selectedIds?: string[];
  onToggleSelectAll?: () => void;
  onToggleSelectId?: (id: string) => void;
  onBulkActivate?: () => void;
  onBulkDeactivate?: () => void;
  onClearSelection?: () => void;
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ClinicBranchTable({
  branches,
  selectedBranchId,
  onSelectBranch,
  onAction,
  selectedIds = [],
  onToggleSelectAll,
  onToggleSelectId,
  onBulkActivate,
  onBulkDeactivate,
  onClearSelection,
  currentPage = 1,
  pageSize = 10,
  totalCount = 0,
  onPageChange,
  emptyTitle = 'No clinic branches found',
  emptyDescription = 'Try adjusting your search query or filter criteria.'
}: Props) {
  const isAllSelected = branches.length > 0 && selectedIds.length === branches.length;
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected;
  const totalPages = Math.ceil((totalCount || branches.length) / pageSize) || 1;

  return (
    <div
      className="table-container"
      style={{
        margin: 0,
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--card-bg)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '480px'
      }}
    >
      {/* Floating Modern Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            padding: '0.65rem 1rem',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
              {selectedIds.length} branch{selectedIds.length > 1 ? 'es' : ''} selected
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onBulkActivate && (
              <button
                type="button"
                onClick={onBulkActivate}
                className="btn btn-outline"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.3rem 0.65rem',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#059669',
                  borderColor: 'rgba(5, 150, 105, 0.3)'
                }}
              >
                <Power size={13} /> Activate Selected
              </button>
            )}
            {onBulkDeactivate && (
              <button
                type="button"
                onClick={onBulkDeactivate}
                className="btn btn-outline"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.3rem 0.65rem',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: '#dc2626',
                  borderColor: 'rgba(220, 38, 38, 0.3)'
                }}
              >
                <PowerOff size={13} /> Deactivate Selected
              </button>
            )}
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="btn btn-outline"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.3rem 0.65rem',
                  height: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <X size={13} /> Deselect All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)', fontWeight: 600 }}>
              <th style={{ padding: '0.9rem 1rem', width: '40px' }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isSomeSelected;
                  }}
                  onChange={onToggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '0.9rem 1rem' }}>Branch Name</th>
              <th style={{ padding: '0.9rem 1rem' }}>Location</th>
              <th style={{ padding: '0.9rem 1rem' }}>Status</th>
              <th style={{ padding: '0.9rem 1rem' }}>Contact</th>
              <th style={{ padding: '0.9rem 1rem' }}>Operating Hours</th>
              <th style={{ padding: '0.9rem 1rem' }}>Created</th>
              <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {branches.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'grid', gap: '0.35rem', justifyItems: 'center' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{emptyTitle}</strong>
                    <span style={{ fontSize: '0.82rem' }}>{emptyDescription}</span>
                  </div>
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <ClinicBranchRow
                  key={branch.id}
                  branch={branch}
                  isSelected={selectedBranchId === branch.id}
                  onSelect={() => onSelectBranch?.(branch.id)}
                  isChecked={selectedIds.includes(branch.id)}
                  onToggleCheck={() => onToggleSelectId?.(branch.id)}
                  onAction={onAction}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (10 items per page) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1rem',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--background)',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <span>
          Showing {branches.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, totalCount || branches.length)} of {totalCount || branches.length} branches
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
            style={{
              padding: '0.3rem 0.6rem',
              height: '32px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange?.(pageNum)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                border: currentPage === pageNum ? '1px solid var(--primary)' : '1px solid var(--border)',
                backgroundColor: currentPage === pageNum ? 'var(--primary)' : 'var(--card-bg)',
                color: currentPage === pageNum ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontWeight: currentPage === pageNum ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {pageNum}
            </button>
          ))}

          <button
            type="button"
            className="btn btn-outline"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
            style={{
              padding: '0.3rem 0.6rem',
              height: '32px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.2rem'
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
