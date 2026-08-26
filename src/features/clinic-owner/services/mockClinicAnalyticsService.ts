import { mockClinicService } from '../../clinics/services/mockClinicService';
import { mockAssociateDentistService } from './mockAssociateDentistService';
import { mockStaffService } from './mockStaffService';
import { mockLaboratoryService } from '../../laboratories/services/mockLaboratoryService';
import { masterFileDirectoryService } from '../../clinic-subsystem/master-files/masterFileDirectoryService';
import { loadPatientDirectoryRecords } from '../../clinic-subsystem/patients/shared/patientDirectoryStore';
import { getClinicScheduleItems } from '../../clinic-subsystem/scheduling/scheduleStorage';
import { aggregateClinicFinancials } from '../../clinic-subsystem/patients/clinical/bills-payments/billPaymentStore';
import { mockPlatformManagementService } from '../../platformManagement/services/mockPlatformManagementService';
import type {
  AgeGroupDataPoint,
  AnalyticsKpiData,
  BranchResourceSnapshot,
  BranchScopeOption,
  ClinicAnalyticsDataset,
  DayStreakDataPoint,
  DemographicsData,
  PeakHourDataPoint,
  TimeRangeOption,
  TopServiceDataPoint,
  VolumeDataPoint
} from '../types/clinicAnalytics';

const EXCLUDED_DEMO_NAMES = [
  'northline dental',
  'harbor smile',
  'metro max',
  'paused care',
  'legacy dental',
  'kimberl clinic'
];

export class MockClinicAnalyticsService {
  private resolveSubscriberId(loggedUserEmail?: string): string {
    if (!loggedUserEmail) return '';
    const users = mockPlatformManagementService.listUsers();
    const matchedUser = users.find((user: any) => user.email?.toLowerCase() === loggedUserEmail.toLowerCase());
    return matchedUser?.subscriberId || matchedUser?.id || '';
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

  public getResourceSnapshot(branchId: string, availableBranches: BranchScopeOption[], subscriberId?: string): BranchResourceSnapshot {
    const isAll = branchId === 'all';
    const currentBranch = isAll ? availableBranches[0] : availableBranches.find((b) => b.id === branchId);

    let dentistCount = 0;
    try {
      const dentists = subscriberId ? mockAssociateDentistService.getDentistsBySubscriberId(subscriberId) : [];
      dentistCount = dentists.filter((d: any) => d.status === 'active' || !d.status).length;
    } catch {
      dentistCount = 0;
    }

    let staffCount = 0;
    try {
      const staff = subscriberId ? mockStaffService.getStaffBySubscriberId(subscriberId) : [];
      staffCount = staff.filter((s: any) => s.status === 'active' || !s.status).length;
    } catch {
      staffCount = 0;
    }

    let labCount = 0;
    try {
      const labs = subscriberId ? mockLaboratoryService.getLaboratoriesBySubscriberId(subscriberId) : [];
      const scopedLabs = isAll
        ? labs
        : currentBranch ? labs.filter((l: any) => Array.isArray(l.clinicIds) && l.clinicIds.includes(currentBranch.id)) : [];
      labCount = scopedLabs.filter((l: any) => {
        const status = String(l.status || '').toLowerCase();
        return status === 'active' || status === 'connected' || !l.status;
      }).length;
    } catch {
      labCount = 0;
    }

    return {
      branchId: isAll ? 'all' : currentBranch?.id || '',
      branchName: isAll ? 'All Branches (Consolidated)' : currentBranch?.name || 'Main Branch',
      branchCode: isAll ? 'ALL-BRANCHES' : currentBranch?.code || 'MAIN',
      dentistCount,
      staffCount,
      labCount,
      activeChairs: isAll ? Math.max(1, availableBranches.length * 2) : 2
    };
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

  private getScopedSchedules(branchId: string, availableBranches: BranchScopeOption[]) {
    const targetBranches = branchId === 'all'
      ? availableBranches
      : availableBranches.filter((branch) => branch.id === branchId);
    return targetBranches.flatMap((branch) => getClinicScheduleItems(undefined, branch.id));
  }

  public getVolumeTrend(branchId: string, timeRange: TimeRangeOption, availableBranches: BranchScopeOption[]): VolumeDataPoint[] {
    const schedules = this.getScopedSchedules(branchId, availableBranches).filter((s) => s.type !== 'birthdays');
    const totalSched = schedules.length;

    if (timeRange === 'day') {
      const hours = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM'];
      return hours.map((hour) => {
        const matching = schedules.filter((s) => (s.time || '').toUpperCase().includes(hour.replace(' ', '')));
        return {
          label: hour,
          appointments: matching.length,
          walkins: 0,
          total: matching.length
        };
      });
    }

    if (timeRange === 'week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day) => {
        const matching = schedules.filter((s) => (s.date || '').includes(day));
        return {
          label: day,
          appointments: matching.length,
          walkins: 0,
          total: matching.length
        };
      });
    }

    if (timeRange === 'year') {
      const months = ['May', 'Jun', 'Jul', 'Aug'];
      return months.map((month, idx) => ({
        label: month,
        appointments: idx === 3 ? totalSched : 0,
        walkins: 0,
        total: idx === 3 ? totalSched : 0
      }));
    }

    // Default: 'month' (Weeks 1 to 4)
    return [
      { label: 'Week 1', appointments: 0, walkins: 0, total: 0 },
      { label: 'Week 2', appointments: 0, walkins: 0, total: 0 },
      { label: 'Week 3', appointments: 0, walkins: 0, total: 0 },
      { label: 'Week 4', appointments: totalSched, walkins: 0, total: totalSched }
    ];
  }

  public getPeakHours(branchId: string, availableBranches: BranchScopeOption[]): PeakHourDataPoint[] {
    const schedules = this.getScopedSchedules(branchId, availableBranches).filter((s) => s.type !== 'birthdays');
    const hours = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];

    return hours.map((hour) => {
      const count = schedules.filter((s) => (s.time || '').toUpperCase().includes(hour.split(':')[0])).length;
      return {
        hour,
        appointments: count,
        walkins: 0,
        total: count,
        isPeak: count > 0 && count === Math.max(...hours.map((h) => schedules.filter((s) => (s.time || '').toUpperCase().includes(h.split(':')[0])).length))
      };
    });
  }

  public getDayStreaks(branchId: string, availableBranches: BranchScopeOption[]): DayStreakDataPoint[] {
    const days = [
      { day: 'Mon', fullDay: 'Monday' },
      { day: 'Tue', fullDay: 'Tuesday' },
      { day: 'Wed', fullDay: 'Wednesday' },
      { day: 'Thu', fullDay: 'Thursday' },
      { day: 'Fri', fullDay: 'Friday' },
      { day: 'Sat', fullDay: 'Saturday' },
      { day: 'Sun', fullDay: 'Sunday' }
    ];

    const schedules = this.getScopedSchedules(branchId, availableBranches).filter((s) => s.type !== 'birthdays');

    return days.map((d) => {
      const visits = schedules.filter((s) => {
        if (!s.date) return false;
        const dateObj = new Date(s.date);
        if (isNaN(dateObj.getTime())) return false;
        return dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() === d.fullDay.toLowerCase();
      }).length;

      return {
        day: d.day,
        fullDay: d.fullDay,
        visits,
        isPeak: visits > 0,
        appointmentPct: visits > 0 ? 100 : 0
      };
    });
  }

  /**
   * Tally procedure ranking directly from live schedules & Master Files.
   */
  /**
   * Tally procedure ranking directly from live billed services / progress notes.
   */
  public getTopServices(branchId: string, availableBranches: BranchScopeOption[]): TopServiceDataPoint[] {
    const patients = this.getScopedPatients(branchId, availableBranches);
    const agg = aggregateClinicFinancials(patients);

    if (agg.allServices.length === 0) {
      return [];
    }

    const services = masterFileDirectoryService.getTagRecords('clinical-services');
    const colorPalette = ['#3b82f6', '#6366f1', '#14b8a6', '#10b981', '#f59e0b', '#ec4899'];

    // Tally actual procedures performed from billed services / progress notes
    const tallyMap = new Map<string, number>();
    agg.allServices.forEach((s) => {
      const proc = s.service?.trim() || 'Clinical Service';
      tallyMap.set(proc, (tallyMap.get(proc) || 0) + (Number(s.quantity) || 1));
    });

    const list: TopServiceDataPoint[] = [];
    let idx = 0;
    tallyMap.forEach((count, procName) => {
      const matchedTag = services.find((tag) => tag.name.toLowerCase() === procName.toLowerCase());
      list.push({
        id: matchedTag?.id || `svc-${idx + 1}`,
        name: procName,
        category: matchedTag?.treatmentCategory || matchedTag?.category || 'Clinical Procedure',
        count,
        percentage: 0,
        color: colorPalette[idx % colorPalette.length]
      });
      idx++;
    });

    list.sort((a, b) => b.count - a.count);

    const totalCount = list.reduce((a, b) => a + b.count, 0) || 1;
    return list.map((item) => ({
      ...item,
      percentage: Math.round((item.count / totalCount) * 100)
    }));
  }

  public getDemographics(branchId: string, availableBranches: BranchScopeOption[]): DemographicsData {
    const patients = this.getScopedPatients(branchId, availableBranches);
    const femaleCount = patients.filter((p) => (p.sex || '').toLowerCase() === 'female').length;
    const maleCount = patients.filter((p) => (p.sex || '').toLowerCase() === 'male').length;

    const total = patients.length;
    const fPct = total > 0 ? Math.round((femaleCount / total) * 100) : 0;
    const mPct = total > 0 ? Math.round((maleCount / total) * 100) : 0;

    let pedia0to12 = 0;
    let teens13to19 = 0;
    let young20to35 = 0;
    let adult36to50 = 0;
    let senior51plus = 0;

    patients.forEach((p) => {
      let ageNum = Number(p.age?.replace(/\D/g, ''));
      if (!Number.isFinite(ageNum) || ageNum <= 0) {
        if (p.birthDate) {
          const birthYear = new Date(p.birthDate).getFullYear();
          if (Number.isFinite(birthYear)) {
            ageNum = new Date().getFullYear() - birthYear;
          }
        }
      }
      if (!Number.isFinite(ageNum) || ageNum <= 0) ageNum = 25;

      if (ageNum <= 12) pedia0to12++;
      else if (ageNum <= 19) teens13to19++;
      else if (ageNum <= 35) young20to35++;
      else if (ageNum <= 50) adult36to50++;
      else senior51plus++;
    });

    const pediatricTotal = pedia0to12;
    const pPct = total > 0 ? Math.round((pediatricTotal / total) * 100) : 0;

    const ageGroups: AgeGroupDataPoint[] = [
      { bracket: '0-12', label: '0-12 yrs (Pediatric)', count: pedia0to12, percentage: total > 0 ? Math.round((pedia0to12 / total) * 100) : 0, color: '#10b981' },
      { bracket: '13-19', label: '13-19 yrs (Teens)', count: teens13to19, percentage: total > 0 ? Math.round((teens13to19 / total) * 100) : 0, color: '#3b82f6' },
      { bracket: '20-35', label: '20-35 yrs (Young Adults)', count: young20to35, percentage: total > 0 ? Math.round((young20to35 / total) * 100) : 0, color: '#6366f1' },
      { bracket: '36-50', label: '36-50 yrs (Adults)', count: adult36to50, percentage: total > 0 ? Math.round((adult36to50 / total) * 100) : 0, color: '#f59e0b' },
      { bracket: '51+', label: '51+ yrs (Seniors)', count: senior51plus, percentage: total > 0 ? Math.round((senior51plus / total) * 100) : 0, color: '#8b5cf6' }
    ];

    return {
      gender: {
        female: { count: femaleCount, percentage: fPct, color: '#ec4899' },
        male: { count: maleCount, percentage: mPct, color: '#3b82f6' },
        pediatric: { count: pediatricTotal, percentage: pPct, color: '#10b981' }
      },
      ageGroups,
      patientClass: {
        selfPayPct: total > 0 ? 100 : 0,
        hmoCorporatePct: 0,
        referralPct: 0
      }
    };
  }

  public getDataset(
    branchId = 'all',
    timeRange: TimeRangeOption = 'month',
    loggedClinicName?: string,
    loggedUserEmail?: string
  ): ClinicAnalyticsDataset {
    const subscriberId = this.resolveSubscriberId(loggedUserEmail);
    const availableBranches = this.getAvailableBranches(loggedClinicName, loggedUserEmail);
    const currentScope =
      branchId === 'all'
        ? {
            id: 'all',
            name: availableBranches.length === 1 ? `${availableBranches[0].name} (Consolidated)` : 'All Clinic Branches (Consolidated View)',
            code: 'ALL-BRANCHES',
            isMain: true
          }
        : availableBranches.find((b) => b.id === branchId) || availableBranches[0];

    const resourceSnapshot = this.getResourceSnapshot(branchId, availableBranches, subscriberId);
    const volumeTrend = this.getVolumeTrend(branchId, timeRange, availableBranches);
    const peakHours = this.getPeakHours(branchId, availableBranches);
    const dayStreaks = this.getDayStreaks(branchId, availableBranches);
    const topServices = this.getTopServices(branchId, availableBranches);
    const demographics = this.getDemographics(branchId, availableBranches);

    const patients = this.getScopedPatients(branchId, availableBranches);
    const schedules = this.getScopedSchedules(branchId, availableBranches).filter((s) => s.type !== 'birthdays');

    const totalTraffic = schedules.length;
    const peakDayFound = dayStreaks.reduce((prev, curr) => (curr.visits > prev.visits ? curr : prev), dayStreaks[0]);

    const kpis: AnalyticsKpiData = {
      totalVisits: totalTraffic,
      totalVisitsGrowth: totalTraffic > 0 ? `+${totalTraffic} scheduled visits` : '0 scheduled visits',
      appointmentCount: totalTraffic,
      walkInCount: 0,
      appointmentRatio: totalTraffic > 0 ? 100 : 0,
      walkInRatio: 0,
      busiestDay: totalTraffic > 0 ? peakDayFound.fullDay : 'No visits scheduled',
      busiestDayAvg: totalTraffic > 0 ? peakDayFound.visits : 0,
      retentionRate: totalTraffic > 0 ? 100 : 0,
      newPatientsCount: patients.length,
      returningPatientsCount: totalTraffic
    };

    return {
      scope: currentScope,
      availableBranches,
      resourceSnapshot,
      kpis,
      timeRange,
      volumeTrend,
      peakHours,
      dayStreaks,
      topServices,
      demographics
    };
  }
}

export const mockClinicAnalyticsService = new MockClinicAnalyticsService();
