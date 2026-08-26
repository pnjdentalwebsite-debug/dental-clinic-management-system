import { useState } from 'react';
import { Clock, Flame } from 'lucide-react';
import type { PeakHourDataPoint } from '../../types/clinicAnalytics';

interface Props {
  data: PeakHourDataPoint[];
}

export function PeakHoursArrivalChart({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.total), 10);
  const chartHeight = 180;

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
        gap: '1.15rem',
        boxShadow: 'var(--shadow-sm)',
        height: '100%'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={18} style={{ color: '#f59e0b' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Peak Arrival & Consultation Hours
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Patient arrival concentrations throughout the daily operating window.
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            color: '#d97706',
            fontSize: '0.72rem',
            fontWeight: 700
          }}
        >
          <Flame size={13} />
          Peak: 10 AM & 2 PM
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ position: 'relative', width: '100%', height: `${chartHeight + 36}px` }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${chartHeight}px`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '0.3rem'
          }}
        >
          {data.map((item, index) => {
            const barHeight = (item.total / maxValue) * chartHeight;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  flex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: `${barHeight + 8}px`,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(15, 23, 42, 0.96)',
                      color: '#fff',
                      padding: '0.4rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      zIndex: 999,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.3)'
                    }}
                  >
                    <strong>{item.hour}</strong>: {item.total} Patients ({item.appointments} Appt / {item.walkins} Walk-in)
                  </div>
                )}

                {/* Column Bar */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '32px',
                    height: `${barHeight}px`,
                    borderRadius: '4px 4px 0 0',
                    background: item.isPeak
                      ? 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)'
                      : 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: isHovered || item.isPeak ? '0 0 10px rgba(245, 158, 11, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />

                {/* Hour Label */}
                <span
                  style={{
                    position: 'absolute',
                    top: `${chartHeight + 6}px`,
                    fontSize: '0.66rem',
                    color: item.isPeak ? '#d97706' : 'var(--text-muted)',
                    fontWeight: item.isPeak ? 700 : 500,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.hour.replace(':00', '')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
