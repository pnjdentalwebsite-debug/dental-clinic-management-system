import { useState } from 'react';

export interface HistogramDataPoint {
  label: string;
  value: number;
  formattedValue?: string;
  isPeak?: boolean;
}

interface HistogramAreaChartProps {
  title?: string;
  subtitle?: string;
  data: HistogramDataPoint[];
  color?: string;
  height?: number;
  emptyMessage?: string;
}

export function HistogramAreaChart({
  title,
  subtitle,
  data,
  color = '#8b5cf6', // purple
  height = 180,
  emptyMessage = 'No distribution data available.'
}: HistogramAreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(1, ...data.map(d => d.value || 0));
  const peakItem = data.reduce((prev, cur) => (cur.value > (prev?.value || 0) ? cur : prev), data[0]);

  return (
    <div className="histogram-area-chart-card" style={{
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
        <div>
          {title && <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{title}</h3>}
          {subtitle && <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>{subtitle}</p>}
        </div>

        {peakItem && peakItem.value > 0 && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            backgroundColor: '#f5f3ff',
            color: '#7c3aed',
            fontSize: '0.75rem',
            fontWeight: 700,
            border: '1px solid #ddd6fe'
          }}>
            <span>⚡ Peak: {peakItem.label} ({peakItem.formattedValue || peakItem.value})</span>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ position: 'relative', height: `${height}px`, display: 'flex', alignItems: 'flex-end', gap: '4px', paddingTop: '1.5rem' }}>
          {/* Y-axis guidelines */}
          <div style={{ position: 'absolute', inset: '1.5rem 0 2rem 0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 0 }}>
            <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }} />
            <div style={{ borderTop: '1px dashed #e2e8f0', width: '100%' }} />
            <div style={{ borderTop: '1px solid #cbd5e1', width: '100%' }} />
          </div>

          {/* Histogram Bars */}
          <div style={{ display: 'flex', width: '100%', height: 'calc(100% - 24px)', alignItems: 'flex-end', gap: '6px', zIndex: 1 }}>
            {data.map((point, index) => {
              const barHeight = Math.max(6, ((point.value || 0) / maxValue) * 100);
              const isHovered = hoveredIndex === index;
              const isPeak = point.isPeak || point.label === peakItem?.label;

              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
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
                      {point.label}: {point.formattedValue || point.value.toLocaleString()}
                    </div>
                  )}

                  {/* Histogram Bar with subtle gradient */}
                  <div style={{
                    width: '100%',
                    height: `${barHeight}%`,
                    background: isPeak
                      ? 'linear-gradient(180deg, #7c3aed 0%, #a855f7 100%)'
                      : isHovered
                      ? color
                      : 'linear-gradient(180deg, rgba(139, 92, 246, 0.8) 0%, rgba(139, 92, 246, 0.4) 100%)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.15s ease',
                    opacity: hoveredIndex !== null && !isHovered ? 0.45 : 1
                  }} />

                  {/* X-axis Label */}
                  <div style={{
                    marginTop: '6px',
                    fontSize: '0.65rem',
                    fontWeight: isPeak ? 800 : isHovered ? 700 : 500,
                    color: isPeak ? '#7c3aed' : isHovered ? '#0f172a' : '#64748b',
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
