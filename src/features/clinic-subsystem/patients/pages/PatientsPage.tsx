import { useEffect, useMemo, useState } from 'react';
import type { SortDirection } from '../components/PatientTableHeader';
import { ClinicPageHeader } from '../../components/ClinicPageHeader';
import {
  PatientToolbar,
  type UnifiedPatientFilterKey,
  type UnifiedPatientFilterOption
} from '../components/PatientToolbar';
import { PatientTable } from '../components/PatientTable';
import { PatientGrid } from '../components/PatientGrid';
import { PatientEmptyState } from '../components/PatientEmptyState';
import { PatientRecordView } from '../components/PatientRecordView';
import { AddPatientStepper, type PatientFormState } from '../components/AddPatientStepper';
import type { PatientPreviewItem } from '../components/patientTypes';
import { buildPatientFromForm } from '../components/patientRecordMappers';
import { consumeQueuedAddPatientOpen, OPEN_ADD_PATIENT_EVENT } from '../shared/addPatientNavigation';
import {
  deletePatientDirectoryRecord,
  loadPatientDirectoryRecords,
  PATIENT_DIRECTORY_UPDATED_EVENT,
  purgePatientScopedData,
  savePatientDirectoryRecords,
  seededPatientDirectory
} from '../shared/patientDirectoryStore';
import { ConfirmationDialog } from '../../../../components/overlays/ConfirmationDialog';
import { masterFileDirectoryService } from '../../master-files/masterFileDirectoryService';
import {
  APPOINTMENTS_UPDATED_EVENT,
  loadAppointmentRecords
} from '../clinical/appointments/appointmentStore';
import {
  BILL_PAYMENTS_UPDATED_EVENT,
  formatCompactBillCurrency,
  loadBillPaymentRecords
} from '../clinical/bills-payments/billPaymentStore';
import {
  DENTAL_RECALLS_UPDATED_EVENT,
  loadDentalRecallRecords
} from '../clinical/dental-recalls/dentalRecallStore';

interface Props {
  currentClinic: any;
  loggedUserName: string;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  canEditPatients?: boolean;
  canDeletePatients?: boolean;
}

const previewPatients: PatientPreviewItem[] = seededPatientDirectory;

const PATIENTS_PER_PAGE = 5;

const monthLookup: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11
};

const parseDisplayDate = (value: string) => {
  const parts = value.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = monthLookup[parts[1].toLowerCase()];
  const year = Number(parts[2]);
  if (!Number.isFinite(day) || month === undefined || !Number.isFinite(year)) return null;
  return new Date(year, month, day);
};

const getPatientSearchText = (patient: typeof previewPatients[number]) => {
  const [firstName = '', ...rest] = patient.name.split(/\s+/);
  const lastName = rest.join(' ');
  return [patient.id, firstName, lastName, patient.name, patient.contact, `${firstName} ${lastName}`.trim()]
    .join(' ')
    .toLowerCase();
};

const parseFlexibleDate = (value?: string) => {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const fallback = parseDisplayDate(value);
  return fallback && !Number.isNaN(fallback.getTime()) ? fallback : null;
};

const getPatientAge = (patient: PatientPreviewItem, today: Date) => {
  const birthDate = parseFlexibleDate(patient.birthDate);
  if (!birthDate) return null;

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  const dayDelta = today.getDate() - birthDate.getDate();

  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const getPatientType = (patient: PatientPreviewItem, today: Date) => {
  const age = getPatientAge(patient, today);
  if (age === null) return 'unknown';
  if (age <= 17) return 'minor';
  if (age <= 20) return 'pedia';
  return 'adult';
};

const toDayStart = (value: Date) => {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
};

const getDateKey = (value: Date | null) => {
  if (!value) return '';
  const dayStart = toDayStart(value);
  return `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`;
};

const hasPastDueRecall = (patient: PatientPreviewItem, today: Date) => {
  const todayStart = toDayStart(today);
  const records = loadDentalRecallRecords(patient);
  if (!records || records.length === 0) return false;

  return records.some((record) => {
    const recallDate = parseFlexibleDate(record.recallDate);
    if (!recallDate) return false;
    const recallDateStart = toDayStart(recallDate);

    return recallDateStart < todayStart && !['Sent', 'Completed'].includes(record.statusLabel);
  });
};

const hasMissedBirthdayNotice = (patient: PatientPreviewItem, today: Date) => {
  const birthDate = parseFlexibleDate(patient.birthDate);
  if (!birthDate) return false;
  const currentBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  const diffMs = toDayStart(today).getTime() - currentBirthday.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays >= 1 && diffDays <= 7;
};

const hasMissedAppointment = (patient: PatientPreviewItem, today: Date) => {
  const now = new Date(today);
  const records = loadAppointmentRecords(patient);
  if (!records || records.length === 0) return false;

  return records.some((record) => {
    if (['Completed', 'Cancelled', 'No Show'].includes(record.statusLabel)) {
      return false;
    }

    const datePart = record.appointmentDate?.trim();
    if (!datePart) return false;

    const timePart = record.appointmentTime?.trim() || '00:00';
    const normalizedTime = /am|pm/i.test(timePart)
      ? timePart
      : `${timePart.length === 5 ? timePart : '00:00'}`;
    const appointmentDateTime = parseFlexibleDate(`${datePart} ${normalizedTime}`);
    if (!appointmentDateTime) return false;

    const diffHours = (now.getTime() - appointmentDateTime.getTime()) / (1000 * 60 * 60);
    return diffHours >= 12;
  });
};

const hasPartialPay = (patient: PatientPreviewItem) => {
  const records = loadBillPaymentRecords(patient);
  return records.some((record) => record.paidAmount > 0 && record.balanceAmount > 0);
};

const derivePatientRemarkFlags = (patient: PatientPreviewItem, today: Date) => {
  const flags: string[] = [];

  if (hasPastDueRecall(patient, today)) {
    flags.push('Recall Due');
  }

  if (hasMissedBirthdayNotice(patient, today)) {
    flags.push('Missed Birthday');
  }

  if (hasMissedAppointment(patient, today)) {
    flags.push('Missed Appointment');
  }

  if (hasPartialPay(patient)) {
    flags.push('Partial Pay');
  }

  return [...new Set(flags)];
};

export function PatientsPage({ currentClinic, loggedUserName: _loggedUserName, showToast, canEditPatients = true, canDeletePatients = true }: Props) {
  const currentDateLabel = new Intl.DateTimeFormat('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  const [searchValue, setSearchValue] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedFilter, setSelectedFilter] = useState<UnifiedPatientFilterKey>('none');
  const [selectedFilterValue, setSelectedFilterValue] = useState('all');
  const [selectedEventDate, setSelectedEventDate] = useState('');
  const [lastVisitSort, setLastVisitSort] = useState<SortDirection>(null);
  const [balanceSort, setBalanceSort] = useState<SortDirection>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientPreviewItem[]>(() => loadPatientDirectoryRecords(currentClinic?.id));
  const [pendingDeletePatientId, setPendingDeletePatientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [linkedDataVersion, setLinkedDataVersion] = useState(0);
  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    setPatients(loadPatientDirectoryRecords(currentClinic?.id));
  }, [currentClinic?.id]);

  useEffect(() => {
    const handleLinkedDataChange = () => setLinkedDataVersion((current) => current + 1);
    const handlePatientsUpdated = () => setPatients(loadPatientDirectoryRecords(currentClinic?.id));

    window.addEventListener(APPOINTMENTS_UPDATED_EVENT, handleLinkedDataChange);
    window.addEventListener(BILL_PAYMENTS_UPDATED_EVENT, handleLinkedDataChange);
    window.addEventListener(DENTAL_RECALLS_UPDATED_EVENT, handleLinkedDataChange);
    window.addEventListener(PATIENT_DIRECTORY_UPDATED_EVENT, handlePatientsUpdated);
    window.addEventListener('storage', handleLinkedDataChange);

    return () => {
      window.removeEventListener(APPOINTMENTS_UPDATED_EVENT, handleLinkedDataChange);
      window.removeEventListener(BILL_PAYMENTS_UPDATED_EVENT, handleLinkedDataChange);
      window.removeEventListener(DENTAL_RECALLS_UPDATED_EVENT, handleLinkedDataChange);
      window.removeEventListener(PATIENT_DIRECTORY_UPDATED_EVENT, handlePatientsUpdated);
      window.removeEventListener('storage', handleLinkedDataChange);
    };
  }, [currentClinic?.id]);

  const patientsWithDerivedRemarks = useMemo(
    () => patients.map((patient) => {
      // Calculate dynamic balance from bills if available
      const bills = loadBillPaymentRecords(patient);
      const totalBalanceAmount = bills.length > 0
        ? bills.reduce((sum, r) => sum + Math.max(Number(r.balanceAmount ?? (r.payableAmount - r.paidAmount)), 0), 0)
        : Number(patient.balance.replace(/[^0-9.-]/g, '')) || 0;
      const dynamicBalance = formatCompactBillCurrency(totalBalanceAmount);

      const tableRemarkFlags = derivePatientRemarkFlags(patient, today);
      return {
        ...patient,
        balance: dynamicBalance,
        tableRemarkFlags,
        tableRemarks: tableRemarkFlags.join(', ')
      };
    }),
    [patients, today, linkedDataVersion]
  );

  const selectedEventDateSummary = useMemo(() => {
    if (!selectedEventDate) return null;

    const selectedKey = getDateKey(parseFlexibleDate(selectedEventDate));
    if (!selectedKey) return null;

    let totalPatients = 0;
    let totalAppointments = 0;
    let totalRecalls = 0;
    let bothCount = 0;

    patientsWithDerivedRemarks.forEach((patient) => {
      const appointmentCount = loadAppointmentRecords(patient).filter((record) => (
        getDateKey(parseFlexibleDate(record.appointmentDate)) === selectedKey
      )).length;

      const recallCount = loadDentalRecallRecords(patient).filter((record) => (
        getDateKey(parseFlexibleDate(record.recallDate)) === selectedKey
      )).length;

      const patientLevelRecall = getDateKey(parseFlexibleDate(patient.recallDate)) === selectedKey ? 1 : 0;
      const totalRecallCount = recallCount + patientLevelRecall;

      if (appointmentCount > 0 || totalRecallCount > 0) {
        totalPatients += 1;
      }

      totalAppointments += appointmentCount;
      totalRecalls += totalRecallCount;

      if (appointmentCount > 0 && totalRecallCount > 0) {
        bothCount += 1;
      }
    });

    return {
      totalPatients,
      totalAppointments,
      totalRecalls,
      bothCount
    };
  }, [patientsWithDerivedRemarks, selectedEventDate]);

  const tagOptions = useMemo(
    () => masterFileDirectoryService.getActiveTagRecords('risk-tags').map((record) => ({
      value: record.code,
      label: record.name
    })),
    [linkedDataVersion]
  );

  const firstVisitYearOptions = useMemo(() => {
    const years = new Set<string>();

    patientsWithDerivedRemarks.forEach((patient) => {
      const date = parseFlexibleDate(patient.firstVisit);
      if (date) years.add(String(date.getFullYear()));
    });

    return [...years].sort((a, b) => Number(b) - Number(a)).map((year) => ({
      value: year,
      label: year
    }));
  }, [patientsWithDerivedRemarks]);

  const filterConfig = useMemo<Record<UnifiedPatientFilterKey, { label: string; options: UnifiedPatientFilterOption[] }>>(() => ({
    none: { label: 'Option', options: [{ value: 'all', label: 'All Patients' }] },
    'recall-date': {
      label: 'Recall Date',
      options: [
        { value: 'all', label: 'All Recall Dates' },
        { value: 'upcoming', label: 'Upcoming Recall' },
        { value: 'overdue', label: 'Overdue Recall' },
        { value: 'newest', label: 'New to Old' },
        { value: 'oldest', label: 'Old to New' }
      ]
    },
    balance: {
      label: 'Balance',
      options: [
        { value: 'low-high', label: 'Low to High' },
        { value: 'high-low', label: 'High to Low' }
      ]
    },
    status: {
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    },
    tags: {
      label: 'Tag',
      options: tagOptions.length ? tagOptions : [{ value: 'none', label: 'No tags available' }]
    },
    'first-visit': {
      label: 'First Visit Year',
      options: firstVisitYearOptions.length ? firstVisitYearOptions : [{ value: 'none', label: 'No visit years available' }]
    },
    'patient-type': {
      label: 'Patient Type',
      options: [
        { value: 'minor', label: 'Minor (17 below)' },
        { value: 'pedia', label: 'Pedia (18-20)' },
        { value: 'adult', label: 'Adult (21+)' }
      ]
    },
    'needs-attention': {
      label: 'Attention Rule',
      options: [
        { value: 'any', label: 'Any Attention Flag' },
        { value: 'recall-due', label: 'Recall Due' },
        { value: 'missed-birthday', label: 'Missed Birthday' },
        { value: 'missed-appointment', label: 'Missed Appointment' },
        { value: 'partial-pay', label: 'Partial Pay' },
        { value: 'most-flags', label: 'Most Attention Needed' }
      ]
    },
    'recent-visit': {
      label: 'Recent Visit',
      options: [
        { value: 'newest', label: 'Latest to Earliest' },
        { value: 'oldest', label: 'Earliest to Latest' }
      ]
    },
    'balance-due': {
      label: 'Balance Due',
      options: [
        { value: 'with-balance', label: 'With Balance Due' },
        { value: 'cleared', label: 'Cleared Balance' }
      ]
    }
  }), [firstVisitYearOptions, tagOptions]);

  const filterOptions = filterConfig[selectedFilter].options;
  const filterValueLabel = filterConfig[selectedFilter].label;

  useEffect(() => {
    const nextOptions = filterConfig[selectedFilter].options;
    if (!nextOptions.some((option) => option.value === selectedFilterValue)) {
      setSelectedFilterValue(nextOptions[0]?.value || 'all');
    }
  }, [selectedFilter, selectedFilterValue, filterConfig]);

  useEffect(() => {
    const openAddStepper = () => {
      setSelectedPatientId(null);
      setEditingPatientId(null);
      setAddPatientOpen(true);
    };

    const handleOpenAddPatient = () => {
      openAddStepper();
    };

    window.addEventListener(OPEN_ADD_PATIENT_EVENT, handleOpenAddPatient as EventListener);

    if (consumeQueuedAddPatientOpen(currentClinic?.id)) {
      openAddStepper();
    }

    return () => {
      window.removeEventListener(OPEN_ADD_PATIENT_EVENT, handleOpenAddPatient as EventListener);
    };
  }, [currentClinic?.id]);

  const filteredPatients = useMemo(() => {
    const needle = searchValue.trim().toLowerCase();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const baseList = !needle
      ? patientsWithDerivedRemarks
      : patientsWithDerivedRemarks.filter((patient) => getPatientSearchText(patient).includes(needle));

    const filtered = baseList.filter((patient) => {
      const recallDate = parseDisplayDate(patient.recallDate);
      const balanceValue = Number(patient.balance.replace(/[^0-9.-]/g, '')) || 0;
      const isUpcomingRecall = Boolean(recallDate && recallDate >= todayStart);
      const isOverdueRecall = Boolean(recallDate && recallDate < todayStart);
      const patientType = getPatientType(patient, today);
      const firstVisitYear = parseFlexibleDate(patient.firstVisit)?.getFullYear();
      const attentionCount = patient.tableRemarkFlags.length;
      const appointmentRecords = loadAppointmentRecords(patient);
      const dentalRecallRecords = loadDentalRecallRecords(patient);

      if (selectedEventDate) {
        const selectedKey = getDateKey(parseFlexibleDate(selectedEventDate));
        const hasDateMatchedAppointment = appointmentRecords.some((record) => (
          getDateKey(parseFlexibleDate(record.appointmentDate)) === selectedKey
        ));

        const hasDateMatchedRecall = dentalRecallRecords.some((record) => (
          getDateKey(parseFlexibleDate(record.recallDate)) === selectedKey
        ));

        const hasPatientLevelRecall = getDateKey(parseFlexibleDate(patient.recallDate)) === selectedKey;

        if (!hasDateMatchedAppointment && !hasDateMatchedRecall && !hasPatientLevelRecall) {
          return false;
        }
      }

      if (selectedFilter === 'recall-date') {
        if (selectedFilterValue === 'upcoming' && !isUpcomingRecall) return false;
        if (selectedFilterValue === 'overdue' && !isOverdueRecall) return false;
      }

      if (selectedFilter === 'status' && patient.status.toLowerCase() !== selectedFilterValue) {
        return false;
      }

      if (selectedFilter === 'tags') {
        if (selectedFilterValue === 'none') return false;
        if (!patient.tags?.includes(selectedFilterValue)) return false;
      }

      if (selectedFilter === 'first-visit') {
        if (selectedFilterValue === 'none') return false;
        if (String(firstVisitYear || '') !== selectedFilterValue) return false;
      }

      if (selectedFilter === 'patient-type' && patientType !== selectedFilterValue) {
        return false;
      }

      if (selectedFilter === 'needs-attention') {
        if (selectedFilterValue === 'any' && attentionCount === 0) return false;
        if (selectedFilterValue === 'recall-due' && !patient.tableRemarkFlags.includes('Recall Due')) return false;
        if (selectedFilterValue === 'missed-birthday' && !patient.tableRemarkFlags.includes('Missed Birthday')) return false;
        if (selectedFilterValue === 'missed-appointment' && !patient.tableRemarkFlags.includes('Missed Appointment')) return false;
        if (selectedFilterValue === 'partial-pay' && !patient.tableRemarkFlags.includes('Partial Pay')) return false;
        if (selectedFilterValue === 'most-flags' && attentionCount === 0) return false;
      }

      if (selectedFilter === 'balance-due') {
        if (selectedFilterValue === 'with-balance' && balanceValue <= 0) return false;
        if (selectedFilterValue === 'cleared' && balanceValue > 0) return false;
      }

      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (selectedFilter === 'needs-attention' && selectedFilterValue === 'most-flags') {
        const compareFlags = b.tableRemarkFlags.length - a.tableRemarkFlags.length;
        if (compareFlags !== 0) return compareFlags;
      }

      if (selectedFilter === 'recall-date' && ['newest', 'oldest'].includes(selectedFilterValue)) {
        const aTime = parseFlexibleDate(a.recallDate)?.getTime() || 0;
        const bTime = parseFlexibleDate(b.recallDate)?.getTime() || 0;
        const compare = aTime - bTime;
        return selectedFilterValue === 'oldest' ? compare : -compare;
      }

      if (selectedFilter === 'balance') {
        const aValue = Number(a.balance.replace(/[^0-9.-]/g, '')) || 0;
        const bValue = Number(b.balance.replace(/[^0-9.-]/g, '')) || 0;
        const compare = aValue - bValue;
        return selectedFilterValue === 'low-high' ? compare : -compare;
      }

      if (selectedFilter === 'recent-visit') {
        const aTime = parseFlexibleDate(a.lastDentalVisit || a.firstVisit)?.getTime() || 0;
        const bTime = parseFlexibleDate(b.lastDentalVisit || b.firstVisit)?.getTime() || 0;
        const compare = aTime - bTime;
        return selectedFilterValue === 'oldest' ? compare : -compare;
      }

      if (lastVisitSort) {
        const compare = new Date(a.lastDentalVisit || a.recallDate).getTime() - new Date(b.lastDentalVisit || b.recallDate).getTime();
        return lastVisitSort === 'asc' ? compare : -compare;
      }
      if (balanceSort) {
        const aValue = Number(a.balance.replace(/[^0-9.-]/g, '')) || 0;
        const bValue = Number(b.balance.replace(/[^0-9.-]/g, '')) || 0;
        const compare = aValue - bValue;
        return balanceSort === 'asc' ? compare : -compare;
      }
      return a.id.localeCompare(b.id);
    });

    return sorted;
  }, [searchValue, selectedFilter, selectedFilterValue, selectedEventDate, balanceSort, lastVisitSort, today, patientsWithDerivedRemarks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, selectedFilter, selectedFilterValue, selectedEventDate, viewMode, patients.length]);

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE));

  const paginatedPatients = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PATIENTS_PER_PAGE;
    return filteredPatients.slice(start, start + PATIENTS_PER_PAGE);
  }, [currentPage, filteredPatients, totalPages]);

  const activeFilterCount = (selectedFilter !== 'none' ? 1 : 0) + (selectedEventDate ? 1 : 0) + (searchValue.trim() ? 1 : 0);

  const handleAddPatient = () => {
    setSelectedPatientId(null);
    setEditingPatientId(null);
    setAddPatientOpen(true);
  };

  const handleViewRecord = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  const handleEditPatient = (patientId: string) => {
    if (!canEditPatients) return showToast('You do not have permission to edit patient data.', 'warning');
    setSelectedPatientId(null);
    setAddPatientOpen(false);
    setEditingPatientId(patientId);
  };

  const handleRequestDeletePatient = (patientId: string) => {
    if (!canDeletePatients) return showToast('You do not have permission to delete patient records.', 'warning');
    setPendingDeletePatientId(patientId);
  };

  const handleConfirmDeletePatient = () => {
    if (!pendingDeletePatientId) return;
    const patientToDelete = patients.find((patient) => patient.id === pendingDeletePatientId);
    const nextPatients = deletePatientDirectoryRecord(pendingDeletePatientId, currentClinic?.id);
    setPatients(nextPatients);
    if (selectedPatientId === pendingDeletePatientId) setSelectedPatientId(null);
    if (editingPatientId === pendingDeletePatientId) {
      setEditingPatientId(null);
      setAddPatientOpen(false);
    }
    setPendingDeletePatientId(null);
    showToast(`${patientToDelete?.name || 'Patient'} deleted successfully.`, 'success');
  };

  const handleSavePatientTags = (patientId: string, tags: string[]) => {
    const nextPatients = patients.map((item) => (
      item.id === patientId ? { ...item, tags } : item
    ));
    setPatients(nextPatients);
    savePatientDirectoryRecords(nextPatients, currentClinic?.id);
  };

  const handleSavePatientRecord = (patientId: string, nextRecord: PatientPreviewItem) => {
    const nextPatients = patients.map((item) => (
      item.id === patientId ? {
        ...nextRecord,
        id: patientId,
        clinicId: currentClinic?.id || item.clinicId,
        clinicName: currentClinic?.name || item.clinicName
      } : item
    ));
    setPatients(nextPatients);
    savePatientDirectoryRecords(nextPatients, currentClinic?.id);
  };

  const handleToggleLastVisitSort = () => {
    setBalanceSort(null);
    setLastVisitSort((current) => (current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc'));
  };

  const handleToggleBalanceSort = () => {
    setLastVisitSort(null);
    setBalanceSort((current) => (current === 'asc' ? 'desc' : current === 'desc' ? null : 'asc'));
  };

  const handleClearFilters = () => {
    setSearchValue('');
    setSelectedFilter('none');
    setSelectedFilterValue('all');
    setSelectedEventDate('');
    setLastVisitSort(null);
    setBalanceSort(null);
    setCurrentPage(1);
  };

  const handleBackToPatients = () => {
    setSelectedPatientId(null);
  };

  const handleCancelAddPatient = () => {
    setAddPatientOpen(false);
    setEditingPatientId(null);
  };

  const nextPatientId = () => {
    const allExisting = loadPatientDirectoryRecords();
    const maxNumericId = allExisting.reduce((max, patient) => {
      const numeric = Number(patient.id.replace(/\D/g, ''));
      return Number.isFinite(numeric) ? Math.max(max, numeric) : max;
    }, 0);
    const nextId = `P${String(maxNumericId + 1).padStart(3, '0')}`;
    purgePatientScopedData(nextId, currentClinic?.id);
    return nextId;
  };

  const handleSavePatient = (form: PatientFormState) => {
    const existing = editingPatientId ? patients.find((patient) => patient.id === editingPatientId) || null : null;
    const savedPatient = buildPatientFromForm(
      form,
      existing,
      nextPatientId(),
      currentClinic?.id,
      currentClinic?.name
    );
    const nextPatients = existing
      ? patients.map((patient) => (patient.id === existing.id ? savedPatient : patient))
      : [savedPatient, ...patients];
    setPatients(nextPatients);
    savePatientDirectoryRecords(nextPatients, currentClinic?.id);
    setAddPatientOpen(false);
    setEditingPatientId(null);
    setCurrentPage(1);
    showToast(existing ? 'Patient record updated.' : 'New patient record added.', 'success');
  };

  const selectedPatient = selectedPatientId ? patientsWithDerivedRemarks.find((patient) => patient.id === selectedPatientId) || null : null;
  const editingPatient = editingPatientId ? patients.find((patient) => patient.id === editingPatientId) || null : null;

  return (
    <div className="clinic-dashboard-page patients-page">
      {!selectedPatient && !addPatientOpen && !editingPatient ? (
        <ClinicPageHeader
          sectionLabel="USER MANAGEMENT"
          title="Patients"
          subtitle="Manage patient information and clinic records."
          date={currentDateLabel}
        />
      ) : null}

      {!addPatientOpen && !selectedPatient && !editingPatient ? (
        <PatientToolbar
          searchValue={searchValue}
          onSearchValueChange={setSearchValue}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedFilter={selectedFilter}
          selectedFilterValue={selectedFilterValue}
          filterValueLabel={filterValueLabel}
          filterOptions={filterOptions}
          activeFilterCount={activeFilterCount}
          selectedEventDate={selectedEventDate}
          selectedEventDateSummary={selectedEventDateSummary}
          onFilterChange={setSelectedFilter}
          onFilterValueChange={setSelectedFilterValue}
          onEventDateChange={setSelectedEventDate}
          onClearFilters={handleClearFilters}
          onAddPatient={handleAddPatient}
        />
      ) : null}

      <section className="clinic-dashboard-panel patients-page__content" aria-label="Patient records">
        {addPatientOpen || editingPatient ? (
          <AddPatientStepper
            mode={editingPatient ? 'edit' : 'add'}
            patient={editingPatient}
            onCancel={handleCancelAddPatient}
            onSave={handleSavePatient}
          />
        ) : selectedPatient ? (
          <PatientRecordView
            patient={selectedPatient}
            onBack={handleBackToPatients}
            onSavePatientTags={handleSavePatientTags}
            onSavePatientRecord={handleSavePatientRecord}
            showToast={showToast}
          />
        ) : filteredPatients.length > 0 ? (
          viewMode === 'table' ? (
            <PatientTable
              patients={paginatedPatients}
              totalPatients={filteredPatients.length}
              currentPage={Math.min(currentPage, totalPages)}
              totalPages={totalPages}
              lastVisitSort={lastVisitSort}
              balanceSort={balanceSort}
              onToggleLastVisitSort={handleToggleLastVisitSort}
              onToggleBalanceSort={handleToggleBalanceSort}
              onPageChange={setCurrentPage}
              onViewRecord={handleViewRecord}
              onEditPatient={canEditPatients ? handleEditPatient : undefined}
              onDeletePatient={canDeletePatients ? handleRequestDeletePatient : undefined}
            />
          ) : (
            <PatientGrid patients={filteredPatients} onViewRecord={handleViewRecord} onDeletePatient={canDeletePatients ? handleRequestDeletePatient : undefined} />
          )
        ) : (
          <PatientEmptyState
            searchValue={searchValue}
            onPrimaryAction={activeFilterCount > 0 || searchValue ? handleClearFilters : handleAddPatient}
            primaryActionLabel={activeFilterCount > 0 || searchValue ? 'Clear Filters' : '+ Add New Patient'}
          />
        )}
      </section>

      <ConfirmationDialog
        open={Boolean(pendingDeletePatientId)}
        title="Delete Patient Record"
        description={`Delete ${patients.find((patient) => patient.id === pendingDeletePatientId)?.name || 'this patient'} from the patients list? This action cannot be undone.`}
        confirmLabel="Delete Patient"
        cancelLabel="Keep Record"
        destructive
        onCancel={() => setPendingDeletePatientId(null)}
        onConfirm={handleConfirmDeletePatient}
      />
    </div>
  );
}

