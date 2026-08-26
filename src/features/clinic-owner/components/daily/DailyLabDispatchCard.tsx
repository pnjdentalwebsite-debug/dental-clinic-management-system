import { useState, useMemo } from 'react';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';
import type { DailyLabDispatchItem } from '../../types/dailyReports';

interface Props {
  dispatches: DailyLabDispatchItem[];
}

export function DailyLabDispatchCard({ dispatches }: Props) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(dispatches.length / itemsPerPage) || 1;
  const paginatedDispatches = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return dispatches.slice(start, start + itemsPerPage);
  }, [dispatches, page]);

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
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)',
        height: '100%',
        justifyContent: 'space-between'
      }}
    >
      {/* Header - Perfectly aligned with Clinical Roster */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', minHeight: '46px' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FlaskConical size={18} style={{ color: '#d97706' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Dental Lab Orders & Logistics Log
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Impressions sent to connected partner laboratories and prosthetics received today.
          </span>
        </div>

        {dispatches.length > 0 && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(217, 119, 6, 0.12)',
              color: '#d97706',
              border: '1px solid rgba(217, 119, 6, 0.25)'
            }}
          >
            {dispatches.length} Orders
          </span>
        )}
      </div>

      {/* Dispatches List - 500px container with compact top-aligned rows */}
      <div
        className="table-container"
        style={{
          margin: 0,
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflowX: 'auto',
          minHeight: '500px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          backgroundColor: 'var(--card-bg)'
        }}
      >
        <table className="data-table" style={{ margin: 0, fontSize: '0.82rem', width: '100%', height: 'auto', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background)' }}>
              <th style={{ padding: '0.75rem 0.85rem' }}>Time & Order ID</th>
              <th style={{ padding: '0.75rem 0.85rem' }}>Patient Name</th>
              <th style={{ padding: '0.75rem 0.85rem' }}>Laboratory Partner</th>
              <th style={{ padding: '0.75rem 0.85rem' }}>Item / Prosthesis</th>
              <th style={{ padding: '0.75rem 0.85rem', textAlign: 'center' }}>Direction / Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDispatches.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', height: '100px', verticalAlign: 'middle' }}>
                  No lab dispatches or deliveries recorded today.
                </td>
              </tr>
            ) : (
              paginatedDispatches.map((item) => (
                <tr key={item.orderId} style={{ borderBottom: '1px solid var(--border)', height: '52px' }}>
                  <td style={{ padding: '0.85rem 0.85rem' }}>
                    <div style={{ display: 'grid' }}>
                      <strong style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>{item.orderId}</strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.time}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.patientName}
                  </td>
                  <td style={{ padding: '0.85rem 0.85rem', color: 'var(--text-secondary)' }}>
                    {item.labName}
                  </td>
                  <td style={{ padding: '0.85rem 0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
                    {item.itemType}
                  </td>
                  <td style={{ padding: '0.85rem 0.85rem', textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        backgroundColor:
                          item.direction === 'RECEIVED_FROM_LAB'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(59, 130, 246, 0.12)',
                        color:
                          item.direction === 'RECEIVED_FROM_LAB'
                            ? '#059669'
                            : '#2563eb'
                      }}
                    >
                      {item.direction === 'RECEIVED_FROM_LAB' ? (
                        <>
                          <ArrowDownLeft size={13} />
                          Received (Ready)
                        </>
                      ) : (
                        <>
                          <ArrowUpRight size={13} />
                          Dispatched (Sent)
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Always Visible Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <span>Showing {dispatches.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, dispatches.length)} of {dispatches.length} orders (5 per page)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            <ChevronLeft size={13} />
            Prev
          </button>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', padding: '0 0.25rem' }}>Page {page} of {totalPages}</span>
          <button type="button" className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            Next
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
