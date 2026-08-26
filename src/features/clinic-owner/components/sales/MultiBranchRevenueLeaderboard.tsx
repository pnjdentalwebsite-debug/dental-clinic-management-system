import { useState, useMemo } from 'react';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BranchFinancialPerformance } from '../../types/salesOverview';

interface Props {
  branchPerformance: BranchFinancialPerformance[];
}

export function MultiBranchRevenueLeaderboard({ branchPerformance }: Props) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(branchPerformance.length / itemsPerPage) || 1;
  const paginatedBranches = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return branchPerformance.slice(start, start + itemsPerPage);
  }, [branchPerformance, page]);

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
        boxShadow: 'var(--shadow-sm)',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Building2 size={18} style={{ color: '#0d9488' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Multi-Branch Financial Leaderboard
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Comparative revenue contribution and lab deduction breakdown across all practice branches.
          </span>
        </div>

        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '0.2rem 0.55rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(13, 148, 136, 0.12)',
            color: '#0d9488',
            border: '1px solid rgba(13, 148, 136, 0.25)'
          }}
        >
          {branchPerformance.length} Branches (5 per page)
        </span>
      </div>

      {/* Leaderboard Table - 500px container with compact top-aligned rows */}
      <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflowX: 'auto', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', backgroundColor: 'var(--card-bg)' }}>
        <table className="data-table" style={{ margin: 0, fontSize: '0.84rem', width: '100%', minWidth: '650px', height: 'auto', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--background)' }}>
              <th style={{ padding: '0.85rem 1rem' }}>Branch</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Gross Revenue</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Collected</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Lab Costs</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Net Intake</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {paginatedBranches.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No branch financial performance data recorded yet.
                </td>
              </tr>
            ) : (
              paginatedBranches.map((branch, idx) => {
                const globalIndex = (page - 1) * itemsPerPage + idx;
                return (
                  <tr key={branch.branchId} style={{ borderBottom: '1px solid var(--border)', height: '52px' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            backgroundColor: globalIndex === 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--background)',
                            color: globalIndex === 0 ? '#059669' : 'var(--text-muted)',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border)'
                          }}
                        >
                          #{globalIndex + 1}
                        </span>
                        <div style={{ display: 'grid' }}>
                          <strong style={{ color: 'var(--text-primary)', fontSize: '0.86rem' }}>{branch.branchName}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{branch.branchCode} • {branch.sharePercentage}% Share</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      PHP {branch.grossRevenue.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      PHP {branch.collectedAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', color: '#d97706', fontWeight: 600 }}>
                      - PHP {branch.labExpenses.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }}>
                      PHP {branch.netRevenue.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: branch.collectionRate >= 80 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: branch.collectionRate >= 80 ? '#059669' : '#d97706'
                        }}
                      >
                        {branch.collectionRate}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Always Visible Pagination Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.25rem' }}>
        <span>Showing {branchPerformance.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to {Math.min(page * itemsPerPage, branchPerformance.length)} of {branchPerformance.length} branches</span>
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
