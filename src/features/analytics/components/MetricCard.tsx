import type { MetricCardData } from '../types';

export function MetricCard({ metric }: { metric: MetricCardData }) {
  const Icon = metric.icon;
  const statusColors: Record<string, { bg: string; color: string }> = {
    positive: { bg: 'var(--success-light)', color: 'var(--success)' },
    negative: { bg: 'var(--danger-light)', color: 'var(--danger)' },
    warning: { bg: 'var(--warning-light)', color: '#b45309' },
    neutral: { bg: 'var(--background)', color: 'var(--text-secondary)' }
  };
  const style = statusColors[metric.status] || statusColors.neutral;

  return (
    <article
      className="analytics-metric-card"
      title={metric.description}
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.875rem',
        minHeight: '112px',
        maxHeight: '128px',
        overflow: 'hidden'
      }}
    >
      {Icon && (
        <div style={{
          backgroundColor: style.bg,
          color: style.color,
          padding: '0.625rem',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={20} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap'
        }}>
          {metric.label}
        </span>
        <span style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginTop: '0.1rem',
          lineHeight: 1.2
        }}>
          {metric.formattedValue}
        </span>
        {metric.sourceModules.length > 0 && (
          <span style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            marginTop: '0.2rem',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            Source: {metric.sourceModules.join(', ')}
          </span>
        )}
      </div>
    </article>
  );
}
