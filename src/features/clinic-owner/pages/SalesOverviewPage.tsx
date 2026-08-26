import { useEffect, useMemo, useState } from 'react';
import { SalesBranchScopeHeader } from '../components/sales/SalesBranchScopeHeader';
import { SalesKpiGrid } from '../components/sales/SalesKpiGrid';
import { RevenueMonthlyTrendChart } from '../components/sales/RevenueMonthlyTrendChart';
import { PaymentMethodsDonutChart } from '../components/sales/PaymentMethodsDonutChart';
import { ServiceCategoryRevenueChart } from '../components/sales/ServiceCategoryRevenueChart';
import { MultiBranchRevenueLeaderboard } from '../components/sales/MultiBranchRevenueLeaderboard';
import { AgingReceivablesFeed } from '../components/sales/AgingReceivablesFeed';
import { mockSalesOverviewService } from '../services/mockSalesOverviewService';
import type { AgingReceivableItem } from '../types/salesOverview';

interface Props {
  loggedClinicName?: string;
  loggedUserEmail?: string;
  showToast?: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export function SalesOverviewPage({ loggedClinicName, loggedUserEmail, showToast }: Props) {
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
    return mockSalesOverviewService.getDataset(selectedBranchId, undefined, loggedUserEmail);
  }, [selectedBranchId, loggedClinicName, loggedUserEmail, updateTick]);

  const handleRemindPatient = (patient: AgingReceivableItem) => {
    showToast?.(`Payment reminder SMS dispatched to ${patient.patientName} (${patient.mobileNumber}) for balance PHP ${patient.balanceDue.toLocaleString()}.`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      {/* Financial Scope Header */}
      <SalesBranchScopeHeader
        availableBranches={dataset.availableBranches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        kpis={dataset.kpis}
      />

      {/* 4 Financial KPI Summary Cards */}
      <SalesKpiGrid kpis={dataset.kpis} />

      {/* Revenue Trend vs Payment Channel Mix */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.75fr) minmax(0, 1.25fr)',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <RevenueMonthlyTrendChart data={dataset.monthlyTrend} />
        <PaymentMethodsDonutChart paymentMethods={dataset.paymentMethods} />
      </div>

      {/* Service Category Revenue vs Multi-Branch Leaderboard */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch'
        }}
      >
        <ServiceCategoryRevenueChart categories={dataset.categoryRevenue} />
        <MultiBranchRevenueLeaderboard branchPerformance={dataset.branchPerformance} />
      </div>

      {/* Aging Receivables & High-Value Collections Feed */}
      <AgingReceivablesFeed
        receivables={dataset.agingReceivables}
        onRemindPatient={handleRemindPatient}
      />
    </div>
  );
}
