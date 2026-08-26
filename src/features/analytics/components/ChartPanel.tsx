import type { ChartSeries } from '../types';

export function ChartPanel({ series, onDrilldown }: { series: ChartSeries; onDrilldown?: (route: string) => void }) {
  const max = Math.max(1, ...series.data.map(item => item.value));
  return (
    <section className="dashboard-panel analytics-chart" aria-labelledby={`${series.id}-title`} aria-describedby={`${series.id}-desc`}>
      <div className="toolbar-row">
        <div>
          <h2 id={`${series.id}-title`}>{series.title}</h2>
          <p id={`${series.id}-desc`} className="muted-text">{series.description}</p>
        </div>
      </div>
      {series.data.length === 0 ? <div className="empty-state">{series.emptyMessage || 'No chart data available.'}</div> : (
        <>
          <div className="analytics-bars" role="list" aria-label={`${series.title} chart values`}>
            {series.data.map((point, index) => (
              <button key={`${series.id}-${point.label}-${point.value}-${index}`} type="button" className="analytics-bar-row" disabled={!point.route} onClick={() => point.route && onDrilldown?.(point.route)} title={`${point.label}: ${point.formattedValue || point.value}`}>
                <span>{point.label}</span>
                <div className="analytics-bar-track"><div className="analytics-bar-fill" style={{ width: `${Math.max(4, (point.value / max) * 100)}%` }} /></div>
                <strong>{point.formattedValue || point.value}</strong>
              </button>
            ))}
          </div>
          <details className="analytics-table-alt"><summary>Data table</summary><div className="table-container"><table className="data-table"><caption>{series.title} data table</caption><thead><tr><th>Label</th><th>Value</th></tr></thead><tbody>{series.data.map((point, index) => <tr key={`${series.id}-${point.label}-table-${index}`}><td>{point.label}</td><td>{point.formattedValue || point.value}</td></tr>)}</tbody></table></div></details>
        </>
      )}
    </section>
  );
}
