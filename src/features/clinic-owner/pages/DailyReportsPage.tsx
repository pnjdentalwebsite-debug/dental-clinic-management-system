import { useEffect, useMemo, useState } from 'react';
import { DailyReportsBranchHeader } from '../components/daily/DailyReportsBranchHeader';
import { DailyOperationalKpiGrid } from '../components/daily/DailyOperationalKpiGrid';
import { CashDrawerReconciliationCard } from '../components/daily/CashDrawerReconciliationCard';
import { DentistStaffDailyLedger } from '../components/daily/DentistStaffDailyLedger';
import { DailyLabDispatchCard } from '../components/daily/DailyLabDispatchCard';
import { mockDailyReportsService } from '../services/mockDailyReportsService';

interface Props {
  loggedClinicName?: string;
  loggedUserEmail?: string;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function DailyReportsPage({ loggedClinicName, loggedUserEmail, showToast }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
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
    return mockDailyReportsService.getDataset(selectedDate, selectedBranchId, loggedClinicName, loggedUserEmail);
  }, [selectedDate, selectedBranchId, loggedClinicName, loggedUserEmail, updateTick]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportReport = () => {
    showToast?.(`Generating End-of-Day Audit Report for ${dataset.formattedDateString} (${dataset.scope.name})...`, 'info');
    setTimeout(() => {
      showToast?.(`Daily Closing PDF for ${dataset.selectedDate} successfully downloaded.`, 'success');
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Date Switcher & Branch Header */}
      <DailyReportsBranchHeader
        selectedDate={selectedDate}
        formattedDateString={dataset.formattedDateString}
        onDateChange={setSelectedDate}
        availableBranches={dataset.availableBranches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        onPrintReport={handlePrintReport}
        onExportReport={handleExportReport}
      />

      {/* 4 Daily Operational KPI Summary Cards */}
      <DailyOperationalKpiGrid kpis={dataset.kpis} />

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
