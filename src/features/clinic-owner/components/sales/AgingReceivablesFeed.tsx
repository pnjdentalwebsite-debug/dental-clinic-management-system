import { useState, useMemo } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, MessageSquare, Phone } from 'lucide-react';
import type { AgingReceivableItem } from '../../types/salesOverview';

interface Props {
  receivables: AgingReceivableItem[];
  onRemindPatient?: (patient: AgingReceivableItem) => void;
}

export function AgingReceivablesFeed({ receivables, onRemindPatient }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(receivables.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return receivables.slice(start, start + itemsPerPage);
  }, [receivables, currentPage]);

  return (
    <div
      className="dashboard-panel"
      style={{
        margin: 0,
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={18} style={{ color: '#d97706' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Aging Receivables & Pending Balances
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Track uncollected installment accounts, HMO co-pays, and overdue treatment billings.
          </span>
        </div>

        <span
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            backgroundColor: receivables.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--background)',
            color: receivables.length > 0 ? '#ef4444' : 'var(--text-muted)',
            border: `1px solid ${receivables.length > 0 ? 'rgba(239, 68, 68, 0.2)' : 'var(--border)'}`
          }}
        >
          {receivables.length} Unsettled Accounts (5 per page)
        </span>
      </div>

      {/* Table Feed - 500px container with compact top-aligned rows */}
      <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflowX: 'auto', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', backgroundColor: 'var(--card-bg)' }}>
        <table className="data-table" style={{ margin: 0, fontSize: '0.84rem', width: '100%', minWidth: '700px', height: 'auto', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Patient & Contact</th>
              <th style={{ padding: '0.85rem 1rem' }}>Branch</th>
              <th style={{ padding: '0.85rem 1rem' }}>Treatment Plan</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Total Bill</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Balance Due</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Status / Overdue</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Zero outstanding balances — all accounts settled.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', height: '54px' }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'grid' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.86rem' }}>{item.patientName}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Phone size={11} />
                        {item.mobileNumber}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>
                    {item.branchName}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                    {item.serviceAvailed}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                    PHP {item.totalBill.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: '#dc2626' }}>
                    PHP {item.balanceDue.toLocaleString()}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor:
                          item.status === 'OVERDUE'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : item.status === 'INSTALLMENT'
                              ? 'rgba(59, 130, 246, 0.12)'
                              : 'rgba(16, 185, 129, 0.12)',
                        color:
                          item.status === 'OVERDUE'
                            ? '#dc2626'
                            : item.status === 'INSTALLMENT'
                              ? '#2563eb'
                              : '#059669'
                      }}
                    >
                      {item.status === 'OVERDUE'
                        ? `Overdue (${item.overdueDays}d)`
                        : item.status === 'INSTALLMENT'
                          ? 'Installment Plan'
                          : 'Current'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => onRemindPatient?.(item)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.76rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        width: 'auto'
                      }}
                    >
                      <MessageSquare size={13} />
                      Remind
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Always Visible Pagination Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.4rem 0.25rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <span>
          Showing {receivables.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, receivables.length)} of {receivables.length} accounts
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.76rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', padding: '0 0.35rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-outline"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{ padding: '0.3rem 0.65rem', fontSize: '0.76rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
