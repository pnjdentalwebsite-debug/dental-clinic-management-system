import { useState } from 'react';

export interface ColumnChartDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  formattedValue?: string;
  formattedSecondaryValue?: string;
  color?: string;
  secondaryColor?: string;
  sublabel?: string;
}

interface VerticalColumnChartProps {
  title?: string;
  subtitle?: string;
  data: ColumnChartDataPoint[];
  primaryLegend?: string;
  secondaryLegend?: string;
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
  emptyMessage?: string;
}

export function VerticalColumnChart({
  title,
  subtitle,
  data,
  primaryLegend = 'Primary Metric',
  secondaryLegend,
  primaryColor = '#3b82f6',
  secondaryColor = '#10b981',
  height = 220,
  emptyMessage = 'No chart data available.'
}: VerticalColumnChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(
    1,
    ...data.flatMap(d => [d.value || 0, d.secondaryValue || 0])
  );

  return (
    <div className="vertical-column-chart-card" style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Header & Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
        <div>
          {title && <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>{subtitle}</p>}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: primaryColor }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{primaryLegend}</span>
          </div>
          {secondaryLegend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: secondaryColor }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{secondaryLegend}</span>
            </div>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ position: 'relative', height: `${height}px`, display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingTop: '1.5rem' }}>
          {/* Y-axis grid guidelines */}
          <div style={{ position: 'absolute', inset: '1.5rem 0 2rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
            <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }} />
            <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }} />
            <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }} />
            <div style={{ borderTop: '1px solid #cbd5e1', width: '100%' }} />
          </div>

          {/* Columns */}
          <div style={{ display: 'flex', width: '100%', height: 'calc(100% - 28px)', alignItems: 'flex-end', justifyContent: 'space-around', zIndex: 1 }}>
            {data.map((point, index) => {
              const primaryHeight = Math.max(4, ((point.value || 0) / maxValue) * 100);
              const secondaryHeight = point.secondaryValue !== undefined
                ? Math.max(4, (point.secondaryValue / maxValue) * 100)
                : 0;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    flex: 1,
                    maxWidth: '80px',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      top: '-32px',
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      pointerEvents: 'none'
                    }}>
                      <div>{primaryLegend}: {point.formattedValue || point.value.toLocaleString()}</div>
                      {point.secondaryValue !== undefined && secondaryLegend && (
                        <div>{secondaryLegend}: {point.formattedSecondaryValue || point.secondaryValue.toLocaleString()}</div>
                      )}
                    </div>
                  )}

                  {/* Bars Container */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '4px',
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center'
                  }}>
                    {/* Primary Bar */}
                    <div style={{
                      width: secondaryLegend ? '42%' : '60%',
                      height: `${primaryHeight}%`,
                      backgroundColor: point.color || primaryColor,
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.2s ease',
                      opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                      transform: isHovered ? 'scaleY(1.03)' : 'none',
                      transformOrigin: 'bottom'
                    }} />

                    {/* Secondary Bar */}
                    {point.secondaryValue !== undefined && (
                      <div style={{
                        width: '42%',
                        height: `${secondaryHeight}%`,
                        backgroundColor: point.secondaryColor || secondaryColor,
                        borderRadius: '6px 6px 0 0',
                        transition: 'all 0.2s ease',
                        opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1,
                        transform: isHovered ? 'scaleY(1.03)' : 'none',
                        transformOrigin: 'bottom'
                      }} />
                    )}
                  </div>

                  {/* X-axis Label */}
                  <div style={{
                    marginTop: '8px',
                    fontSize: '0.725rem',
                    fontWeight: isHovered ? 700 : 600,
                    color: isHovered ? '#0f172a' : '#64748b',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    width: '100%'
                  }}>
                    {point.label}
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
