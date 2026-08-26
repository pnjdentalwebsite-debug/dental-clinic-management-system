import { useState } from 'react';

export interface HorizontalBarDataPoint {
  label: string;
  value: number;
  formattedValue?: string;
  sublabel?: string;
  badge?: string;
  color?: string;
  route?: string;
}

interface HorizontalBarChartProps {
  title?: string;
  subtitle?: string;
  data: HorizontalBarDataPoint[];
  showRank?: boolean;
  color?: string;
  onDrilldown?: (route: string) => void;
  emptyMessage?: string;
}

export function HorizontalBarChart({
  title,
  subtitle,
  data,
  showRank = true,
  color = '#3b82f6',
  onDrilldown,
  emptyMessage = 'No ranking data available.'
}: HorizontalBarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxValue = Math.max(1, ...data.map(d => d.value || 0));

  return (
    <div className="horizontal-bar-chart-card" style={{
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

      {data.length === 0 ? (
        <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
          {emptyMessage}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.map((item, index) => {
            const percent = Math.min(100, Math.max(4, ((item.value || 0) / maxValue) * 100));
            const isHovered = hoveredIndex === index;
            const rankBadgeColor = index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#e2e8f0';
            const rankBadgeTextColor = index <= 2 ? '#ffffff' : '#475569';

            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '10px',
                  backgroundColor: isHovered ? '#f8fafc' : 'transparent',
                  cursor: item.route ? 'pointer' : 'default',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => item.route && onDrilldown?.(item.route)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    {showRank && (
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: rankBadgeColor,
                        color: rankBadgeTextColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {index + 1}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: isHovered ? 700 : 600,
                      color: isHovered ? '#0f172a' : '#1e293b',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 600
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {item.sublabel && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {item.sublabel}
                      </span>
                    )}
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                      {item.formattedValue || item.value.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress Track */}
                <div style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '9999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    backgroundColor: item.color || color,
                    borderRadius: '9999px',
                    transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
