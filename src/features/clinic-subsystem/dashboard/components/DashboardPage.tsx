import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CreditCard, Gift, Users, UserPlus, Stethoscope, FileText } from 'lucide-react';
import {
  loadPatientDirectoryRecords,
  PATIENT_DIRECTORY_UPDATED_EVENT
} from '../../patients/shared/patientDirectoryStore';
import {
  aggregateClinicFinancials,
  BILL_PAYMENTS_UPDATED_EVENT,
  loadBillPaymentRecords
} from '../../patients/clinical/bills-payments/billPaymentStore';
import {
  PROGRESS_NOTES_UPDATED_EVENT,
  loadProgressNotes
} from '../../patients/clinical/progress-notes/progressNoteStore';
import {
  APPOINTMENTS_UPDATED_EVENT
} from '../../patients/clinical/appointments/appointmentStore';
import {
  DENTAL_RECALLS_UPDATED_EVENT
} from '../../patients/clinical/dental-recalls/dentalRecallStore';
import { getClinicScheduleItems } from '../../scheduling/scheduleStorage';
import {
  branchSettingsStore,
  BRANCH_SETTINGS_UPDATED_EVENT
} from '../../settings/services/branchSettingsStore';
import type {
  DashboardAppointmentItem,
  DashboardBalanceItem,
  DashboardBirthdayItem,
  DashboardKPIItem
} from '../dashboard.mock';
import type { DashboardActivityTimelineItem } from '../dashboard.activity.mock';
import { DashboardHeader } from './DashboardHeader';
import { DashboardKPISection } from './DashboardKPISection';
import { DashboardSummarySection } from './DashboardSummarySection';
import { DashboardOperationalSection } from './DashboardOperationalSection';
import { DashboardLowerSection } from './DashboardLowerSection';

interface Props {
  currentClinic: any;
  loggedUserName: string;
  showToast: (message: string, type?: 'success' | 'info') => void;
  role?: 'clinic_owner' | 'associate' | 'staff';
}

const parseBirthdayMonthDay = (dateStr?: string) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return { month: d.getMonth(), day: d.getDate() };
  }
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length >= 2) {
    const day = Number(parts[0]);
    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const monthIndex = monthNames.findIndex((m) => parts[1]?.toLowerCase().startsWith(m.slice(0, 3)));
    if (monthIndex >= 0 && Number.isFinite(day)) {
      return { month: monthIndex, day };
    }
  }
  return null;
};

export function DashboardPage({ currentClinic, showToast, role = 'clinic_owner' }: Props) {
  const [versionTick, setVersionTick] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setVersionTick((v) => v + 1);

    window.addEventListener(PATIENT_DIRECTORY_UPDATED_EVENT, handleUpdate);
    window.addEventListener(BILL_PAYMENTS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(PROGRESS_NOTES_UPDATED_EVENT, handleUpdate);
    window.addEventListener(APPOINTMENTS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(DENTAL_RECALLS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(BRANCH_SETTINGS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(PATIENT_DIRECTORY_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(BILL_PAYMENTS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(PROGRESS_NOTES_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(APPOINTMENTS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(DENTAL_RECALLS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(BRANCH_SETTINGS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const currentDate = new Date().toISOString().split('T')[0];
  const currentDateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  // Dynamic real data from Subsystem Patient Store & Schedule Store
  const patients = useMemo(() => loadPatientDirectoryRecords(currentClinic?.id), [versionTick, currentClinic?.id]);
  const schedules = useMemo(() => getClinicScheduleItems(undefined, currentClinic?.id), [versionTick, currentClinic?.id]);
  const financials = useMemo(() => aggregateClinicFinancials(patients), [versionTick, patients]);

  // Compute Appointments for Today
  const todayAppointments: DashboardAppointmentItem[] = useMemo(() => {
    return schedules
      .filter((s) => s.type !== 'birthdays' && (s.date === currentDate || !s.date))
      .map((s, idx) => ({
        id: s.id || `appt-${idx}`,
        time: s.time || s.startTime || '09:00 AM',
        patientName: s.patientName || 'Walk-in Patient',
        procedure: s.procedure || s.title || 'General Consultation',
        dentist: s.dentist || 'Assigned Associate Dentist',
        status: s.status === 'Completed' ? 'Completed' : s.status === 'Cancelled' ? 'Cancelled' : 'Confirmed'
      }));
  }, [schedules, currentDate]);

  // Compute Birthdays strictly matching TODAY (month & day)
  const todayDateObj = new Date();
  const todayMonth = todayDateObj.getMonth();
  const todayDay = todayDateObj.getDate();

  const todayBirthdays: DashboardBirthdayItem[] = useMemo(() => {
    return patients
      .filter((p) => {
        const md = parseBirthdayMonthDay(p.birthDate);
        return md !== null && md.month === todayMonth && md.day === todayDay;
      })
      .map((p, idx) => ({
        id: `bday-${p.id || idx}`,
        patientName: p.name,
        birthday: p.birthDate || 'Today',
        contact: p.contact || p.mobileNumber || 'No contact'
      }));
  }, [patients, todayMonth, todayDay]);

  // Compute Outstanding Balances dynamically
  const balances: DashboardBalanceItem[] = useMemo(() => {
    return patients
      .map((p) => {
        const bills = loadBillPaymentRecords(p);
        const totalBalanceAmount = bills.length > 0
          ? bills.reduce((sum, r) => sum + Math.max(Number(r.balanceAmount ?? (r.payableAmount - r.paidAmount)), 0), 0)
          : Number(p.balance?.replace(/[^0-9.-]/g, '')) || 0;
        return {
          id: `bal-${p.id}`,
          patientName: p.name,
          amount: `PHP ${totalBalanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          rawAmount: totalBalanceAmount,
          lastBillDate: p.lastDentalVisit || p.lastUpdated || 'Recent'
        };
      })
      .filter((item) => item.rawAmount > 0);
  }, [patients, versionTick]);

  const totalBalanceAmount = financials.totalOutstanding;

  // Dynamic KPI items
  const kpis: DashboardKPIItem[] = useMemo(() => [
    {
      id: 'kpi-patients',
      title: 'Total Patients',
      value: String(patients.length),
      description: 'Registered patient profiles',
      trend: patients.length > 0 ? `+${patients.length} active` : 'No records yet',
      trendStatus: 'positive',
      icon: Users
    },
    {
      id: 'kpi-appointments',
      title: "Today's Appointments",
      value: String(todayAppointments.length),
      description: 'Scheduled visits today',
      trend: `${todayAppointments.filter((a) => a.status === 'Completed').length} completed`,
      trendStatus: 'neutral',
      icon: CalendarDays
    },
    {
      id: 'kpi-balances',
      title: 'Pending Balances',
      value: `PHP ${totalBalanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: `${balances.length} patient account${balances.length === 1 ? '' : 's'}`,
      trend: balances.length > 0 ? `${balances.length} due` : 'Zero receivables',
      trendStatus: balances.length > 0 ? 'negative' : 'positive',
      icon: CreditCard
    },
    {
      id: 'kpi-birthdays',
      title: "Today's Birthdays",
      value: String(todayBirthdays.length),
      description: 'Celebration and greeting registry',
      trend: todayBirthdays.length > 0 ? `${todayBirthdays.length} today` : 'None today',
      trendStatus: todayBirthdays.length > 0 ? 'positive' : 'neutral',
      icon: Gift
    }
  ], [patients, todayAppointments, totalBalanceAmount, balances, todayBirthdays]);

  // Generate dynamic live activity feed
  const recentActivities: DashboardActivityTimelineItem[] = useMemo(() => {
    const acts: DashboardActivityTimelineItem[] = [];

    // Latest patients
    patients.slice(0, 3).forEach((p) => {
      acts.push({
        id: `act-patient-${p.id}`,
        title: `Patient Profile Active: ${p.name}`,
        description: `Enrolled in clinic registry (${p.id})`,
        time: p.addedDate || 'Recent',
        icon: UserPlus
      });
    });

    // Latest progress notes
    patients.forEach((p) => {
      const notes = loadProgressNotes(p);
      notes.slice(0, 2).forEach((n) => {
        acts.push({
          id: `act-note-${n.id}`,
          title: `Progress Note: ${n.title}`,
          description: `${p.name} - ${n.dentist || 'Assigned Dentist'}`,
          time: n.visitDate || 'Recent',
          icon: FileText
        });
      });
    });

    // Latest bills
    financials.allBills.slice(0, 3).forEach((b) => {
      acts.push({
        id: `act-bill-${b.id}`,
        title: `Treatment Billed: ${b.description || 'Clinical Services'}`,
        description: `${b.patientName} - PHP ${Number(b.payableAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        time: b.entryDate || 'Recent',
        icon: CreditCard
      });
    });

    if (acts.length === 0) {
      acts.push({
        id: 'act-default',
        title: `${currentClinic?.name || 'Clinic'} Hub Active`,
        description: 'Operational workspace ready for clinical practice.',
        time: 'Today',
        icon: Stethoscope
      });
    }

    return acts.slice(0, 5);
  }, [patients, financials, versionTick]);

  const clinicId = currentClinic?.id || 'CLN-000013';
  const activeChairsCount = useMemo(() => {
    try {
      const branchSettings = branchSettingsStore.getSettings(clinicId);
      return branchSettings.chairs.filter((c) => c.active).length;
    } catch {
      return 3;
    }
  }, [clinicId, versionTick]);

  return (
    <div className="clinic-dashboard-page">
      <DashboardHeader
        sectionLabel={role === 'associate' ? 'CLINICAL WORKSPACE' : role === 'staff' ? 'OPERATIONS HUB' : 'MAIN HUB'}
        title={role === 'associate' ? 'Clinical Dashboard' : role === 'staff' ? 'Operations Dashboard' : 'Dashboard'}
        subtitle={role === 'associate' ? 'Focus on today\'s appointments, assigned patients, and clinical follow-through.' : role === 'staff' ? 'Keep patient flow, schedules, and daily branch operations moving.' : 'Clinical overview of patient registry, appointments, birthdays, and ledger balances.'}
        date={currentDateLabel}
      />

      <DashboardKPISection items={kpis} />

      <DashboardSummarySection
        appointments={todayAppointments}
        birthdays={todayBirthdays}
        balances={balances}
      />

      <DashboardOperationalSection />

      <DashboardLowerSection
        recentActivity={recentActivities}
        activeChairsCount={activeChairsCount}
        onAction={(label) => {
          showToast(`${label} workflow triggered.`, 'info');
        }}
      />
    </div>
  );
}
