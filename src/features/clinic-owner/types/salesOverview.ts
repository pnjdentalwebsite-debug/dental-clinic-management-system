import type { BranchScopeOption } from './clinicAnalytics';

export interface SalesKpiData {
  grossRevenue: number;
  grossRevenueGrowth: string;
  collectedAmount: number;
  collectionRate: number; // e.g. 80.5%
  outstandingReceivables: number;
  outstandingReceivablesCount: number;
  averageTicketSize: number;
  totalTransactionsCount: number;
  labExpensesTotal: number;
}

export interface MonthlyRevenueTrend {
  month: string; // e.g. "Jan", "Feb"
  fullMonth: string;
  billed: number;
  collected: number;
  labExpenses: number;
}

export interface PaymentMethodBreakdown {
  gcashMaya: { amount: number; percentage: number; color: string };
  cash: { amount: number; percentage: number; color: string };
  creditCard: { amount: number; percentage: number; color: string };
  hmoInsurance: { amount: number; percentage: number; color: string };
  totalCollected: number;
}

export interface ServiceCategoryRevenue {
  id: string;
  category: string;
  amount: number;
  percentage: number;
  casesCount: number;
  color: string;
}

export interface BranchFinancialPerformance {
  branchId: string;
  branchName: string;
  branchCode: string;
  grossRevenue: number;
  collectedAmount: number;
  outstandingBalance: number;
  labExpenses: number;
  netRevenue: number;
  collectionRate: number;
  sharePercentage: number;
}

export interface AgingReceivableItem {
  id: string;
  patientName: string;
  patientNumber: string;
  mobileNumber: string;
  branchName: string;
  serviceAvailed: string;
  totalBill: number;
  amountPaid: number;
  balanceDue: number;
  dueDate: string;
  overdueDays: number;
  status: 'CURRENT' | 'OVERDUE' | 'INSTALLMENT';
}

export interface SalesOverviewDataset {
  scope: BranchScopeOption;
  availableBranches: BranchScopeOption[];
  kpis: SalesKpiData;
  monthlyTrend: MonthlyRevenueTrend[];
  paymentMethods: PaymentMethodBreakdown;
  categoryRevenue: ServiceCategoryRevenue[];
  branchPerformance: BranchFinancialPerformance[];
  agingReceivables: AgingReceivableItem[];
}
