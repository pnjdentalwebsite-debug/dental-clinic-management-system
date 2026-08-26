import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { MonthlyRevenueTrend } from '../../types/salesOverview';

interface Props {
  data: MonthlyRevenueTrend[];
}

export function RevenueMonthlyTrendChart({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxAmount = Math.max(...data.map((d) => d.billed), 100000);
  const chartHeight = 220;

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={18} style={{ color: '#059669' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Monthly Revenue vs Cash Collections Trend
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Comparison of total billed procedure invoices against actual cash & digital intake.
          </span>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{ position: 'relative', width: '100%', height: `${chartHeight + 40}px` }}>
        {/* Background grid lines */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${chartHeight}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            borderBottom: '1px solid var(--border)'
          }}
        >
          {[1, 0.75, 0.5, 0.25, 0].map((ratio, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                borderTop: idx > 0 ? '1px dashed rgba(150, 150, 150, 0.15)' : 'none'
              }}
            >
              <span
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  width: '54px',
                  textAlign: 'right',
                  paddingRight: '0.5rem',
                  fontFamily: 'monospace'
                }}
              >
                ₱{Math.round((maxAmount * ratio) / 1000)}k
              </span>
              <div style={{ flex: 1 }} />
            </div>
          ))}
        </div>

        {/* Double Bar Columns */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '58px',
            right: '12px',
            height: `${chartHeight}px`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            gap: '0.6rem'
          }}
        >
          {data.map((item, index) => {
            const billedHeight = (item.billed / maxAmount) * chartHeight;
            const collectedHeight = (item.collected / maxAmount) * chartHeight;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  flex: 1,
                  maxWidth: '56px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: `${Math.max(billedHeight, collectedHeight) + 12}px`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(15, 23, 42, 0.96)',
                      color: '#fff',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.74rem',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      zIndex: 999,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      display: 'grid',
                      gap: '0.2rem'
                    }}
                  >
                    <div style={{ fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.2rem' }}>
                      {item.fullMonth}
                    </div>
                    <div style={{ color: '#60a5fa' }}>
                      ● Billed: <strong>PHP {item.billed.toLocaleString()}</strong>
                    </div>
                    <div style={{ color: '#34d399' }}>
                      ● Collected: <strong>PHP {item.collected.toLocaleString()}</strong>
                    </div>
                    <div style={{ color: '#fbbf24', fontSize: '0.68rem' }}>
                      Lab Expenses: PHP {item.labExpenses.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Billed Bar */}
                <div
                  style={{
                    width: '18px',
                    height: `${billedHeight}px`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s ease',
                    opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1
                  }}
                />

                {/* Collected Bar */}
                <div
                  style={{
                    width: '18px',
                    height: `${collectedHeight}px`,
                    background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s ease',
                    opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1
                  }}
                />

                {/* Month Label */}
                <span
                  style={{
                    position: 'absolute',
                    top: `${chartHeight + 8}px`,
                    fontSize: '0.72rem',
                    color: isHovered ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: isHovered ? 700 : 500
                  }}
                >
                  {item.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border)',
          fontSize: '0.78rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3b82f6' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Gross Billed Invoices</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Actual Cash / Digital Collected</span>
        </div>
      </div>
    </div>
  );
}
