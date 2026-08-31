import { CheckSquare, ChevronLeft, ChevronRight, Power, PowerOff, X } from 'lucide-react';
import { DentistTableRow } from './DentistTableRow';
import type { ClinicOwnerAssociateDirectoryItem } from '../../../infrastructure/supabase/clinicOwnerAssociateApi';

interface Props {
  dentists: ClinicOwnerAssociateDirectoryItem[];
  selectedDentistId?: string;
  onSelectDentist: (dentistId: string) => void;
  onAction: (action: string, dentist: ClinicOwnerAssociateDirectoryItem) => void;
  readOnly?: boolean;
  // Bulk selection props
  selectedIds?: string[];
  onToggleSelectAll?: (checked: boolean) => void;
  onToggleSelectId?: (id: string, checked: boolean) => void;
  onBulkActivate?: () => void;
  onBulkDeactivate?: () => void;
  onClearSelection?: () => void;
  // Pagination props
  currentPage?: number;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export function DentistDirectoryTable({
  dentists,
  selectedDentistId,
  onSelectDentist,
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
  readOnly = false,
}: Props) {
  const isAllSelected = dentists.length > 0 && dentists.every((d) => selectedIds.includes(d.membershipId));
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const totalPages = Math.max(1, Math.ceil((totalCount || dentists.length) / pageSize));
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount || dentists.length);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      {/* Refined Modern Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            padding: '0.65rem 1.15rem',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(20, 184, 166, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.85rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                backgroundColor: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckSquare size={15} />
            </div>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedIds.length} {selectedIds.length === 1 ? 'dentist' : 'dentists'} selected
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
            {onBulkActivate && (
              <button
                type="button"
                onClick={onBulkActivate}
                style={{
                  padding: '0.4rem 0.85rem',
                  height: '34px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#059669',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Power size={14} /> Activate Selected
              </button>
            )}
            {onBulkDeactivate && (
              <button
                type="button"
                onClick={onBulkDeactivate}
                style={{
                  padding: '0.4rem 0.85rem',
                  height: '34px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  color: '#dc2626',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <PowerOff size={14} /> Deactivate Selected
              </button>
            )}
            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                style={{
                  padding: '0.4rem 0.75rem',
                  height: '34px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={14} /> Deselect All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Expanded Table Container (stretches flex: 1 to match preview card height) */}
      <div
        className="table-container"
        style={{
          margin: 0,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflowX: 'auto',
          backgroundColor: 'var(--card-bg)',
          flex: 1,
          minHeight: '480px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--background)',
                borderBottom: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontWeight: 600
              }}
            >
              <th style={{ padding: '1rem', width: '40px' }}>
                <input
                  type="checkbox"
                  style={{ cursor: 'pointer' }}
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                  aria-label="Select all dentists on this page"
                />
              </th>
              <th style={{ padding: '1rem', minWidth: '220px' }}>Associate Dentist</th>
              <th style={{ padding: '1rem', minWidth: '150px' }}>Specialization</th>
              <th style={{ padding: '1rem', minWidth: '130px' }}>Designation</th>
              <th style={{ padding: '1rem', minWidth: '160px' }}>Mobile Number</th>
              <th style={{ padding: '1rem', minWidth: '110px' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right', minWidth: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dentists.length > 0 ? (
              dentists.map((dentist) => (
                <DentistTableRow
                  key={dentist.membershipId}
                  dentist={dentist}
                  isSelected={selectedDentistId === dentist.membershipId}
                  isChecked={selectedIds.includes(dentist.membershipId)}
                  onSelect={() => onSelectDentist(dentist.membershipId)}
                  onToggleCheck={() => onToggleSelectId?.(dentist.membershipId, !selectedIds.includes(dentist.membershipId))}
                  onAction={onAction}
                  readOnly={readOnly}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: '4rem 1.25rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'grid', gap: '0.4rem', justifyItems: 'center' }}>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>No Associate Dentists yet</strong>
                    <span style={{ fontSize: '0.84rem' }}>No real Associate Dentist memberships are available for this subscriber.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer (10 Data per page) */}
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem'
          }}
        >
          <div style={{ color: 'var(--text-muted)' }}>
            {totalCount > 0 ? (
              <span>
                Showing <strong style={{ color: 'var(--text-primary)' }}>{startIndex}</strong> to{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{endIndex}</strong> of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong> associates
              </span>
            ) : (
              <span>0 associates</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              disabled={currentPage <= 1}
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              style={{ padding: '0.3rem 0.6rem', height: '32px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
            >
              <ChevronLeft size={14} /> Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange?.(page)}
                style={{
                  minWidth: '32px',
                  height: '32px',
                  padding: '0 0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: currentPage === page ? '1px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: currentPage === page ? 'var(--primary)' : 'var(--card-bg)',
                  color: currentPage === page ? '#fff' : 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="btn btn-outline"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              style={{ padding: '0.3rem 0.6rem', height: '32px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
