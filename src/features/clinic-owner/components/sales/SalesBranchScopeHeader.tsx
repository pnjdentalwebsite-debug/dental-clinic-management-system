import { DollarSign, FlaskConical, Percent, ShieldCheck } from 'lucide-react';
import type { BranchScopeOption } from '../../types/clinicAnalytics';
import type { SalesKpiData } from '../../types/salesOverview';

interface Props {
  availableBranches: BranchScopeOption[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  kpis: SalesKpiData;
}

export function SalesBranchScopeHeader({
  availableBranches,
  selectedBranchId,
  onSelectBranch,
  kpis
}: Props) {
  const netPracticeIntake = kpis.collectedAmount - kpis.labExpensesTotal;

  return (
    <div
      className="dashboard-panel"
      style={{
        margin: 0,
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Top row: Title + Branch Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#059669'
              }}
            >
              Financial Intelligence & Sales
            </span>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                backgroundColor: selectedBranchId === 'all' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)',
                color: selectedBranchId === 'all' ? '#059669' : '#2563eb',
                border: `1px solid ${selectedBranchId === 'all' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`
              }}
            >
              {selectedBranchId === 'all' ? 'All Branches Consolidated' : 'Branch Financial Scope'}
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Sales & Revenue Overview
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Real-time gross billing, cash collections, payment channels, lab expense deductions, and receivables.
          </p>
        </div>

        {/* Branch Scope Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Financial Scope:
          </label>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedBranchId}
              onChange={(e) => onSelectBranch(e.target.value)}
              style={{
                padding: '0.55rem 2.25rem 0.55rem 0.95rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--background)',
                border: '1.5px solid #059669',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                minWidth: '240px'
              }}
            >
              <option value="all">🏢 All Branches (Consolidated Financials)</option>
              {availableBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  📍 {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Financial Health Snapshot Pill Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          padding: '0.85rem 1.15rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <DollarSign size={16} />
          </div>
          <div style={{ display: 'grid' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Billed Revenue</span>
            <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
              PHP {kpis.grossRevenue.toLocaleString()}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Percent size={16} />
          </div>
          <div style={{ display: 'grid' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Collection Efficiency</span>
            <strong style={{ fontSize: '0.86rem', color: '#059669' }}>
              {kpis.collectionRate}% Collected
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FlaskConical size={16} />
          </div>
          <div style={{ display: 'grid' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Lab Fabrication Costs</span>
            <strong style={{ fontSize: '0.86rem', color: '#d97706' }}>
              PHP {kpis.labExpensesTotal.toLocaleString()}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={16} />
          </div>
          <div style={{ display: 'grid' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Net Practice Intake</span>
            <strong style={{ fontSize: '0.86rem', color: 'var(--primary)' }}>
              PHP {netPracticeIntake.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
