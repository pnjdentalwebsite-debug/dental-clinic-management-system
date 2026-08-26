import { mockClinicService } from '../../clinics/services/mockClinicService';
import { aggregateClinicFinancials } from '../../clinic-subsystem/patients/clinical/bills-payments/billPaymentStore';
import { loadPatientDirectoryRecords } from '../../clinic-subsystem/patients/shared/patientDirectoryStore';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type { BranchScopeOption } from '../types/clinicAnalytics';
import type {
  AgingReceivableItem,
  BranchFinancialPerformance,
  MonthlyRevenueTrend,
  PaymentMethodBreakdown,
  SalesKpiData,
  SalesOverviewDataset,
  ServiceCategoryRevenue
} from '../types/salesOverview';

const EXCLUDED_DEMO_NAMES = [
  'northline dental',
  'harbor smile',
  'metro max',
  'paused care',
  'legacy dental',
  'kimberl clinic'
];

export class MockSalesOverviewService {
  private resolveSubscriberId(loggedUserEmail?: string): string {
    if (!loggedUserEmail) return '';
    const users = mockPlatformManagementService.listUsers();
    const matchedUser = users.find((user: any) => user.email?.toLowerCase() === loggedUserEmail.toLowerCase());
    return matchedUser?.subscriberId || matchedUser?.id || '';
  }

  private getScopedPatients(branchId: string, availableBranches: BranchScopeOption[]) {
    const targetBranches = branchId === 'all'
      ? availableBranches
      : availableBranches.filter((branch) => branch.id === branchId);
    const seen = new Set<string>();

    return targetBranches
      .flatMap((branch) => loadPatientDirectoryRecords(branch.id))
      .filter((patient) => {
        if (seen.has(patient.id)) return false;
        seen.add(patient.id);
        return true;
      });
  }

  public getAvailableBranches(loggedClinicName?: string, loggedUserEmail?: string): BranchScopeOption[] {
    try {
      let subscriberId = this.resolveSubscriberId(loggedUserEmail);
      if (!subscriberId && loggedClinicName) {
        subscriberId = mockClinicService.listClinics().find((clinic: any) =>
          String(clinic.name || '').trim().toLowerCase() === String(loggedClinicName).trim().toLowerCase()
        )?.subscriberId || '';
      }
      const clinics = subscriberId ? mockClinicService.getClinicsBySubscriberId(subscriberId) : [];
      if (clinics && clinics.length > 0) {
        const filtered = clinics.filter((c: any) => {
          const nameLower = (c.name || '').toLowerCase();
          const isDemoMock = EXCLUDED_DEMO_NAMES.some((demo) => nameLower.includes(demo)) || (c.id || '').startsWith('CLN-MOCK-');
          if (isDemoMock) return false;

          return true;
        });

        if (filtered.length > 0) {
          return filtered.map((c: any, index: number) => ({
            id: c.id,
            name: c.name,
            code: c.clinicNumber || c.code || `CLN-${String(index + 1).padStart(6, '0')}`,
            location: c.city ? `${c.city}, ${c.province || 'Cavite'}` : c.addressLine1 || c.address || 'Main Branch',
            isMain: index === 0 || Boolean(c.isPrimaryClinic)
          }));
        }
      }
    } catch {
      // ignore
    }
    return [];
  }

  public getMonthlyTrend(_branchId: string, currentGross: number, currentCollected: number): MonthlyRevenueTrend[] {
    if (currentGross === 0 && currentCollected === 0) {
      return [
        { month: 'May', fullMonth: 'May 2026', billed: 0, collected: 0, labExpenses: 0 },
        { month: 'Jun', fullMonth: 'June 2026', billed: 0, collected: 0, labExpenses: 0 },
        { month: 'Jul', fullMonth: 'July 2026', billed: 0, collected: 0, labExpenses: 0 },
        { month: 'Aug', fullMonth: 'August 2026 (MTD)', billed: 0, collected: 0, labExpenses: 0 }
      ];
    }

    return [
      { month: 'May', fullMonth: 'May 2026', billed: 0, collected: 0, labExpenses: 0 },
      { month: 'Jun', fullMonth: 'June 2026', billed: 0, collected: 0, labExpenses: 0 },
      { month: 'Jul', fullMonth: 'July 2026', billed: 0, collected: 0, labExpenses: 0 },
      { month: 'Aug', fullMonth: 'August 2026 (MTD)', billed: currentGross, collected: currentCollected, labExpenses: 0 }
    ];
  }

  public getPaymentMethods(_branchId: string, totals: { cash: number; gcashMaya: number; creditCard: number; hmoInsurance: number }, totalCollected: number): PaymentMethodBreakdown {
    if (totalCollected === 0) {
      return {
        gcashMaya: { amount: 0, percentage: 0, color: '#007dfa' },
        cash: { amount: 0, percentage: 0, color: '#10b981' },
        creditCard: { amount: 0, percentage: 0, color: '#8b5cf6' },
        hmoInsurance: { amount: 0, percentage: 0, color: '#f59e0b' },
        totalCollected: 0
      };
    }

    const gcashPct = Math.round((totals.gcashMaya / totalCollected) * 100);
    const cashPct = Math.round((totals.cash / totalCollected) * 100);
    const cardPct = Math.round((totals.creditCard / totalCollected) * 100);
    const hmoPct = Math.max(0, 100 - (gcashPct + cashPct + cardPct));

    return {
      gcashMaya: { amount: totals.gcashMaya, percentage: gcashPct, color: '#007dfa' },
      cash: { amount: totals.cash, percentage: cashPct, color: '#10b981' },
      creditCard: { amount: totals.creditCard, percentage: cardPct, color: '#8b5cf6' },
      hmoInsurance: { amount: totals.hmoInsurance, percentage: hmoPct, color: '#f59e0b' },
      totalCollected
    };
  }

  public getCategoryRevenue(_branchId: string, allServices: Array<{ service: string; lineTotal: number }>, grossRevenue: number): ServiceCategoryRevenue[] {
    if (grossRevenue === 0 || allServices.length === 0) {
      return [];
    }

    const palette = ['#6366f1', '#06b6d4', '#14b8a6', '#10b981', '#f59e0b', '#ec4899'];
    const serviceTotals = new Map<string, { amount: number; count: number }>();

    allServices.forEach((s) => {
      const name = s.service || 'General Dental Service';
      const existing = serviceTotals.get(name) || { amount: 0, count: 0 };
      serviceTotals.set(name, {
        amount: existing.amount + Number(s.lineTotal || 0),
        count: existing.count + 1
      });
    });

    const result: ServiceCategoryRevenue[] = [];
    let idx = 0;
    serviceTotals.forEach((val, name) => {
      const pct = grossRevenue > 0 ? Math.round((val.amount / grossRevenue) * 100) : 0;
      result.push({
        id: `cat-${idx + 1}`,
        category: name,
        amount: val.amount,
        percentage: pct,
        casesCount: val.count,
        color: palette[idx % palette.length]
      });
      idx++;
    });

    return result;
  }

  public getBranchFinancialPerformance(
    availableBranches: BranchScopeOption[],
    grossRevenue: number,
    _collectedAmount: number,
    _outstandingBalance: number
  ): BranchFinancialPerformance[] {
    return availableBranches.map((b) => {
      const branchPatients = this.getScopedPatients(b.id, availableBranches);
      const branchAgg = aggregateClinicFinancials(branchPatients);
      const branchGrossRevenue = branchAgg.grossBilled;
      const branchCollectedAmount = branchAgg.totalCollected;
      const branchOutstandingBalance = branchAgg.totalOutstanding;
      const labExpenses = 0;
      const netRevenue = branchCollectedAmount - labExpenses;
      const collectionRate = branchGrossRevenue > 0 ? Math.round((branchCollectedAmount / branchGrossRevenue) * 100) : 0;

      return {
        branchId: b.id,
        branchName: b.name,
        branchCode: b.code,
        grossRevenue: branchGrossRevenue,
        collectedAmount: branchCollectedAmount,
        outstandingBalance: branchOutstandingBalance,
        labExpenses,
        netRevenue,
        collectionRate,
        sharePercentage: grossRevenue > 0 ? Math.round((branchGrossRevenue / grossRevenue) * 100) : 0
      };
    });
  }

  public getAgingReceivables(_branchId: string, allBills: Array<any>): AgingReceivableItem[] {
    const unpaidBills = allBills.filter((b) => Number(b.balanceAmount || 0) > 0);

    return unpaidBills.map((b, idx) => {
      const balanceDue = Number(b.balanceAmount || 0);
      const amountPaid = Number(b.paidAmount || 0);
      const totalBill = Number(b.payableAmount || balanceDue + amountPaid);

      return {
        id: `rec-${b.id || idx}`,
        patientName: b.patientName || 'Patient',
        patientNumber: b.patientId || `PAT-${String(idx + 1).padStart(4, '0')}`,
        mobileNumber: 'Main Practice Roster',
        branchName: 'Angelo Dental Clinic - Main',
        serviceAvailed: b.description || (b.services?.[0]?.service) || 'Dental Treatment Plan',
        totalBill,
        amountPaid,
        balanceDue,
        dueDate: b.entryDate || '2026-08-25',
        overdueDays: 0,
        status: amountPaid > 0 ? 'INSTALLMENT' : 'CURRENT'
      };
    });
  }

  public getDataset(branchId = 'all', loggedClinicName?: string, loggedUserEmail?: string): SalesOverviewDataset {
    const availableBranches = this.getAvailableBranches(loggedClinicName, loggedUserEmail);
    const currentScope =
      branchId === 'all'
        ? {
            id: 'all',
            name: availableBranches.length === 1 ? `${availableBranches[0].name} (Consolidated)` : 'All Clinic Branches (Consolidated Financials)',
            code: 'ALL-BRANCHES',
            isMain: true
          }
        : availableBranches.find((b) => b.id === branchId) || availableBranches[0];

    const patients = this.getScopedPatients(branchId, availableBranches);
    const agg = aggregateClinicFinancials(patients);
    const agingReceivables = this.getAgingReceivables(branchId, agg.allBills);
    const grossRevenue = agg.grossBilled;
    const collectedAmount = agg.totalCollected;
    const outstandingReceivables = agg.totalOutstanding;
    const labExpensesTotal = 0;
    const collectionRate = grossRevenue > 0 ? Math.round((collectedAmount / grossRevenue) * 100) : 0;

    const monthlyTrend = this.getMonthlyTrend(branchId, grossRevenue, collectedAmount);
    const paymentMethods = this.getPaymentMethods(branchId, agg.paymentMethodTotals, collectedAmount);
    const categoryRevenue = this.getCategoryRevenue(branchId, agg.allServices, grossRevenue);
    const branchPerformance = this.getBranchFinancialPerformance(availableBranches, grossRevenue, collectedAmount, outstandingReceivables);

    const kpis: SalesKpiData = {
      grossRevenue,
      grossRevenueGrowth: `PHP ${grossRevenue.toLocaleString()} total billed`,
      collectedAmount,
      collectionRate,
      outstandingReceivables,
      outstandingReceivablesCount: agingReceivables.length,
      averageTicketSize: agg.billsCount > 0 ? Math.round(grossRevenue / agg.billsCount) : 0,
      totalTransactionsCount: agg.paymentsCount,
      labExpensesTotal
    };

    return {
      scope: currentScope,
      availableBranches,
      kpis,
      monthlyTrend,
      paymentMethods,
      categoryRevenue,
      branchPerformance,
      agingReceivables
    };
  }
}

export const mockSalesOverviewService = new MockSalesOverviewService();
