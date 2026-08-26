import { Layers } from 'lucide-react';
import type { ServiceCategoryRevenue } from '../../types/salesOverview';

interface Props {
  categories: ServiceCategoryRevenue[];
}

export function ServiceCategoryRevenueChart({ categories }: Props) {
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
            <Layers size={18} style={{ color: '#6366f1' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Revenue by Clinical Service Category
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Financial contribution per clinical specialty and treatment department.
          </span>
        </div>
      </div>

      {/* Progress Bars List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
        {categories.map((item, index) => (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}
                >
                  {index + 1}
                </span>
                <strong style={{ color: 'var(--text-primary)' }}>{item.category}</strong>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                  }}
                >
                  ({item.casesCount} cases)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                  PHP {item.amount.toLocaleString()}
                </strong>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: item.color,
                    minWidth: '34px',
                    textAlign: 'right'
                  }}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Horizontal Bar */}
            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '999px',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${item.percentage * 2.6}%`,
                  maxWidth: '100%',
                  height: '100%',
                  backgroundColor: item.color,
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
