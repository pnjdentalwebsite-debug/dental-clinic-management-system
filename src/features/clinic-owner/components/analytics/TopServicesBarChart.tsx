import { Stethoscope } from 'lucide-react';
import type { TopServiceDataPoint } from '../../types/clinicAnalytics';

interface Props {
  services: TopServiceDataPoint[];
}

export function TopServicesBarChart({ services }: Props) {
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
            <Stethoscope size={18} style={{ color: '#ec4899' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Top & Most Availed Dental Procedures
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Ranking of clinical procedures performed by volume and share.
          </span>
        </div>
      </div>

      {/* Services List with Horizontal Progress Bars */}
      {services.length === 0 ? (
        <div
          style={{
            padding: '2.5rem 1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.86rem'
          }}
        >
          No clinical procedures documented or billed yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {services.map((item, index) => (
            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.84rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)'
                    }}
                  >
                    {index + 1}
                  </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{item.name}</strong>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.45rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontWeight: 600
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {item.count} {item.count === 1 ? 'case' : 'cases'}
                  </span>
                  <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)', minWidth: '36px', textAlign: 'right' }}>
                    {item.percentage}%
                  </strong>
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
                    width: `${Math.min(item.percentage, 100)}%`,
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
      )}
    </div>
  );
}
