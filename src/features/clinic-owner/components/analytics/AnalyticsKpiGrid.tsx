import { Calendar, Clock, RotateCcw, TrendingUp, Users } from 'lucide-react';
import type { AnalyticsKpiData } from '../../types/clinicAnalytics';

interface Props {
  kpis: AnalyticsKpiData;
}

export function AnalyticsKpiGrid({ kpis }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '1.25rem'
      }}
    >
      {/* KPI 1: Total Patient Foot Traffic */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Total Patient Traffic
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {kpis.totalVisits.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
          <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            <TrendingUp size={14} />
            {kpis.totalVisitsGrowth}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>• active period</span>
        </div>
      </div>

      {/* KPI 2: Appointment vs Walk-in Distribution */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Booking Type Split
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3b82f6' }}>
                {kpis.appointmentRatio}%
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Appt /</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#14b8a6' }}>
                {kpis.walkInRatio}%
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Walk-in</span>
            </div>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Calendar size={22} />
          </div>
        </div>

        {/* Dual Progress Bar */}
        <div style={{ width: '100%', height: '8px', borderRadius: '999px', backgroundColor: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${kpis.appointmentRatio}%`, backgroundColor: '#3b82f6', height: '100%' }} />
          <div style={{ width: `${kpis.walkInRatio}%`, backgroundColor: '#14b8a6', height: '100%' }} />
        </div>
      </div>

      {/* KPI 3: Busiest Day Streak */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Peak Traffic Day
            </span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
              {kpis.busiestDay}
            </span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Clock size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Avg. {kpis.busiestDayAvg} patients</span>
          <span>handled on Saturdays</span>
        </div>
      </div>

      {/* KPI 4: Patient Retention & Recurring Rate */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'grid', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Patient Retention
            </span>
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981' }}>
              {kpis.retentionRate}%
            </span>
          </div>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RotateCcw size={22} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          <span style={{ fontWeight: 700, color: '#059669' }}>{kpis.returningPatientsCount} Returning</span>
          <span>• {kpis.newPatientsCount} First-time visits</span>
        </div>
      </div>
    </div>
  );
}
