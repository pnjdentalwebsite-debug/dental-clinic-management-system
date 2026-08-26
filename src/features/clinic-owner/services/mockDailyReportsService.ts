import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockAssociateDentistService } from './mockAssociateDentistService';
import { mockStaffService } from './mockStaffService';
import { getClinicScheduleItems } from '../../clinic-subsystem/scheduling/scheduleStorage';
import { aggregateClinicFinancials } from '../../clinic-subsystem/patients/clinical/bills-payments/billPaymentStore';
import { loadPatientDirectoryRecords } from '../../clinic-subsystem/patients/shared/patientDirectoryStore';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type { BranchScopeOption } from '../types/clinicAnalytics';
import type {
  CashDrawerReconciliationData,
  DailyDentistOutputItem,
  DailyLabDispatchItem,
  DailyOperationalKpiData,
  DailyPettyCashExpense,
  DailyReportsDataset,
  DailyStaffAttendanceItem
} from '../types/dailyReports';
import type { ServiceCategoryRevenue } from '../types/salesOverview';

const EXCLUDED_DEMO_NAMES = [
  'northline dental',
  'harbor smile',
  'metro max',
  'paused care',
  'legacy dental',
  'kimberl clinic'
];

export class MockDailyReportsService {
  private resolveSubscriberId(loggedUserEmail?: string): string {
    if (!loggedUserEmail) return '';
    const users = mockPlatformManagementService.listUsers();
    const matchedUser = users.find((user: any) => user.email?.toLowerCase() === loggedUserEmail.toLowerCase());
    return matchedUser?.subscriberId || matchedUser?.id || '';
  }

  private getBranchIds(branchId: string, availableBranches: BranchScopeOption[]) {
    if (branchId === 'all') return availableBranches.map((branch) => branch.id);
    return availableBranches.some((branch) => branch.id === branchId) ? [branchId] : [];
  }

  private getScopedPatients(branchId: string, availableBranches: BranchScopeOption[]) {
    const seen = new Set<string>();
    return this.getBranchIds(branchId, availableBranches)
      .flatMap((id) => loadPatientDirectoryRecords(id))
      .filter((patient) => {
        if (seen.has(patient.id)) return false;
        seen.add(patient.id);
        return true;
      });
  }

  private getScopedSchedules(branchId: string, availableBranches: BranchScopeOption[]) {
    return this.getBranchIds(branchId, availableBranches).flatMap((id) => getClinicScheduleItems(undefined, id));
  }

  private getBranchAuthorizationTokens(branchId: string, availableBranches: BranchScopeOption[]) {
    const targetIds = new Set(this.getBranchIds(branchId, availableBranches));
    const targetBranches = branchId === 'all'
      ? availableBranches
      : availableBranches.filter((branch) => targetIds.has(branch.id));
    return new Set(
      targetBranches
        .flatMap((branch) => [branch.id, branch.name, branch.code])
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
    );
  }

  private isAuthorizedForBranch(authorizedClinics: string[] | undefined, branchId: string, availableBranches: BranchScopeOption[]) {
    if (branchId === 'all') return true;
    const tokens = this.getBranchAuthorizationTokens(branchId, availableBranches);
    if (!tokens.size) return false;
    if (!authorizedClinics?.length) return true;
    return authorizedClinics.some((clinic) => tokens.has(String(clinic).toLowerCase()));
  }

  public getAvailableBranches(_loggedClinicName?: string, loggedUserEmail?: string): BranchScopeOption[] {
    try {
      const subscriberId = this.resolveSubscriberId(loggedUserEmail);
      const clinics = subscriberId ? mockClinicService.getClinicsBySubscriberId(subscriberId) : [];
      if (clinics && clinics.length > 0) {
        const filtered = clinics.filter((c: any) => {
          const nameLower = (c.name || '').toLowerCase();
          const isDemoMock = EXCLUDED_DEMO_NAMES.some((demo) => nameLower.includes(demo)) || (c.id || '').startsWith('CLN-MOCK-');
          return !isDemoMock;
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

  public getPettyCashExpenses(_branchId: string): DailyPettyCashExpense[] {
    return [];
  }

  public getReconciliation(_branchId: string, targetDate: string | undefined, availableBranches: BranchScopeOption[]): CashDrawerReconciliationData {
    const expenses = this.getPettyCashExpenses(_branchId);
    const pettyCashExpensesTotal = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    const patients = this.getScopedPatients(_branchId, availableBranches);
    const agg = aggregateClinicFinancials(patients, targetDate);
    const cashInDrawer = agg.todayCollections.cash;
    const digitalGcashMaya = agg.todayCollections.digital;
    const digitalPosCards = agg.paymentMethodTotals.creditCard;
    const directBankHmo = agg.paymentMethodTotals.hmoInsurance;
    const grossCollections = agg.todayCollections.total;
    const netCashForDeposit = Math.max(0, cashInDrawer - pettyCashExpensesTotal);

    return {
      cashInDrawer,
      digitalGcashMaya,
      digitalPosCards,
      directBankHmo,
      grossCollections,
      pettyCashExpensesTotal,
      netCashForDeposit,
      expenses
    };
  }

  public getDentistOutputs(_branchId: string, availableBranches: BranchScopeOption[], subscriberId: string): DailyDentistOutputItem[] {
    try {
      const dentists = mockAssociateDentistService
        .getDentistsBySubscriberId(subscriberId)
        .filter((dentist: any) => this.isAuthorizedForBranch(dentist.authorizedClinics, _branchId, availableBranches));
      const patients = this.getScopedPatients(_branchId, availableBranches);
      const agg = aggregateClinicFinancials(patients);

      if (dentists && dentists.length > 0) {
        const colors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b'];
        return dentists.map((d: any, idx: number) => {
          const fullName = `${d.firstName || ''} ${d.lastName || ''}`.trim();
          // Find if there's production logged for this dentist or Dr. prefix
          const prodKey = Object.keys(agg.dentistProduction).find(
            (k) => k.toLowerCase().includes((d.lastName || '').toLowerCase()) || (fullName && k.toLowerCase().includes(fullName.toLowerCase()))
          );
          const prod = prodKey ? agg.dentistProduction[prodKey] : null;

          return {
            dentistId: d.id,
            dentistName: fullName || d.name || 'Associate Dentist',
            designation: d.specialization || d.designation || 'General Dentistry & Orthodontics',
            avatarColor: colors[idx % colors.length],
            patientsAttended: prod ? prod.patientsServed : 0,
            proceduresSummary: prod && prod.procedures.length > 0 ? prod.procedures.join(', ') : 'No procedures logged today',
            revenueGenerated: prod ? prod.revenue : 0,
            status: 'ACTIVE_DUTY'
          };
        });
      }
    } catch {
      // ignore
    }

    return [];
  }

  public getStaffAttendance(_branchId: string, availableBranches: BranchScopeOption[], subscriberId: string): DailyStaffAttendanceItem[] {
    try {
      const staff = mockStaffService
        .getStaffBySubscriberId(subscriberId)
        .filter((member: any) => this.isAuthorizedForBranch(member.authorizedClinics, _branchId, availableBranches));
      if (staff && staff.length > 0) {
        return staff.map((s: any) => ({
          staffId: s.id,
          staffName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.name || 'Staff Member',
          role: s.role || s.designation || 'Dental Assistant',
          timeIn: '08:00 AM',
          timeOut: '06:00 PM',
          status: 'PRESENT'
        }));
      }
    } catch {
      // ignore
    }

    return [];
  }

  public getLabDispatches(_branchId: string): DailyLabDispatchItem[] {
    return [];
  }

  public getDataset(
    selectedDate = '2026-08-23',
    branchId = 'all',
    loggedClinicName?: string,
    loggedUserEmail?: string
  ): DailyReportsDataset {
    const subscriberId = this.resolveSubscriberId(loggedUserEmail);
    const availableBranches = this.getAvailableBranches(loggedClinicName, loggedUserEmail);
    const currentScope =
      branchId === 'all'
        ? {
            id: 'all',
            name: availableBranches.length === 1 ? `${availableBranches[0].name} (Consolidated Audit)` : 'All Clinic Branches (Consolidated Audit)',
            code: 'ALL-BRANCHES',
            isMain: true
          }
        : availableBranches.find((b) => b.id === branchId) || availableBranches[0];

    const reconciliation = this.getReconciliation(branchId, selectedDate, availableBranches);
    const dentistOutputs = this.getDentistOutputs(branchId, availableBranches, subscriberId);
    const staffAttendance = this.getStaffAttendance(branchId, availableBranches, subscriberId);
    const labDispatches = this.getLabDispatches(branchId);

    const schedules = this.getScopedSchedules(branchId, availableBranches);
    const todaySchedules = schedules.filter((s) => s.type !== 'birthdays' && s.date === selectedDate);
    const patients = this.getScopedPatients(branchId, availableBranches);
    const agg = aggregateClinicFinancials(patients, selectedDate);
    const totalPatientsAttended = Math.max(todaySchedules.length, agg.allBills.filter((b) => b.entryDate === selectedDate || !b.entryDate).length);

    const kpis: DailyOperationalKpiData = {
      patientsAttendedToday: totalPatientsAttended,
      completedTreatments: Math.max(todaySchedules.filter((s) => s.status === 'Completed').length, agg.allPayments.length),
      inTreatmentCount: todaySchedules.filter((s) => s.status !== 'Completed' && s.status !== 'Cancelled').length,
      cancelledNoShowsCount: todaySchedules.filter((s) => s.status === 'Cancelled').length,
      grossDayCollections: reconciliation.grossCollections,
      netDayDeposit: reconciliation.netCashForDeposit,
      openLabCasesDueToday: labDispatches.length,
      activeDentistsOnDuty: dentistOutputs.length,
      activeStaffOnDuty: staffAttendance.filter((s) => s.status === 'PRESENT').length
    };

    const dateObj = new Date(selectedDate);
    const formattedDateString = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : selectedDate;

    // 1. Daily Hourly Volume Trend (8 AM to 5 PM for selectedDate)
    const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
    const volumeTrend = hours.map((hour) => {
      const matching = todaySchedules.filter((s) => (s.time || '').toUpperCase().includes(hour.replace(' ', ''))).length;
      return {
        label: hour,
        appointments: matching,
        walkins: 0,
        total: matching
      };
    });

    // If total schedules is 0 but we have patients attended, attribute to active hours
    if (todaySchedules.length === 0 && totalPatientsAttended > 0) {
      volumeTrend[1].appointments = Math.ceil(totalPatientsAttended / 2);
      volumeTrend[1].total = volumeTrend[1].appointments;
      volumeTrend[6].appointments = Math.floor(totalPatientsAttended / 2);
      volumeTrend[6].total = volumeTrend[6].appointments;
    }

    // 2. Daily Peak Hours
    const peakHourLabels = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
    const peakHours = peakHourLabels.map((hour, idx) => {
      const visits = volumeTrend[idx]?.total || 0;
      return {
        hour,
        appointments: visits,
        walkins: 0,
        total: visits,
        isPeak: visits > 0 && visits === Math.max(...volumeTrend.map((v) => v.total))
      };
    });

    // 3. Daily Top Services
    const colorPalette = ['#3b82f6', '#6366f1', '#14b8a6', '#10b981', '#f59e0b', '#ec4899'];
    const dailyTally = new Map<string, { count: number; category: string }>();
    agg.allServices.forEach((s) => {
      const proc = s.service?.trim() || 'Clinical Service';
      const existing = dailyTally.get(proc) || { count: 0, category: s.tooth ? 'Surgical / Treatment' : 'Preventive / Consultation' };
      existing.count += Number(s.quantity) || 1;
      dailyTally.set(proc, existing);
    });

    const topServices = Array.from(dailyTally.entries()).map(([name, val], idx) => ({
      id: `d-svc-${idx + 1}`,
      name,
      category: val.category,
      count: val.count,
      percentage: 0,
      color: colorPalette[idx % colorPalette.length]
    }));
    topServices.sort((a, b) => b.count - a.count);
    const topCountTotal = topServices.reduce((acc, curr) => acc + curr.count, 0) || 1;
    topServices.forEach((s) => {
      s.percentage = Math.round((s.count / topCountTotal) * 100);
    });

    // 4. Daily Category Revenue
    const categoryTotals = new Map<string, { amount: number; count: number }>();
    agg.allServices.forEach((s) => {
      const name = s.service || 'Clinical Procedure';
      const existing = categoryTotals.get(name) || { amount: 0, count: 0 };
      categoryTotals.set(name, {
        amount: existing.amount + Number(s.lineTotal || s.baseAmount || 0),
        count: existing.count + 1
      });
    });

    const categoryRevenue: ServiceCategoryRevenue[] = [];
    let catIdx = 0;
    categoryTotals.forEach((val, name) => {
      categoryRevenue.push({
        id: `d-cat-${catIdx + 1}`,
        category: name,
        amount: val.amount,
        percentage: agg.grossBilled > 0 ? Math.round((val.amount / agg.grossBilled) * 100) : 0,
        casesCount: val.count,
        color: colorPalette[catIdx % colorPalette.length]
      });
      catIdx++;
    });

    return {
      selectedDate,
      formattedDateString,
      scope: currentScope,
      availableBranches,
      kpis,
      reconciliation,
      dentistOutputs,
      staffAttendance,
      labDispatches,
      volumeTrend,
      peakHours,
      topServices,
      categoryRevenue
    };
  }
}

export const mockDailyReportsService = new MockDailyReportsService();
