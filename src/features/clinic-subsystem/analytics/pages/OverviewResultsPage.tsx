import { useEffect, useMemo, useState } from 'react';
import { Users, DollarSign, Wallet, AlertCircle, CalendarCheck, TrendingUp, Sparkles, CreditCard } from 'lucide-react';
import { ClinicPageHeader } from '../../components/ClinicPageHeader';
import { PatientVolumeChart } from '../../../clinic-owner/components/analytics/PatientVolumeChart';
import { PeakHoursArrivalChart } from '../../../clinic-owner/components/analytics/PeakHoursArrivalChart';
import { DayOfWeekStreakChart } from '../../../clinic-owner/components/analytics/DayOfWeekStreakChart';
import { TopServicesBarChart } from '../../../clinic-owner/components/analytics/TopServicesBarChart';
import { PatientDemographicsGrid } from '../../../clinic-owner/components/analytics/PatientDemographicsGrid';
import { PaymentMethodsDonutChart } from '../../../clinic-owner/components/sales/PaymentMethodsDonutChart';
import { ServiceCategoryRevenueChart } from '../../../clinic-owner/components/sales/ServiceCategoryRevenueChart';
import { mockClinicAnalyticsService } from '../../../clinic-owner/services/mockClinicAnalyticsService';
import { mockSalesOverviewService } from '../../../clinic-owner/services/mockSalesOverviewService';
import type { TimeRangeOption } from '../../../clinic-owner/types/clinicAnalytics';

interface Props {
  currentClinic: any;
}

export function OverviewResultsPage({ currentClinic }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('month');
  const [updateTick, setUpdateTick] = useState(0);

  const branchId = currentClinic?.id || 'all';
  const clinicName = currentClinic?.name || 'Angelo Dental Clinic';

  useEffect(() => {
    const handleUpdate = () => setUpdateTick((t) => t + 1);
    window.addEventListener('clinic-bill-payments:updated', handleUpdate);
    window.addEventListener('clinic-progress-notes:updated', handleUpdate);
    window.addEventListener('clinic-subsystem:patients-updated', handleUpdate);
    window.addEventListener('clinic-schedules:updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('clinic-bill-payments:updated', handleUpdate);
      window.removeEventListener('clinic-progress-notes:updated', handleUpdate);
      window.removeEventListener('clinic-subsystem:patients-updated', handleUpdate);
      window.removeEventListener('clinic-schedules:updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const analyticsDataset = useMemo(() => {
    return mockClinicAnalyticsService.getDataset(branchId, timeRange, clinicName);
  }, [branchId, timeRange, clinicName, updateTick]);

  const salesDataset = useMemo(() => {
    return mockSalesOverviewService.getDataset(branchId, clinicName);
  }, [branchId, clinicName, updateTick]);

  return (
    <div className="analytics-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      <ClinicPageHeader
        sectionLabel="ANALYTICS & REPORTS"
        title="Overview Results"
        subtitle={`High-level clinical performance, traffic volume, and financial production for ${clinicName}.`}
      />

      {/* 1. Top Core 4 High-Impact KPI Summary Cards */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          width: '100%'
        }}
      >
        {/* Card 1: Total Patient Traffic */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '1.25rem 1.35rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Patient Traffic
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <Users size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
              {analyticsDataset.kpis.totalVisits}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600, marginTop: '0.35rem' }}>
              {analyticsDataset.kpis.totalVisitsGrowth}
            </div>
          </div>
        </div>

        {/* Card 2: Gross Billed Revenue */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '1.25rem 1.35rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gross Billed Revenue
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#10b981', lineHeight: 1.1 }}>
              PHP {salesDataset.kpis.grossRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.35rem' }}>
              {salesDataset.kpis.grossRevenueGrowth}
            </div>
          </div>
        </div>

        {/* Card 3: Total Collected Intake */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '1.25rem 1.35rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Collected Intake
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0ea5e9', lineHeight: 1.1 }}>
              PHP {salesDataset.kpis.collectedAmount.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.35rem' }}>
              Collection Rate: <strong style={{ color: 'var(--text-primary)' }}>{salesDataset.kpis.collectionRate}%</strong>
            </div>
          </div>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '1.25rem 1.35rem',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Outstanding Receivables
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <AlertCircle size={18} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ef4444', lineHeight: 1.1 }}>
              PHP {salesDataset.kpis.outstandingReceivables.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.35rem' }}>
              {salesDataset.kpis.outstandingReceivablesCount} accounts with pending balance
            </div>
          </div>
        </div>
      </section>

      {/* 2. Patient Traffic & Volume Trends (with 3 Secondary Traffic Cards) */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* 3 Secondary Traffic Metric Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem'
          }}
        >
          <div className="dashboard-panel" style={{ margin: 0, padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <CalendarCheck size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Booking Type Split</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {analyticsDataset.kpis.appointmentRatio}% <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Appt / {analyticsDataset.kpis.walkInRatio}% Walk-in</span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel" style={{ margin: 0, padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Peak Traffic Day</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {analyticsDataset.kpis.busiestDay} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>({analyticsDataset.kpis.busiestDayAvg} visits)</span>
              </div>
            </div>
          </div>

          <div className="dashboard-panel" style={{ margin: 0, padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>Patient Retention Rate</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {analyticsDataset.kpis.retentionRate}% <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>({analyticsDataset.kpis.returningPatientsCount} Returning)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Historical Volume & Traffic Chart */}
        <PatientVolumeChart
          data={analyticsDataset.volumeTrend}
          timeRange={timeRange}
          onChangeTimeRange={setTimeRange}
        />
      </section>

      {/* 3. Behavioral Heatmaps: Peak Arrival Hours vs Day-of-Week Streaks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <PeakHoursArrivalChart data={analyticsDataset.peakHours} />
        <DayOfWeekStreakChart data={analyticsDataset.dayStreaks} />
      </div>

      {/* 4. Top Procedures Ranking & Service Category Revenue Breakdown */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Average Spend Metric Bar */}
        <div
          className="dashboard-panel"
          style={{
            margin: 0,
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--card-bg)',
            border: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CreditCard size={18} style={{ color: 'var(--primary)' }} />
            <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>Average Clinical Spend / Visit:</strong>
            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
              PHP {salesDataset.kpis.averageTicketSize.toLocaleString()}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {salesDataset.kpis.totalTransactionsCount} billed transaction(s) recorded in active period
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '1.5rem',
            alignItems: 'stretch'
          }}
        >
          <TopServicesBarChart services={analyticsDataset.topServices} />
          <ServiceCategoryRevenueChart categories={salesDataset.categoryRevenue} />
        </div>
      </section>

      {/* 5. Payment Settlement Mix & Patient Demographics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1.75fr)',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <PaymentMethodsDonutChart paymentMethods={salesDataset.paymentMethods} />
        <PatientDemographicsGrid demographics={analyticsDataset.demographics} />
      </div>
    </div>
  );
}
