import { Lightbulb } from 'lucide-react';

export function InsightCard() {
  const insights = [
    { title: 'Revenue increase this month', desc: 'Overall revenue is up by 12% compared to last month.' },
    { title: 'Highest activity in Main Branch', desc: 'The Quezon City Main Branch accounts for 61% of total appointments.' },
    { title: 'Patient registrations are improving', desc: 'New registrations reached a record high of 320 this month.' }
  ];

  return (
    <div className="dashboard-panel" style={{ margin: 0, padding: 'var(--card-pad)', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.25rem' }}>Recent Performance Insights</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {insights.map((ins, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
            <Lightbulb size={18} style={{ color: 'var(--warning)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{ins.title}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{ins.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
