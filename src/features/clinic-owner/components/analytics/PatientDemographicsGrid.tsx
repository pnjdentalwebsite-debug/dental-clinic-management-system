import { User, Users2 } from 'lucide-react';
import type { DemographicsData } from '../../types/clinicAnalytics';

interface Props {
  demographics: DemographicsData;
}

export function PatientDemographicsGrid({ demographics }: Props) {
  const { gender, ageGroups, patientClass } = demographics;

  // Donut chart calculations
  const totalGender = gender.female.count + gender.male.count + gender.pediatric.count;
  const femalePct = gender.female.percentage;
  const malePct = gender.male.percentage;
  const pedPct = gender.pediatric.percentage;

  // SVG Donut circumference = 2 * PI * r = 2 * 3.14159 * 40 = 251.3
  const circumference = 251.3;
  const femaleOffset = 0;
  const femaleStroke = (femalePct / 100) * circumference;

  const maleOffset = -femaleStroke;
  const maleStroke = (malePct / 100) * circumference;

  const pedOffset = -(femaleStroke + maleStroke);
  const pedStroke = (pedPct / 100) * circumference;

  const maxAgeCount = Math.max(...ageGroups.map((a) => a.count), 10);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}
    >
      {/* Left Card: Gender & Demographic Ratio */}
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
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users2 size={18} style={{ color: '#8b5cf6' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Gender & Patient Demographics
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Patient gender split across registered profiles and completed visits.
          </span>
        </div>

        {/* Donut Chart Visual & Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* SVG Donut */}
          <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
            <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background ring */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--background)" strokeWidth="12" />
              {/* Female segment */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#ec4899"
                strokeWidth="12"
                strokeDasharray={`${femaleStroke} ${circumference}`}
                strokeDashoffset={femaleOffset}
              />
              {/* Male segment */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="12"
                strokeDasharray={`${maleStroke} ${circumference}`}
                strokeDashoffset={maleOffset}
              />
              {/* Pediatric segment */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${pedStroke} ${circumference}`}
                strokeDashoffset={pedOffset}
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {totalGender}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>Patients</span>
            </div>
          </div>

          {/* Gender Legend List */}
          <div style={{ display: 'grid', gap: '0.65rem', flex: 1, minWidth: '160px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(236, 72, 153, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ec4899' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Female</span>
              </div>
              <strong style={{ fontSize: '0.84rem', color: '#ec4899' }}>
                {gender.female.percentage}% ({gender.female.count})
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Male</span>
              </div>
              <strong style={{ fontSize: '0.84rem', color: '#3b82f6' }}>
                {gender.male.percentage}% ({gender.male.count})
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Pediatric (Kids)</span>
              </div>
              <strong style={{ fontSize: '0.84rem', color: '#059669' }}>
                {gender.pediatric.percentage}% ({gender.pediatric.count})
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card: Age Distribution & Payment Class */}
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
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <User size={18} style={{ color: '#0284c7' }} />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Age Distribution & Patient Classification
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Age grouping brackets and payer source distribution.
          </span>
        </div>

        {/* Age Groups Mini Column Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem', height: '110px', paddingTop: '10px' }}>
          {ageGroups.map((group, idx) => {
            const barHeight = (group.count / maxAgeCount) * 80;
            return (
              <div
                key={idx}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  height: '100%',
                  justifyContent: 'flex-end'
                }}
              >
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {group.percentage}%
                </span>
                <div
                  style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: `${barHeight}px`,
                    backgroundColor: group.color,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.2s ease'
                  }}
                />
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {group.bracket}
                </span>
              </div>
            );
          })}
        </div>

        {/* Patient Payment Class Split Footer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)'
          }}
        >
          <div
            style={{
              padding: '0.45rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Self-Pay</span>
            <strong style={{ fontSize: '0.86rem', color: 'var(--text-primary)' }}>{patientClass.selfPayPct}%</strong>
          </div>
          <div
            style={{
              padding: '0.45rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>HMO / Corporate</span>
            <strong style={{ fontSize: '0.86rem', color: '#0284c7' }}>{patientClass.hmoCorporatePct}%</strong>
          </div>
          <div
            style={{
              padding: '0.45rem 0.5rem',
              borderRadius: '6px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}
          >
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Referrals</span>
            <strong style={{ fontSize: '0.86rem', color: '#059669' }}>{patientClass.referralPct}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
