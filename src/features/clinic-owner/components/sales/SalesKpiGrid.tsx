import { AlertCircle, DollarSign, Receipt, TrendingUp, Wallet } from 'lucide-react';
import type { SalesKpiData } from '../../types/salesOverview';

interface Props {
  kpis: SalesKpiData;
}

export function SalesKpiGrid({ kpis }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem'
      }}
    >
      {/* KPI 1: Gross Billed Revenue */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Gross Billed Revenue
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              PHP {kpis.grossRevenue.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <DollarSign size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
          <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingUp size={14} />
            {kpis.grossRevenueGrowth}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>• active period</span>
        </div>
      </div>

      {/* KPI 2: Total Collected Cash & Digital */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Total Collected Intake
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#059669' }}>
              PHP {kpis.collectedAmount.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Wallet size={22} />
          </div>
        </div>

        {/* Collection Efficiency Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-muted)' }}>Collection Rate</span>
            <span style={{ color: '#059669' }}>{kpis.collectionRate}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', borderRadius: '999px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ width: `${kpis.collectionRate}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '999px' }} />
          </div>
        </div>
      </div>

      {/* KPI 3: Outstanding Receivables */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Outstanding Receivables
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#f59e0b' }}>
              PHP {kpis.outstandingReceivables.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertCircle size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: '#d97706' }}>{kpis.outstandingReceivablesCount} accounts</span>
          <span>with pending installment / HMO dues</span>
        </div>
      </div>

      {/* KPI 4: Average Ticket Size */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Average Spend / Visit
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)' }}>
              PHP {kpis.averageTicketSize.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Receipt size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{kpis.totalTransactionsCount} paid visits</span>
          <span>recorded this period</span>
        </div>
      </div>
    </div>
  );
}
