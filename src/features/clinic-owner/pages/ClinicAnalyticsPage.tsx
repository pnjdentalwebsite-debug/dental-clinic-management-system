import { useState, useMemo, useEffect } from 'react';
import { AnalyticsBranchScopeHeader } from '../components/analytics/AnalyticsBranchScopeHeader';
import { AnalyticsKpiGrid } from '../components/analytics/AnalyticsKpiGrid';
import { PatientVolumeChart } from '../components/analytics/PatientVolumeChart';
import { PeakHoursArrivalChart } from '../components/analytics/PeakHoursArrivalChart';
import { DayOfWeekStreakChart } from '../components/analytics/DayOfWeekStreakChart';
import { TopServicesBarChart } from '../components/analytics/TopServicesBarChart';
import { PatientDemographicsGrid } from '../components/analytics/PatientDemographicsGrid';
import { mockClinicAnalyticsService } from '../services/mockClinicAnalyticsService';
import type { TimeRangeOption } from '../types/clinicAnalytics';

interface Props {
  loggedClinicName?: string;
  loggedUserEmail?: string;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function ClinicAnalyticsPage({ loggedClinicName, loggedUserEmail, showToast: _showToast }: Props) {
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('month');
  const [updateTick, setUpdateTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setUpdateTick((t) => t + 1);
    window.addEventListener('clinic-bill-payments:updated', handleUpdate);
    window.addEventListener('clinic-progress-notes:updated', handleUpdate);
    window.addEventListener('clinic-subsystem:patients-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('clinic-bill-payments:updated', handleUpdate);
      window.removeEventListener('clinic-progress-notes:updated', handleUpdate);
      window.removeEventListener('clinic-subsystem:patients-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const dataset = useMemo(() => {
    return mockClinicAnalyticsService.getDataset(selectedBranchId, timeRange, loggedClinicName, loggedUserEmail);
  }, [selectedBranchId, timeRange, loggedClinicName, loggedUserEmail, updateTick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Scope Header with Dynamic Resource Footprint */}
      <AnalyticsBranchScopeHeader
        availableBranches={dataset.availableBranches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        resourceSnapshot={dataset.resourceSnapshot}
      />

      {/* 4 High-Impact KPI Summary Cards */}
      <AnalyticsKpiGrid kpis={dataset.kpis} />

      {/* Primary Historical Volume & Traffic Chart */}
      <PatientVolumeChart
        data={dataset.volumeTrend}
        timeRange={timeRange}
        onChangeTimeRange={setTimeRange}
      />

      {/* Behavioral Patterns: Peak Hours vs Day-of-Week Streaks */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <PeakHoursArrivalChart data={dataset.peakHours} />
        <DayOfWeekStreakChart data={dataset.dayStreaks} />
      </div>

      {/* Clinical Demand & Demographics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 1.75fr)',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <TopServicesBarChart services={dataset.topServices} />
        <PatientDemographicsGrid demographics={dataset.demographics} />
      </div>
    </div>
  );
}
