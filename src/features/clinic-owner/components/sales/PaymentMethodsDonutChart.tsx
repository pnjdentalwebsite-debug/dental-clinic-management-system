import { Wallet } from 'lucide-react';
import type { PaymentMethodBreakdown } from '../../types/salesOverview';

interface Props {
  paymentMethods: PaymentMethodBreakdown;
}

export function PaymentMethodsDonutChart({ paymentMethods }: Props) {
  const { gcashMaya, cash, creditCard, hmoInsurance, totalCollected } = paymentMethods;

  // Donut SVG circumference = 2 * PI * 40 = 251.3
  const circumference = 251.3;
  const gcashStroke = (gcashMaya.percentage / 100) * circumference;
  const cashStroke = (cash.percentage / 100) * circumference;
  const cardStroke = (creditCard.percentage / 100) * circumference;
  const hmoStroke = (hmoInsurance.percentage / 100) * circumference;

  const gcashOffset = 0;
  const cashOffset = -gcashStroke;
  const cardOffset = -(gcashStroke + cashStroke);
  const hmoOffset = -(gcashStroke + cashStroke + cardStroke);

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
        justifyContent: 'space-between',
        gap: '1.25rem',
        boxShadow: 'var(--shadow-sm)',
        height: '100%'
      }}
    >
      <div style={{ display: 'grid', gap: '0.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Wallet size={18} style={{ color: '#007dfa' }} />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Payment Channels & Settlement Mix
          </h3>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Breakdown of collection intake across digital wallets, cash, cards, and HMOs.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* SVG Donut */}
        <div style={{ position: 'relative', width: '140px', height: '140px', flexShrink: 0 }}>
          <svg width="140" height="140" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--background)" strokeWidth="12" />
            {/* GCash / Maya */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#007dfa"
              strokeWidth="12"
              strokeDasharray={`${gcashStroke} ${circumference}`}
              strokeDashoffset={gcashOffset}
            />
            {/* Cash */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#10b981"
              strokeWidth="12"
              strokeDasharray={`${cashStroke} ${circumference}`}
              strokeDashoffset={cashOffset}
            />
            {/* Credit Card */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#8b5cf6"
              strokeWidth="12"
              strokeDasharray={`${cardStroke} ${circumference}`}
              strokeDashoffset={cardOffset}
            />
            {/* HMO */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeDasharray={`${hmoStroke} ${circumference}`}
              strokeDashoffset={hmoOffset}
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
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL COLLECTED</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              ₱{Math.round(totalCollected / 1000)}k
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div style={{ display: 'grid', gap: '0.55rem', flex: 1, minWidth: '170px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 125, 250, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#007dfa' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>GCash / Maya</span>
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#007dfa' }}>
              {gcashMaya.percentage}% (₱{Math.round(gcashMaya.amount / 1000)}k)
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Cash on Hand</span>
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#059669' }}>
              {cash.percentage}% (₱{Math.round(cash.amount / 1000)}k)
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(139, 92, 246, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Credit / Debit Card</span>
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#7c3aed' }}>
              {creditCard.percentage}% (₱{Math.round(creditCard.amount / 1000)}k)
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.35rem 0.6rem',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>HMO Direct Settlement</span>
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#d97706' }}>
              {hmoInsurance.percentage}% (₱{Math.round(hmoInsurance.amount / 1000)}k)
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
