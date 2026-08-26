import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import type { TimeRangeOption, VolumeDataPoint } from '../../types/clinicAnalytics';

interface Props {
  data: VolumeDataPoint[];
  timeRange: TimeRangeOption;
  onChangeTimeRange: (range: TimeRangeOption) => void;
}

export function PatientVolumeChart({ data, timeRange, onChangeTimeRange }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.total), 10);
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
      {/* Header with Title & Time Range Switcher */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Patient Volume & Traffic Trend
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Historical patient visits split by scheduled appointments and walk-ins.
          </span>
        </div>

        {/* Time Range Pills */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--background)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            gap: '0.2rem'
          }}
        >
          {(['day', 'week', 'month', 'year'] as TimeRangeOption[]).map((range) => {
            const isActive = timeRange === range;
            const labels: Record<TimeRangeOption, string> = {
              day: 'Daily (Hourly)',
              week: 'Weekly (Mon-Sun)',
              month: 'Monthly (Weeks)',
              year: 'Yearly (Months)'
            };
            return (
              <button
                key={range}
                type="button"
                onClick={() => onChangeTimeRange(range)}
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.76rem',
                  fontWeight: isActive ? 700 : 500,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {labels[range]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div style={{ position: 'relative', width: '100%', height: `${chartHeight + 40}px` }}>
        {/* Horizontal background grid lines */}
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
                  width: '32px',
                  textAlign: 'right',
                  paddingRight: '0.4rem',
                  fontFamily: 'monospace'
                }}
              >
                {Math.round(maxValue * ratio)}
              </span>
              <div style={{ flex: 1 }} />
            </div>
          ))}
        </div>

        {/* Interactive Column Bars Container */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '36px',
            right: '12px',
            height: `${chartHeight}px`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            gap: '0.4rem'
          }}
        >
          {data.map((item, index) => {
            const apptHeight = (item.appointments / maxValue) * chartHeight;
            const walkinHeight = (item.walkins / maxValue) * chartHeight;
            const totalHeight = (item.total / maxValue) * chartHeight;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  flex: 1,
                  maxWidth: '48px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                {/* Hover Tooltip Popup */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: `${totalHeight + 12}px`,
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
                      {item.label} • Total: {item.total} Patients
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#60a5fa' }}>
                      <span>● Appointments:</span>
                      <strong>{item.appointments}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2dd4bf' }}>
                      <span>● Walk-ins:</span>
                      <strong>{item.walkins}</strong>
                    </div>
                  </div>
                )}

                {/* Stacked Bar Container */}
                <div
                  style={{
                    width: '100%',
                    height: `${totalHeight}px`,
                    borderRadius: '6px 6px 0 0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column-reverse',
                    transition: 'all 0.2s ease',
                    boxShadow: isHovered ? '0 0 12px rgba(99, 102, 241, 0.4)' : 'none',
                    opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1
                  }}
                >
                  {/* Appointment Bar (Bottom) */}
                  <div
                    style={{
                      width: '100%',
                      height: `${apptHeight}px`,
                      background: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)'
                    }}
                  />
                  {/* Walkin Bar (Top) */}
                  <div
                    style={{
                      width: '100%',
                      height: `${walkinHeight}px`,
                      background: 'linear-gradient(180deg, #14b8a6 0%, #0f766e 100%)'
                    }}
                  />
                </div>

                {/* X-Axis Label */}
                <span
                  style={{
                    position: 'absolute',
                    top: `${chartHeight + 8}px`,
                    fontSize: '0.72rem',
                    color: isHovered ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: isHovered ? 700 : 500,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
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
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Scheduled Appointments</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#14b8a6' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Walk-in Visits</span>
        </div>
      </div>
    </div>
  );
}
