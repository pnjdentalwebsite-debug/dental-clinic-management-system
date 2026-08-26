import { useState } from 'react';
import { CalendarDays, Star } from 'lucide-react';
import type { DayStreakDataPoint } from '../../types/clinicAnalytics';

interface Props {
  data: DayStreakDataPoint[];
}

export function DayOfWeekStreakChart({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxValue = Math.max(...data.map((d) => d.visits), 10);
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
            <CalendarDays size={18} style={{ color: '#10b981' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Day-of-Week Traffic Streak
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Weekly demand pattern across Monday through Sunday.
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '999px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#059669',
            fontSize: '0.72rem',
            fontWeight: 700
          }}
        >
          <Star size={13} />
          High: Fri & Sat
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
            gap: '0.6rem'
          }}
        >
          {data.map((item, index) => {
            const barHeight = (item.visits / maxValue) * chartHeight;
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
                    <strong>{item.fullDay}</strong>: {item.visits} Total Visits ({item.appointmentPct}% Appointments)
                  </div>
                )}

                {/* Bar */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '44px',
                    height: `${barHeight}px`,
                    borderRadius: '6px 6px 0 0',
                    background: item.isPeak
                      ? 'linear-gradient(180deg, #10b981 0%, #047857 100%)'
                      : 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)',
                    boxShadow: isHovered || item.isPeak ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                />

                {/* Day Label */}
                <span
                  style={{
                    position: 'absolute',
                    top: `${chartHeight + 6}px`,
                    fontSize: '0.72rem',
                    color: item.isPeak ? '#059669' : 'var(--text-muted)',
                    fontWeight: item.isPeak ? 700 : 600,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
