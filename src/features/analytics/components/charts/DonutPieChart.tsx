import { useState, useMemo } from 'react';

export interface PieChartDataPoint {
  label: string;
  value: number;
  color?: string;
  formattedValue?: string;
}

interface DonutPieChartProps {
  title?: string;
  subtitle?: string;
  data: PieChartDataPoint[];
  centerLabel?: string;
  centerValue?: string;
  size?: number;
  donutThickness?: number;
  emptyMessage?: string;
}

const DEFAULT_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b'  // slate
];

export function DonutPieChart({
  title,
  subtitle,
  data,
  centerLabel = 'Total',
  centerValue,
  size = 200,
  donutThickness = 28,
  emptyMessage = 'No data available.'
}: DonutPieChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((acc, item) => acc + (item.value || 0), 0), [data]);

  const items = useMemo(() => {
    return data.map((item, index) => ({
      ...item,
      color: item.color || DEFAULT_PALETTE[index % DEFAULT_PALETTE.length],
      percentage: total > 0 ? (item.value / total) * 100 : 0
    }));
  }, [data, total]);

  const radius = size / 2 - donutThickness / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const displayCenterValue = hoveredIndex !== null && items[hoveredIndex]
    ? (items[hoveredIndex].formattedValue || items[hoveredIndex].value.toLocaleString())
    : (centerValue || total.toLocaleString());

  const displayCenterLabel = hoveredIndex !== null && items[hoveredIndex]
    ? items[hoveredIndex].label
    : centerLabel;

  const displayPercent = hoveredIndex !== null && items[hoveredIndex]
    ? `${items[hoveredIndex].percentage.toFixed(1)}%`
    : null;

  return (
    <div className="donut-pie-chart-card" style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {(title || subtitle) && (
        <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
          {title && <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>{subtitle}</p>}
        </div>
      )}

      {total === 0 || data.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(180px, 1fr) 1.2fr',
          gap: '1.25rem',
          alignItems: 'center'
        }}>
          {/* SVG DONUT */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={donutThickness}
              />
              {/* Slices */}
              {items.map((item, index) => {
                const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += item.percentage;
                const isHovered = hoveredIndex === index;

                return (
                  <circle
                    key={index}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isHovered ? donutThickness + 4 : donutThickness}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      transition: 'stroke-width 0.2s ease, opacity 0.2s ease',
                      cursor: 'pointer',
                      opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1
                    }}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Center Label Overlay */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
              maxWidth: size - donutThickness * 2 - 16
            }}>
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {displayCenterLabel}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {displayCenterValue}
              </div>
              {displayPercent && (
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', marginTop: '1px' }}>
                  {displayPercent}
                </div>
              )}
            </div>
          </div>

          {/* LEGEND BADGES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {items.map((item, index) => {
              const isHovered = hoveredIndex === index;
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '8px',
                    backgroundColor: isHovered ? '#f8fafc' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <span style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '3px',
                      backgroundColor: item.color,
                      flexShrink: 0
                    }} />
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: isHovered ? 700 : 500,
                      color: isHovered ? '#0f172a' : '#334155',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.label}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>
                      {item.formattedValue || item.value.toLocaleString()}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: '#64748b',
                      backgroundColor: '#f1f5f9',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px'
                    }}>
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
