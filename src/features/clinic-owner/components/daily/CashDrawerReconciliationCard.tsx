import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Wallet } from 'lucide-react';
import type { CashDrawerReconciliationData } from '../../types/dailyReports';
import { clinicOwnerSettingsStore, CLINIC_OWNER_SETTINGS_UPDATED_EVENT } from '../../services/clinicOwnerSettingsStore';

interface Props {
  reconciliation: CashDrawerReconciliationData;
}

export function CashDrawerReconciliationCard({ reconciliation }: Props) {
  const [expensePage, setExpensePage] = useState(1);
  const [startingFloat, setStartingFloat] = useState(clinicOwnerSettingsStore.getSettings().financial.pettyCashStandardFloat);
  const itemsPerPage = 5;

  useEffect(() => {
    const syncSettings = () => {
      setStartingFloat(clinicOwnerSettingsStore.getSettings().financial.pettyCashStandardFloat);
    };
    window.addEventListener(CLINIC_OWNER_SETTINGS_UPDATED_EVENT, syncSettings);
    return () => window.removeEventListener(CLINIC_OWNER_SETTINGS_UPDATED_EVENT, syncSettings);
  }, []);

  const totalExpensePages = Math.ceil(reconciliation.expenses.length / itemsPerPage) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (expensePage - 1) * itemsPerPage;
    return reconciliation.expenses.slice(start, start + itemsPerPage);
  }, [reconciliation.expenses, expensePage]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wallet size={18} style={{ color: '#059669' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Cash Drawer & EOD Financial Reconciliation
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Physical cash count, digital settlement channels, and petty cash expense deduction audit.
          </span>
        </div>
      </div>

      {/* Collection Channels Breakdown Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          padding: '0.9rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>🪙 Opening Cash Float</span>
          <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>
            PHP {startingFloat.toLocaleString()}
          </strong>
        </div>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>💵 Cash Intake Today</span>
          <strong style={{ fontSize: '1rem', color: '#059669' }}>
            PHP {reconciliation.cashInDrawer.toLocaleString()}
          </strong>
        </div>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>📱 GCash & Maya Digital</span>
          <strong style={{ fontSize: '1rem', color: '#0284c7' }}>
            PHP {reconciliation.digitalGcashMaya.toLocaleString()}
          </strong>
        </div>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>💳 POS Terminal Cards</span>
          <strong style={{ fontSize: '1rem', color: '#7c3aed' }}>
            PHP {reconciliation.digitalPosCards.toLocaleString()}
          </strong>
        </div>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>🏥 Direct HMO Settlement</span>
          <strong style={{ fontSize: '1rem', color: '#d97706' }}>
            PHP {reconciliation.directBankHmo.toLocaleString()}
          </strong>
        </div>
      </div>

      {/* Daily Petty Cash Expenses Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Daily Clinic Petty Cash Expenses (Deducted from Drawer)
          </span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>
            Total: - PHP {reconciliation.pettyCashExpensesTotal.toLocaleString()}
          </span>
        </div>

        <div className="table-container" style={{ margin: 0, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflowX: 'auto', minHeight: '500px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', backgroundColor: 'var(--card-bg)' }}>
          <table className="data-table" style={{ margin: 0, fontSize: '0.8rem', width: '100%', height: 'auto', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--background)' }}>
                <th style={{ padding: '0.75rem 0.85rem' }}>Time</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Expense Item / Description</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Category</th>
                <th style={{ padding: '0.75rem 0.85rem' }}>Recorded By</th>
                <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No petty cash expenses recorded for this day.
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((exp) => (
                  <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)', minHeight: '48px' }}>
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {exp.time}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {exp.description}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <span
                        style={{
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: 'var(--background)',
                          border: '1px solid var(--border)',
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-muted)' }}>
                      {exp.recordedBy}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                      - PHP {exp.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Always Visible Expenses Pagination Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '0.25rem' }}>
          <span>Showing {reconciliation.expenses.length > 0 ? (expensePage - 1) * itemsPerPage + 1 : 0} to {Math.min(expensePage * itemsPerPage, reconciliation.expenses.length)} of {reconciliation.expenses.length} expenses (5 per page)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <button type="button" className="btn btn-outline" disabled={expensePage <= 1} onClick={() => setExpensePage(p => Math.max(1, p - 1))} style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              <ChevronLeft size={13} />
              Prev
            </button>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', padding: '0 0.25rem' }}>Page {expensePage} of {totalExpensePages}</span>
            <button type="button" className="btn btn-outline" disabled={expensePage >= totalExpensePages} onClick={() => setExpensePage(p => Math.min(totalExpensePages, p + 1))} style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Final Reconciliation Summary Box */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1.5px solid rgba(16, 185, 129, 0.25)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShieldCheck size={20} style={{ color: '#059669' }} />
          <div>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>
              Final Net Cash for Bank Deposit
            </strong>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Drawer Cash (PHP {reconciliation.cashInDrawer.toLocaleString()}) minus Petty Cash (PHP {reconciliation.pettyCashExpensesTotal.toLocaleString()})
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#059669' }}>
            PHP {reconciliation.netCashForDeposit.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
