import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Download, Printer } from 'lucide-react';
import { DailyOperationalKpiGrid } from '../../../clinic-owner/components/daily/DailyOperationalKpiGrid';
import { CashDrawerReconciliationCard } from '../../../clinic-owner/components/daily/CashDrawerReconciliationCard';
import { DentistStaffDailyLedger } from '../../../clinic-owner/components/daily/DentistStaffDailyLedger';
import { DailyLabDispatchCard } from '../../../clinic-owner/components/daily/DailyLabDispatchCard';
import { PeakHoursArrivalChart } from '../../../clinic-owner/components/analytics/PeakHoursArrivalChart';
import { TopServicesBarChart } from '../../../clinic-owner/components/analytics/TopServicesBarChart';
import { ServiceCategoryRevenueChart } from '../../../clinic-owner/components/sales/ServiceCategoryRevenueChart';
import { mockDailyReportsService } from '../../../clinic-owner/services/mockDailyReportsService';

interface Props {
  currentClinic: any;
}

export function DailyResultsPage({ currentClinic }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [updateTick, setUpdateTick] = useState(0);

  const branchId = currentClinic?.id || 'all';
  const clinicName = currentClinic?.name || 'Angelo Dental Clinic';

  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      setSelectedDate(d.toISOString().split('T')[0]);
    }
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

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

  const dataset = useMemo(() => {
    return mockDailyReportsService.getDataset(selectedDate, branchId, clinicName);
  }, [selectedDate, branchId, clinicName, updateTick]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportReport = () => {
    window.print();
  };

  return (
    <div className="analytics-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Top Header & Date Navigation Card */}
      <div
        className="dashboard-panel"
        style={{
          margin: 0,
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Top Row: Title + Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#d97706'
                }}
              >
                Analytics & Reports
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#d97706',
                  border: '1px solid rgba(245, 158, 11, 0.25)'
                }}
              >
                Daily Results & EOD Closing
              </span>
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Daily Results
            </h1>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Live end-of-day operational audit, procedure summary, and cash reconciliation for {clinicName}.
            </p>
          </div>

          {/* Print & Export Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handlePrintReport}
              style={{
                padding: '0.5rem 0.95rem',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 700,
                width: 'auto'
              }}
            >
              <Printer size={15} />
              Print Ledger
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleExportReport}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.82rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 700,
                width: 'auto'
              }}
            >
              <Download size={15} />
              Export Audit PDF
            </button>
          </div>
        </div>

        {/* Date Switcher Filter Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)'
          }}
        >
          {/* Date Navigation Buttons & Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleShiftDate(-1)}
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', width: 'auto', display: 'flex', alignItems: 'center' }}
              title="Previous Day"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleSetToday}
              style={{ padding: '0.35rem 0.7rem', fontSize: '0.78rem', width: 'auto', fontWeight: 700 }}
            >
              Today
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => handleShiftDate(1)}
              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', width: 'auto', display: 'flex', alignItems: 'center' }}
              title="Next Day"
            >
              <ChevronRight size={15} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginLeft: '0.35rem' }}>
              <Calendar size={16} style={{ color: 'var(--primary)' }} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginLeft: '0.4rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '999px',
                  backgroundColor: 'var(--card-bg)',
                  border: '1px solid var(--border)'
                }}
              >
                {dataset.formattedDateString}
              </span>
            </div>
          </div>

          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Showing live operational audit for {dataset.formattedDateString}
          </span>
        </div>
      </div>

      {/* 4 Daily Operational KPI Summary Cards */}
      <DailyOperationalKpiGrid kpis={dataset.kpis} />

      {/* Daily Visual Analytics: Peak Hours & Hourly Concentration for selected date */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <PeakHoursArrivalChart data={dataset.peakHours} />
      </div>

      {/* Daily Top Procedures Performed & Daily Service Category Revenue Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <TopServicesBarChart services={dataset.topServices} />
        <ServiceCategoryRevenueChart categories={dataset.categoryRevenue} />
      </div>

      {/* Full Cash Drawer & Petty Cash Reconciliation Card */}
      <CashDrawerReconciliationCard reconciliation={dataset.reconciliation} />

      {/* Clinical Production Ledger vs Lab Logistics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <DentistStaffDailyLedger
          dentistOutputs={dataset.dentistOutputs}
          staffAttendance={dataset.staffAttendance}
        />
        <DailyLabDispatchCard dispatches={dataset.labDispatches} />
      </div>
    </div>
  );
}
