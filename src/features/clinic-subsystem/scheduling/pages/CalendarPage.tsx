import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  Archive,
  Ban,
  Bell,
  Cake,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  Check,
  CheckSquare,
  ExternalLink,
  Eye,
  Grid2X2,
  List,
  MessageSquare,
  Monitor,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Tag,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { ConfirmationDialog } from '../../../../components/overlays/ConfirmationDialog';
import { Modal } from '../../../../components/overlays/Modal';
import { RowActionMenu } from '../../../../components/overlays/RowActionMenu';
import { removeLinkedAppointmentRecord } from '../../patients/clinical/appointments/appointmentStore';
import type { PatientPreviewItem } from '../../patients/components/patientTypes';
import { emitOpenAddPatient } from '../../patients/shared/addPatientNavigation';
import {
  loadPatientDirectoryRecords,
  PATIENT_DIRECTORY_UPDATED_EVENT
} from '../../patients/shared/patientDirectoryStore';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import {
  CLINIC_SCHEDULES_UPDATED_EVENT,
  buildClinicScheduleRemovalPlan,
  getClinicScheduleItems,
  getLocalDateKey,
  saveClinicScheduleItems
} from '../scheduleStorage';
import type { CalendarScheduleItem, CalendarScheduleType, ScheduleStatus } from '../types';

interface Props {
  currentClinic: any;
  onReturnToDashboard: () => void;
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  canManageAppointments?: boolean;
}

interface CalendarFormState {
  patientName: string;
  title: string;
  dentist: string;
  date: string;
  type: CalendarScheduleType;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  treatmentTag: string;
  notes: string;
}

interface SmsDraftState {
  recipient: string;
  message: string;
}

const typeMeta: Record<CalendarScheduleType, { label: string; color: string; soft: string; icon: ReactNode }> = {
  appointments: {
    label: 'Appointments',
    color: '#4f6df5',
    soft: '#eef2ff',
    icon: <CalendarCheck size={14} aria-hidden="true" />
  },
  recalls: {
    label: 'Recalls',
    color: '#8b5cf6',
    soft: '#f3e8ff',
    icon: <Bell size={14} aria-hidden="true" />
  },
  birthdays: {
    label: 'Birthdays',
    color: '#ef4444',
    soft: '#fff1f2',
    icon: <Cake size={14} aria-hidden="true" />
  },
  events: {
    label: 'Events / Schedules',
    color: '#a855f7',
    soft: '#faf5ff',
    icon: <CalendarRange size={14} aria-hidden="true" />
  },
  online: {
    label: 'Online Bookings',
    color: '#10b981',
    soft: '#ecfdf5',
    icon: <Monitor size={14} aria-hidden="true" />
  },
  google: {
    label: 'Google Calendar',
    color: '#f43f5e',
    soft: '#fff1f2',
    icon: <CalendarDays size={14} aria-hidden="true" />
  }
};

const initialScheduleItems: CalendarScheduleItem[] = [
  {
    id: 'cal-001',
    patientId: 'P009',
    patientName: 'lagsac, angelo',
    title: 'Orthodontic Adjustment',
    date: '2026-08-07',
    time: 'Any time',
    startTime: '',
    endTime: '',
    procedure: 'Orthodontic Adjustment',
    dentist: 'Dr. Maria Jessica Tanarte',
    status: 'Scheduled',
    type: 'recalls',
    treatmentTag: 'cavsu',
    notes: 'Recall linked to progress note NOTE-1783229746877',
    gender: 'Male',
    age: 26,
    birthday: '2000-11-28',
    city: 'Imus'
  },
  {
    id: 'cal-010',
    patientId: 'P018',
    patientName: 'Ana Reyes',
    title: 'Recall Check',
    date: '2026-08-08',
    time: '9:30 AM',
    startTime: '09:30',
    endTime: '10:00',
    procedure: 'Recall Check',
    dentist: 'Dr. Maria Jessica Tanarte',
    status: 'Scheduled',
    type: 'recalls',
    treatmentTag: 'Recall',
    notes: 'Current day schedule shown in Daily Waitlist.',
    gender: 'Female',
    age: 29,
    birthday: '1997-05-14',
    city: 'Imus'
  },
  {
    id: 'cal-002',
    patientId: 'P010',
    patientName: 'Untitled Patient',
    title: 'Untitled Patient Birthday',
    date: '2026-08-05',
    time: 'Any time',
    procedure: 'Patient birthday',
    dentist: '',
    status: 'Scheduled',
    type: 'birthdays',
    notes: 'Patient birthday',
    gender: 'Male',
    age: 26,
    birthday: '2000-08-05',
    city: 'Cavite'
  },
  {
    id: 'cal-003',
    patientId: 'P011',
    patientName: 'Maria Santos',
    title: 'Maria Santos Birthday',
    date: '2026-08-05',
    time: 'Any time',
    procedure: 'Patient birthday',
    dentist: '',
    status: 'Scheduled',
    type: 'birthdays',
    notes: 'Patient birthday',
    gender: 'Female',
    age: 31,
    birthday: '1995-08-05',
    city: 'Makati City'
  },
  {
    id: 'cal-004',
    patientId: 'P012',
    patientName: 'Pedro Reyes',
    title: 'Recall Consultation',
    date: '2026-08-05',
    time: '10:00 AM',
    startTime: '10:00',
    endTime: '10:30',
    procedure: 'Recall Consultation',
    dentist: 'Dr. Maria Jessica Tanarte',
    status: 'Scheduled',
    type: 'recalls',
    treatmentTag: 'Prophylaxis',
    notes: 'Six-month recall appointment.',
    gender: 'Male',
    age: 39,
    birthday: '1987-04-18',
    city: 'Pasig City'
  },
  {
    id: 'cal-005',
    patientId: 'P013',
    patientName: 'Ana Villanueva',
    title: 'Online Cleaning Booking',
    date: '2026-08-05',
    time: '1:30 PM',
    startTime: '13:30',
    endTime: '14:00',
    procedure: 'Online Cleaning Booking',
    dentist: '',
    status: 'Scheduled',
    type: 'online',
    treatmentTag: 'Cleaning',
    notes: 'Patient booked online.',
    gender: 'Female',
    age: 28,
    birthday: '1998-02-11',
    city: 'Taguig City'
  },
  {
    id: 'cal-006',
    patientId: 'P014',
    patientName: 'Carlo Mendoza',
    title: 'Google Calendar Hold',
    date: '2026-08-05',
    time: '2:00 PM',
    startTime: '14:00',
    endTime: '15:00',
    procedure: 'Google Calendar Hold',
    dentist: 'Dr. Maria Jessica Tanarte',
    status: 'Scheduled',
    type: 'google',
    treatmentTag: 'External Calendar',
    notes: 'Imported visual placeholder from Google Calendar.',
    gender: 'Male',
    age: 34,
    birthday: '1992-09-21',
    city: 'Quezon City'
  },
  {
    id: 'cal-007',
    patientId: 'P015',
    patientName: 'Clinic Team',
    title: 'Sterilization Audit',
    date: '2026-08-05',
    time: '4:00 PM',
    startTime: '16:00',
    endTime: '16:30',
    procedure: 'Sterilization Audit',
    dentist: '',
    status: 'Scheduled',
    type: 'events',
    notes: 'Clinic event schedule.',
    city: 'Main Branch'
  },
  {
    id: 'cal-008',
    patientId: 'P016',
    patientName: 'dawadawd, awdawd',
    title: 'Post-Extraction Review',
    date: '2026-08-18',
    time: 'Any time',
    procedure: 'Post-Extraction Review',
    dentist: 'Dr. Maria Jessica Tanarte',
    status: 'Scheduled',
    type: 'recalls',
    notes: 'Recall linked to progress note NOTE-1783236839659',
    gender: 'Male',
    age: 25,
    birthday: '2000-11-28',
    city: 'Imus'
  },
  {
    id: 'cal-009',
    patientId: 'P017',
    patientName: 'Juan Dela Cruz',
    title: 'Dental Consultation',
    date: '2026-08-23',
    time: '9:00 AM',
    startTime: '09:00',
    endTime: '09:45',
    procedure: 'Dental Consultation',
    dentist: 'Dr. Maria Jessica Tanarte',
    status: 'Scheduled',
    type: 'appointments',
    treatmentTag: 'Consultation',
    notes: 'New patient consultation.',
    gender: 'Male',
    age: 34,
    birthday: '1992-02-12',
    city: 'Quezon City'
  }
];

const blankForm: CalendarFormState = {
  patientName: '',
  title: 'Orthodontics Adjustment',
  dentist: '',
  date: '2026-08-07',
  type: 'appointments',
  startTime: '',
  endTime: '',
  status: 'Scheduled',
  treatmentTag: '',
  notes: ''
};

const allTypes = Object.keys(typeMeta) as CalendarScheduleType[];

export function CalendarPage({ currentClinic, onReturnToDashboard: _onReturnToDashboard, showToast, canManageAppointments = true }: Props) {
  const [scheduleItems, setScheduleItems] = useState<CalendarScheduleItem[]>(() => getClinicScheduleItems(initialScheduleItems, currentClinic?.id));
  const [currentMonth, setCurrentMonth] = useState(() => new Date(2026, 7, 1));
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 7, 1));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [layoutMode, setLayoutMode] = useState<'calendar' | 'list'>('calendar');
  const [activeTypes, setActiveTypes] = useState<Record<CalendarScheduleType, boolean>>({
    appointments: true,
    recalls: true,
    birthdays: true,
    events: true,
    online: true,
    google: true
  });
  const [agendaDate, setAgendaDate] = useState<Date | null>(null);
  const [agendaPage, setAgendaPage] = useState(1);
  const [hoveredPatientId, setHoveredPatientId] = useState<string | null>(null);
  const [listPage, setListPage] = useState(1);
  const [formMode, setFormMode] = useState<'new' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CalendarFormState>(blankForm);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [smsItemId, setSmsItemId] = useState<string | null>(null);
  const [smsDraft, setSmsDraft] = useState<SmsDraftState>({ recipient: '', message: '' });
  const [cancelItemId, setCancelItemId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<CalendarScheduleItem | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [integrationState, setIntegrationState] = useState({
    googlePersonal: false,
    googleClinic: false
  });
  const [patientDirectory, setPatientDirectory] = useState<PatientPreviewItem[]>(() => loadPatientDirectoryRecords(currentClinic?.id));

  useEffect(() => {
    setScheduleItems(getClinicScheduleItems(initialScheduleItems, currentClinic?.id));
    setPatientDirectory(loadPatientDirectoryRecords(currentClinic?.id));
  }, [currentClinic?.id]);

  const commitScheduleItems = useCallback((
    updater: CalendarScheduleItem[] | ((currentItems: CalendarScheduleItem[]) => CalendarScheduleItem[])
  ) => {
    setScheduleItems((currentItems) => {
      const nextItems = typeof updater === 'function' ? updater(currentItems) : updater;
      saveClinicScheduleItems(nextItems, currentClinic?.id);
      return nextItems;
    });
  }, [currentClinic?.id]);

  useEffect(() => {
    const handleSchedulesUpdated = () => {
      setScheduleItems(getClinicScheduleItems(initialScheduleItems, currentClinic?.id));
    };
    const handlePatientsUpdated = () => {
      setPatientDirectory(loadPatientDirectoryRecords(currentClinic?.id));
    };

    window.addEventListener(CLINIC_SCHEDULES_UPDATED_EVENT, handleSchedulesUpdated);
    window.addEventListener(PATIENT_DIRECTORY_UPDATED_EVENT, handlePatientsUpdated);
    return () => {
      window.removeEventListener(CLINIC_SCHEDULES_UPDATED_EVENT, handleSchedulesUpdated);
      window.removeEventListener(PATIENT_DIRECTORY_UPDATED_EVENT, handlePatientsUpdated);
    };
  }, [currentClinic?.id]);

  const filteredSchedules = useMemo(
    () => scheduleItems.filter((item) => activeTypes[item.type]),
    [activeTypes, scheduleItems]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarScheduleItem[]>();
    filteredSchedules.forEach((appointment) => {
      const list = map.get(appointment.date) || [];
      list.push(appointment);
      map.set(appointment.date, list);
    });
    return map;
  }, [filteredSchedules]);

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateKey = formatDateKey(selectedDate);
  const dayCells = useMemo(() => buildMonthDays(currentMonth), [currentMonth]);
  const selectedDateItems = eventsByDate.get(selectedDateKey) || [];
  const activeLayout = layoutMode === 'list' ? 'list' : viewMode;
  const detailItem = detailItemId ? scheduleItems.find((item) => item.id === detailItemId) || null : null;
  const noteItem = noteItemId ? scheduleItems.find((item) => item.id === noteItemId) || null : null;
  const smsItem = smsItemId ? scheduleItems.find((item) => item.id === smsItemId) || null : null;
  const cancelItem = cancelItemId ? scheduleItems.find((item) => item.id === cancelItemId) || null : null;

  const goToToday = () => {
    const today = new Date(2026, 7, 1);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  };

  const moveMonth = (delta: number) => {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setAgendaDate(date);
    setAgendaPage(1);
  };

  const toggleType = (type: CalendarScheduleType) => {
    setActiveTypes((current) => ({ ...current, [type]: !current[type] }));
    setAgendaPage(1);
    setListPage(1);
  };

  const openNewAppointment = (type: CalendarScheduleType = 'appointments') => {
    if (!canManageAppointments) {
      showToast('You do not have permission to create appointments or events.', 'warning');
      return;
    }
    setEditingId(null);
    setForm({
      ...blankForm,
      type,
      title: type === 'events' ? 'Clinic Event / Schedule' : 'Orthodontics Adjustment',
      patientName: type === 'events' ? 'Clinic Team' : '',
      notes: type === 'events' ? 'Clinic event schedule.' : ''
    });
    setFormMode('new');
    showToast(type === 'events' ? 'Event / schedule form opened.' : 'New appointment form opened.', 'info');
  };

  const openEditAppointment = (item: CalendarScheduleItem) => {
    setEditingId(item.id);
    setForm({
      patientName: item.patientName,
      title: item.title,
      dentist: item.dentist || 'Dr. Maria Jessica Tanarte',
      date: item.date,
      type: item.type,
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      status: item.status,
      treatmentTag: item.treatmentTag || 'cavsu',
      notes: item.notes || ''
    });
    setFormMode('edit');
    showToast(`Editing ${item.title}.`, 'info');
  };

  const saveAppointment = () => {
    const normalizedDate = normalizeDateInput(form.date);
    if (!normalizedDate) {
      showToast('Please select a valid schedule date.', 'error');
      return;
    }

    if (!form.title.trim()) {
      showToast('Appointment or event title is required.', 'error');
      return;
    }

    if (form.type !== 'events' && !form.patientName.trim()) {
      showToast('Patient / client name is required for appointments.', 'error');
      return;
    }

    if (formMode === 'edit' && editingId) {
      commitScheduleItems((items) => items.map((item) => (
        item.id === editingId
          ? {
              ...item,
              patientName: form.patientName.trim() || item.patientName,
              title: form.title || item.title,
              procedure: form.title || item.procedure,
              dentist: form.dentist,
              date: normalizedDate,
              time: formatTimeRange(form.startTime, form.endTime),
              startTime: form.startTime,
              endTime: form.endTime,
              status: form.status,
              type: form.type,
              treatmentTag: form.treatmentTag,
              notes: form.notes
          }
          : item
      )));
      showToast('Calendar schedule updated.', 'success');
    } else {
      const date = normalizedDate;
      commitScheduleItems((items) => [
        ...items,
        {
          id: `cal-${Date.now()}`,
          clinicId: currentClinic?.id,
          clinicName: currentClinic?.name,
          patientId: `TMP-${items.length + 1}`,
          patientName: form.patientName.trim() || (form.type === 'events' ? 'Clinic Team' : 'Untitled Patient'),
          title: form.title || 'Untitled Appointment',
          date,
          time: formatTimeRange(form.startTime, form.endTime),
          startTime: form.startTime,
          endTime: form.endTime,
          procedure: form.title || 'Untitled Appointment',
          dentist: form.dentist,
          status: form.status,
          type: form.type,
          treatmentTag: form.treatmentTag,
          notes: form.notes || 'Notes, reason, or preparation reminders',
          city: 'Not specified'
        }
      ]);
      setSelectedDate(parseDateKey(date));
      setCurrentMonth(new Date(parseDateKey(date).getFullYear(), parseDateKey(date).getMonth(), 1));
      showToast(form.type === 'events' ? 'Clinic event / schedule created.' : 'New appointment created.', 'success');
    }
    setFormMode(null);
    setEditingId(null);
  };

  const archiveAppointment = () => {
    setArchiveConfirmOpen(true);
  };

  const confirmArchiveAppointment = () => {
    if (editingId) {
      commitScheduleItems((items) => items.filter((item) => item.id !== editingId));
      showToast('Calendar schedule archived.', 'success');
    }
    setArchiveConfirmOpen(false);
    setFormMode(null);
    setEditingId(null);
  };

  const refreshCalendar = () => {
    const latestItems = getClinicScheduleItems(initialScheduleItems);
    setScheduleItems(latestItems);
    setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate()));
    setAgendaDate(null);
    setListPage(1);
    showToast('Calendar refreshed.', 'success');
  };

  const updateScheduleItem = (itemId: string, updater: (item: CalendarScheduleItem) => CalendarScheduleItem) => {
    commitScheduleItems((items) => items.map((item) => (item.id === itemId ? updater(item) : item)));
  };

  const openViewAppointment = (item: CalendarScheduleItem) => {
    setDetailItemId(item.id);
  };

  const openNoteModal = (item: CalendarScheduleItem) => {
    setNoteItemId(item.id);
    setNoteDraft(item.notes || '');
  };

  const saveNoteModal = () => {
    if (!noteItem) return;
    updateScheduleItem(noteItem.id, (item) => ({
      ...item,
      notes: noteDraft.trim() || item.notes || 'No note added.'
    }));
    setNoteItemId(null);
    setNoteDraft('');
    showToast('Appointment note updated.', 'success');
  };

  const openSmsModal = (item: CalendarScheduleItem) => {
    setSmsItemId(item.id);
    setSmsDraft({
      recipient: item.patientName || 'Patient',
      message: `Reminder: ${item.title} on ${item.date} at ${item.time || 'Any time'}. ${item.notes || ''}`.trim()
    });
  };

  const sendSmsMessage = () => {
    if (!smsItem) return;
    if (!smsDraft.message.trim()) {
      showToast('Please enter an SMS reminder message.', 'error');
      return;
    }
    updateScheduleItem(smsItem.id, (item) => ({
      ...item,
      notes: `${item.notes ? `${item.notes} ` : ''}[SMS sent ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}]`.trim()
    }));
    setSmsItemId(null);
    showToast(`SMS reminder prepared for ${smsDraft.recipient}.`, 'success');
  };

  const requestCancelAppointment = (item: CalendarScheduleItem) => {
    setCancelItemId(item.id);
  };

  const confirmCancelAppointment = () => {
    if (!cancelItem) return;
    updateScheduleItem(cancelItem.id, (item) => ({
      ...item,
      status: 'Cancelled',
      notes: `${item.notes ? `${item.notes} ` : ''}[Cancelled on ${new Date().toLocaleDateString('en-US')}]`.trim()
    }));
    setCancelItemId(null);
    showToast('Appointment cancelled.', 'warning');
  };

  const requestDeleteAppointment = (item: CalendarScheduleItem) => {
    setDeleteItem(item);
  };

  const confirmDeleteAppointment = () => {
    if (!deleteItem) return;
    const targetId = deleteItem.id;
    const { nextItems, removedCount: removedCalendarCount } = buildClinicScheduleRemovalPlan(scheduleItems, deleteItem);
    let removedLinkedAppointmentCount = 0;

    if (deleteItem.source === 'progress-note-recall' && deleteItem.patientId) {
      removedLinkedAppointmentCount = removeLinkedAppointmentRecord(deleteItem.patientId, {
        appointmentId: deleteItem.linkedAppointmentId,
        sourceId: deleteItem.sourceId
      });
    }

    saveClinicScheduleItems(nextItems);
    setScheduleItems(nextItems);
    setDetailItemId((current) => (current === targetId ? null : current));
    setDeleteItem(null);
    setHoveredPatientId(null);

    if (agendaDate && deleteItem.date === formatDateKey(agendaDate)) {
      const remainingVisibleCount = nextItems.filter((item) => item.date === deleteItem.date && activeTypes[item.type]).length;
      if (remainingVisibleCount === 0) {
        setAgendaDate(null);
      } else {
        setAgendaPage((current) => Math.min(current, Math.max(1, Math.ceil(remainingVisibleCount / 3))));
      }
    }

    const summaryParts = [
      removedCalendarCount > 0
        ? `${removedCalendarCount} calendar entr${removedCalendarCount === 1 ? 'y' : 'ies'} deleted`
        : null,
      removedLinkedAppointmentCount > 0
        ? `${removedLinkedAppointmentCount} linked appointment entr${removedLinkedAppointmentCount === 1 ? 'y' : 'ies'} removed`
        : null
    ].filter(Boolean);

    showToast(
      summaryParts.length > 0
        ? `Cancelled appointment deleted. ${summaryParts.join('. ')}.`
        : 'Cancelled appointment deleted.',
      'success'
    );
  };

  const openCalendarInNewTab = (item: CalendarScheduleItem) => {
    const target = `${window.location.origin}/clinic/${currentClinic?.id}/calendar#${item.id}`;
    window.open(target, '_blank', 'noopener,noreferrer');
    showToast('Calendar opened in a new tab.', 'success');
  };

  const toggleIntegration = (field: 'googlePersonal' | 'googleClinic') => {
    setIntegrationState((current) => {
      const nextValue = !current[field];
      showToast(
        nextValue
          ? field === 'googlePersonal'
            ? 'Personal Google Calendar sync is enabled in prototype mode.'
            : 'Clinic Google Calendar sync is enabled in prototype mode.'
          : field === 'googlePersonal'
            ? 'Personal Google Calendar sync is disabled.'
            : 'Clinic Google Calendar sync is disabled.',
        nextValue ? 'success' : 'info'
      );
      return { ...current, [field]: nextValue };
    });
  };

  return (
    <div className="scheduling-calendar">
      <section className="clinic-dashboard-panel scheduling-calendar__hero">
        <div>
          <span className="clinic-page-header__eyebrow">Clinic Calendar</span>
          <h2>Clinic Appointments</h2>
          <p>Manage clinic appointments.</p>
        </div>

        <div className="scheduling-calendar__hero-actions">
          <div className="scheduling-calendar__mode-switch" role="group" aria-label="Calendar display mode">
            <button
              type="button"
              className={`scheduling-calendar__mode-btn ${layoutMode === 'calendar' ? 'is-active' : ''}`}
              onClick={() => setLayoutMode('calendar')}
            >
              <Grid2X2 size={14} aria-hidden="true" />
              Calendar
            </button>
            <button
              type="button"
              className={`scheduling-calendar__mode-btn ${layoutMode === 'list' ? 'is-active' : ''}`}
              onClick={() => setLayoutMode('list')}
            >
              <List size={14} aria-hidden="true" />
              List
            </button>
          </div>

          {canManageAppointments ? <button type="button" className="btn btn-primary scheduling-calendar__action-btn" onClick={() => openNewAppointment('appointments')}>
            <Plus size={16} aria-hidden="true" />
            New Appointment
          </button> : null}
          {canManageAppointments ? <button type="button" className="btn scheduling-calendar__action-btn scheduling-calendar__action-btn--events" onClick={() => openNewAppointment('events')}>
            <CalendarDays size={15} aria-hidden="true" />
            Events/Schedules
          </button> : null}
          <button type="button" className="btn btn-outline scheduling-calendar__action-btn" onClick={refreshCalendar}>
            <RefreshCw size={15} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </section>

      <div className="clinic-dashboard-panel scheduling-calendar__toolbar">
        <CalendarHeader
          monthLabel={monthLabel}
          onPreviousMonth={() => moveMonth(-1)}
          onNextMonth={() => moveMonth(1)}
          onToday={goToToday}
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            if (mode === 'list') setLayoutMode('calendar');
          }}
        />
      </div>

      <div className="scheduling-calendar__workspace">
        <aside className="scheduling-calendar__filters" aria-label="Calendar filters">
          <CalendarFilterCard
            icon={<Users size={16} aria-hidden="true" />}
            title="Associates"
          >
            <p className="scheduling-calendar__empty-copy">Associates can be assigned in a future configuration phase.</p>
          </CalendarFilterCard>

          <CalendarFilterCard
            icon={<Tag size={16} aria-hidden="true" />}
            title="Type Legend"
          >
            {allTypes.map((type) => (
              <CalendarLegendCheckbox
                key={type}
                type={type}
                checked={activeTypes[type]}
                onChange={() => toggleType(type)}
              />
            ))}
          </CalendarFilterCard>

          <CalendarFilterCard
            icon={<CheckSquare size={16} aria-hidden="true" />}
            title="Integrations"
          >
            <CalendarCheckbox
              label="Sync My Schedule with Google Calendar"
              compact
              checked={integrationState.googlePersonal}
              onChange={() => toggleIntegration('googlePersonal')}
            />
            <CalendarCheckbox
              label="Sync Entire Clinic Schedule with Google Calendar"
              compact
              checked={integrationState.googleClinic}
              onChange={() => toggleIntegration('googleClinic')}
            />
            <p className="scheduling-calendar__integration-note">
              Google Calendar controls are UI-ready and do not connect to an external account yet.
            </p>
          </CalendarFilterCard>
        </aside>

        <section className="scheduling-calendar__grid-card" aria-label={`${monthLabel} clinic calendar`}>
          {activeLayout === 'month' && (
            <CalendarGrid
              days={dayCells}
              eventsByDate={eventsByDate}
              onDateSelect={handleSelectDate}
              selectedDateKey={selectedDateKey}
            />
          )}

          {activeLayout === 'week' && (
            <CalendarWeekView
              selectedDate={selectedDate}
              eventsByDate={eventsByDate}
              onDateSelect={handleSelectDate}
              onEdit={openEditAppointment}
            />
          )}

          {activeLayout === 'day' && (
            <CalendarDayView
              date={selectedDate}
              items={selectedDateItems}
              onNew={() => openNewAppointment('appointments')}
              onEdit={openEditAppointment}
            />
          )}

          {activeLayout === 'list' && (
            <CalendarListView
              items={filteredSchedules}
              page={listPage}
              onPageChange={setListPage}
              onEdit={openEditAppointment}
            />
          )}
        </section>
      </div>

      {agendaDate && (
        <AgendaModal
          date={agendaDate}
          items={eventsByDate.get(formatDateKey(agendaDate)) || []}
          page={agendaPage}
          hoveredPatientId={hoveredPatientId}
          onPageChange={setAgendaPage}
          onClose={() => setAgendaDate(null)}
          onHoverPatient={setHoveredPatientId}
          onEdit={openEditAppointment}
          onView={openViewAppointment}
          onAddNote={openNoteModal}
          onSendSms={openSmsModal}
          onCancelAppointment={requestCancelAppointment}
          onDeleteAppointment={requestDeleteAppointment}
          onOpenInNewTab={openCalendarInNewTab}
        />
      )}

      {formMode && (
        <AppointmentFormModal
          mode={formMode}
          form={form}
          patientDirectory={patientDirectory}
          onChange={setForm}
          onClose={() => setFormMode(null)}
          onSave={saveAppointment}
          onArchive={archiveAppointment}
        />
      )}

      {detailItem ? (
        <Modal
          open={true}
          title="View Appointment"
          description="Review the selected calendar schedule details."
          width="md"
          onClose={() => setDetailItemId(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setDetailItemId(null)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={() => {
                setDetailItemId(null);
                openEditAppointment(detailItem);
              }}>
                <Pencil size={14} aria-hidden="true" />
                Edit Appointment
              </button>
            </>
          )}
        >
          <div className="appointment-details-panel">
            <div className="appointment-details-panel__header">
              <strong>{detailItem.title}</strong>
              <span className="appointment-details-panel__status">{detailItem.status}</span>
            </div>
            <div className="appointment-details-panel__grid">
              <DetailField label="Patient / Event" value={detailItem.patientName || 'Untitled Patient'} />
              <DetailField label="Appointment ID" value={detailItem.id} />
              <DetailField label="Date" value={formatShortDate(parseDateKey(detailItem.date))} />
              <DetailField label="Time" value={detailItem.time || 'Any time'} />
              <DetailField label="Type" value={typeMeta[detailItem.type].label} />
              <DetailField label="Dentist / Associate" value={detailItem.dentist || 'Dentist not assigned'} />
              <DetailField label="Treatment Tag" value={detailItem.treatmentTag || '-'} />
              <DetailField label="Notes" value={detailItem.notes || detailItem.procedure || 'No notes recorded.'} />
            </div>
          </div>
        </Modal>
      ) : null}

      {noteItem ? (
        <Modal
          open={true}
          title="Add Note"
          description={`Update note for ${noteItem.title}.`}
          width="md"
          onClose={() => setNoteItemId(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setNoteItemId(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveNoteModal}>
                <Save size={14} aria-hidden="true" />
                Save Note
              </button>
            </>
          )}
        >
          <label className="calendar-field calendar-field--full">
            <span>Appointment Note</span>
            <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add scheduling note, chair prep, or front-desk reminder..." />
          </label>
        </Modal>
      ) : null}

      {smsItem ? (
        <Modal
          open={true}
          title="Send SMS"
          description={`Prepare a reminder for ${smsItem.patientName || 'this patient'}.`}
          width="md"
          onClose={() => setSmsItemId(null)}
          footer={(
            <>
              <button type="button" className="btn btn-outline" onClick={() => setSmsItemId(null)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={sendSmsMessage}>
                <Send size={14} aria-hidden="true" />
                Send Reminder
              </button>
            </>
          )}
        >
          <div className="calendar-modal-form-grid">
            <label className="calendar-field">
              <span>Recipient</span>
              <input value={smsDraft.recipient} onChange={(event) => setSmsDraft((current) => ({ ...current, recipient: event.target.value }))} />
            </label>
            <label className="calendar-field calendar-field--full">
              <span>Message</span>
              <textarea value={smsDraft.message} onChange={(event) => setSmsDraft((current) => ({ ...current, message: event.target.value }))} placeholder="Enter reminder message..." />
            </label>
          </div>
        </Modal>
      ) : null}

      <ConfirmationDialog
        open={Boolean(cancelItem)}
        title="Cancel Appointment"
        description={cancelItem ? `Cancel "${cancelItem.title}" for ${cancelItem.patientName || 'this patient'} on ${formatShortDate(parseDateKey(cancelItem.date))}?` : 'Cancel this appointment?'}
        confirmLabel="Cancel Appointment"
        cancelLabel="Keep Schedule"
        destructive
        onCancel={() => {
          setCancelItemId(null);
          showToast('Appointment cancellation dismissed.', 'info');
        }}
        onConfirm={confirmCancelAppointment}
      />

      <ConfirmationDialog
        open={Boolean(deleteItem)}
        title="Delete Appointment"
        description={deleteItem ? `Delete cancelled appointment "${deleteItem.title}" for ${deleteItem.patientName || 'this patient'} on ${formatShortDate(parseDateKey(deleteItem.date))}? This cannot be undone.` : 'Delete this cancelled appointment?'}
        confirmLabel="Delete Appointment"
        cancelLabel="Keep Record"
        destructive
        onCancel={() => {
          setDeleteItem(null);
          showToast('Appointment delete dismissed.', 'info');
        }}
        onConfirm={confirmDeleteAppointment}
      />

      <ConfirmationDialog
        open={archiveConfirmOpen}
        title="Archive Schedule"
        description="This schedule record will be removed from the clinic calendar. This action cannot be undone."
        confirmLabel="Archive Record"
        cancelLabel="Keep Record"
        destructive
        onCancel={() => setArchiveConfirmOpen(false)}
        onConfirm={confirmArchiveAppointment}
      />
    </div>
  );
}

function CalendarFilterCard({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <section className="scheduling-calendar__filter-card">
      <h3>
        {icon}
        {title}
      </h3>
      <div className="scheduling-calendar__filter-stack">
        {children}
      </div>
    </section>
  );
}

function CalendarCheckbox({
  label,
  compact = false,
  checked = false,
  onChange
}: {
  label: string;
  compact?: boolean;
  checked?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className={`scheduling-calendar__checkbox ${compact ? 'is-compact' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

function CalendarLegendCheckbox({
  checked,
  onChange,
  type
}: {
  checked: boolean;
  onChange: () => void;
  type: CalendarScheduleType;
}) {
  const meta = typeMeta[type];

  return (
    <label className="scheduling-calendar__legend-checkbox">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="scheduling-calendar__legend-swatch" style={{ '--legend-color': meta.color } as CSSProperties}>
        {meta.icon}
      </span>
      <span>{meta.label}</span>
    </label>
  );
}

function AgendaModal({
  date,
  hoveredPatientId,
  items,
  onClose,
  onEdit,
  onView,
  onAddNote,
  onSendSms,
  onCancelAppointment,
  onDeleteAppointment,
  onOpenInNewTab,
  onHoverPatient,
  onPageChange,
  page
}: {
  date: Date;
  hoveredPatientId: string | null;
  items: CalendarScheduleItem[];
  onClose: () => void;
  onEdit: (item: CalendarScheduleItem) => void;
  onView: (item: CalendarScheduleItem) => void;
  onAddNote: (item: CalendarScheduleItem) => void;
  onSendSms: (item: CalendarScheduleItem) => void;
  onCancelAppointment: (item: CalendarScheduleItem) => void;
  onDeleteAppointment: (item: CalendarScheduleItem) => void;
  onOpenInNewTab: (item: CalendarScheduleItem) => void;
  onHoverPatient: (id: string | null) => void;
  onPageChange: (page: number) => void;
  page: number;
}) {
  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visibleItems = items.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div className="calendar-modal-backdrop" role="presentation">
      <section className="calendar-agenda-modal" role="dialog" aria-modal="true" aria-label={`Agenda for ${formatLongDate(date)}`}>
        <header className="calendar-agenda-modal__header">
          <div className="calendar-agenda-modal__title-wrap">
            <span className="calendar-agenda-modal__icon"><CalendarDays size={18} aria-hidden="true" /></span>
            <div>
              <h3>Agenda for {formatLongDate(date)}</h3>
              <p>Visible schedules based on the active filters.</p>
            </div>
          </div>
          <button type="button" className="calendar-modal__close" onClick={onClose} aria-label="Close agenda">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="calendar-agenda-modal__body">
          {visibleItems.length === 0 ? (
            <div className="calendar-agenda-modal__empty">No visible schedules for this date.</div>
          ) : (
            visibleItems.map((item) => (
              <article key={item.id} className="calendar-agenda-card">
                <div className="calendar-agenda-card__chips">
                  <span className="calendar-chip calendar-chip--neutral">{item.time || 'Any time'}</span>
                  <span
                    className="calendar-chip"
                    style={{ '--chip-color': typeMeta[item.type].color, '--chip-bg': typeMeta[item.type].soft } as CSSProperties}
                  >
                    {typeMeta[item.type].icon}
                    {typeMeta[item.type].label}
                  </span>
                  <span className="calendar-chip calendar-chip--scheduled">{item.status}</span>
                  <div className="calendar-agenda-card__menu-wrap">
                    <RowActionMenu
                      ariaLabel={`Actions for ${item.title}`}
                      items={[
                        { id: 'view', label: 'View Appointment', icon: Eye, onSelect: () => onView(item) },
                        { id: 'edit', label: 'Edit Appointment', icon: Pencil, onSelect: () => onEdit(item) },
                        { id: 'note', label: 'Add Note', icon: MessageSquare, onSelect: () => onAddNote(item) },
                        { id: 'sms', label: 'Send SMS', icon: Send, onSelect: () => onSendSms(item) },
                        { id: 'cancel', label: 'Cancel Appointment', icon: Ban, destructive: true, onSelect: () => onCancelAppointment(item) },
                        { id: 'delete', label: 'Delete Appointment', icon: Trash2, destructive: true, hidden: item.status !== 'Cancelled', onSelect: () => onDeleteAppointment(item) },
                        { id: 'new-tab', label: 'Open in New Tab', icon: ExternalLink, onSelect: () => onOpenInNewTab(item) }
                      ]}
                    />
                  </div>
                </div>

                <div className="calendar-agenda-card__content">
                  <div className="calendar-agenda-card__name-wrap">
                    <button
                      type="button"
                      className="calendar-agenda-card__name"
                      onMouseEnter={() => onHoverPatient(item.id)}
                      onMouseLeave={() => onHoverPatient(null)}
                    >
                      {item.patientName || 'Untitled Patient'}
                    </button>
                    {hoveredPatientId === item.id && <PatientHoverCard item={item} />}
                  </div>
                  <p>{item.dentist || 'Dentist not assigned'}</p>
                  <div className="calendar-agenda-card__note">{item.notes || item.procedure}</div>
                </div>
              </article>
            ))
          )}
        </div>

        <footer className="calendar-agenda-modal__footer">
          <AgendaPagination page={safePage} totalPages={totalPages} onPageChange={onPageChange} />
          <button type="button" className="calendar-agenda-modal__done" onClick={onClose}>Done</button>
        </footer>
      </section>
    </div>
  );
}

function PatientHoverCard({ item }: { item: CalendarScheduleItem }) {
  return (
    <div className="calendar-patient-popover">
      <h4>{item.patientName || 'Untitled Patient'}</h4>
      <dl>
        <div>
          <dt>Age</dt>
          <dd>{item.age ? `${item.age} years old` : 'N/A'}</dd>
        </div>
        <div>
          <dt>Sex</dt>
          <dd>{item.gender || 'N/A'}</dd>
        </div>
        <div>
          <dt>Birthday</dt>
          <dd>{item.birthday || 'N/A'}</dd>
        </div>
        <div>
          <dt>City lived</dt>
          <dd>{item.city || 'N/A'}</dd>
        </div>
      </dl>
      <p>{item.dentist || 'Dentist not assigned'}</p>
      <span>{item.notes || item.procedure}</span>
    </div>
  );
}

function AgendaPagination({
  onPageChange,
  page,
  totalPages
}: {
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return <span className="calendar-agenda-modal__page-copy">Page 1 of 1</span>;

  return (
    <div className="calendar-agenda-pagination">
      <button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Prev</button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
    </div>
  );
}

function CalendarWeekView({
  eventsByDate,
  onDateSelect,
  onEdit,
  selectedDate
}: {
  eventsByDate: Map<string, CalendarScheduleItem[]>;
  onDateSelect: (date: Date) => void;
  onEdit: (item: CalendarScheduleItem) => void;
  selectedDate: Date;
}) {
  const week = buildWeekDays(selectedDate);

  return (
    <div className="calendar-week-view">
      {week.map((day) => {
        const key = formatDateKey(day);
        const items = eventsByDate.get(key) || [];

        return (
          <section key={key} className="calendar-week-view__day">
            <button type="button" className="calendar-week-view__header" onClick={() => onDateSelect(day)}>
              <span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <strong>{day.getDate()}</strong>
            </button>
            <div className="calendar-week-view__items">
              {items.length === 0 ? (
                <div className="calendar-week-view__empty">No records</div>
              ) : (
                items.map((item) => <CalendarMiniCard key={item.id} item={item} onEdit={() => onEdit(item)} />)
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function CalendarDayView({
  date,
  items,
  onEdit,
  onNew
}: {
  date: Date;
  items: CalendarScheduleItem[];
  onEdit: (item: CalendarScheduleItem) => void;
  onNew: () => void;
}) {
  return (
    <section className="calendar-day-view">
      <div className="calendar-day-view__header">
        <div>
          <h3>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</h3>
          <p>{items.length} scheduled item{items.length === 1 ? '' : 's'}</p>
        </div>
        <button type="button" className="btn btn-primary scheduling-calendar__action-btn" onClick={onNew}>
          <Plus size={15} aria-hidden="true" />
          Book Schedule
        </button>
      </div>
      <div className="calendar-day-view__list">
        {items.length === 0 ? (
          <div className="calendar-week-view__empty">No records</div>
        ) : (
          items.map((item) => <CalendarScheduleCard key={item.id} item={item} onEdit={() => onEdit(item)} />)
        )}
      </div>
    </section>
  );
}

function CalendarListView({
  items,
  onEdit,
  onPageChange,
  page
}: {
  items: CalendarScheduleItem[];
  onEdit: (item: CalendarScheduleItem) => void;
  onPageChange: (page: number) => void;
  page: number;
}) {
  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);
  const visibleItems = items
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <section className="calendar-list-view">
      <div className="calendar-list-view__table">
        <div className="calendar-list-view__row calendar-list-view__row--head">
          <span>Date</span>
          <span>Time</span>
          <span>Patient / Event</span>
          <span>Associate</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {visibleItems.length === 0 ? (
          <div className="calendar-list-view__empty">No visible schedules for the active filters.</div>
        ) : (
          visibleItems.map((item) => (
            <div key={item.id} className="calendar-list-view__row">
              <strong>{formatShortDate(parseDateKey(item.date))}</strong>
              <span>{item.time || 'Any time'}</span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.patientName}</p>
                <small>{item.notes}</small>
              </div>
              <span>{item.dentist || '-'}</span>
              <div className="calendar-list-view__chips">
                <span className="calendar-chip" style={{ '--chip-color': typeMeta[item.type].color, '--chip-bg': typeMeta[item.type].soft } as CSSProperties}>
                  {typeMeta[item.type].label}
                </span>
                <span className="calendar-chip calendar-chip--scheduled">{item.status}</span>
              </div>
              <button type="button" className="calendar-list-view__edit" onClick={() => onEdit(item)}>
                <Pencil size={14} aria-hidden="true" />
                Edit
              </button>
            </div>
          ))
        )}
      </div>
      <div className="calendar-list-view__footer">
        <span>Showing {items.length === 0 ? 0 : (safePage - 1) * perPage + 1}-{Math.min(safePage * perPage, items.length)} of {items.length}</span>
        <AgendaPagination page={safePage} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
    </section>
  );
}

function CalendarMiniCard({ item, onEdit }: { item: CalendarScheduleItem; onEdit: () => void }) {
  return (
    <button type="button" className="calendar-mini-card" onClick={onEdit}>
      <span>{item.time || 'Any time'}</span>
      <strong>{item.title}</strong>
      <small>{item.patientName}</small>
    </button>
  );
}

function CalendarScheduleCard({ item, onEdit }: { item: CalendarScheduleItem; onEdit: () => void }) {
  return (
    <article className="calendar-schedule-card">
      <div>
        <div className="calendar-schedule-card__chips">
          <span className="calendar-chip calendar-chip--neutral">{item.time || 'Any time'}</span>
          <span className="calendar-chip" style={{ '--chip-color': typeMeta[item.type].color, '--chip-bg': typeMeta[item.type].soft } as CSSProperties}>
            {typeMeta[item.type].icon}
            {typeMeta[item.type].label}
          </span>
          <span className="calendar-chip calendar-chip--scheduled">{item.status}</span>
        </div>
        <h4>{item.title}</h4>
        <p>{item.patientName}</p>
        <small>{item.notes}</small>
      </div>
      <div className="calendar-schedule-card__dentist">{item.dentist || 'Dentist not assigned'}</div>
      <button type="button" className="calendar-list-view__edit" onClick={onEdit}>
        <Pencil size={14} aria-hidden="true" />
        Edit
      </button>
    </article>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="calendar-detail-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AppointmentFormModal({
  form,
  mode,
  patientDirectory,
  onArchive,
  onChange,
  onClose,
  onSave
}: {
  form: CalendarFormState;
  mode: 'new' | 'edit';
  patientDirectory: PatientPreviewItem[];
  onArchive: () => void;
  onChange: (form: CalendarFormState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const [patientQuery, setPatientQuery] = useState(form.patientName);
  const [patientAutocompleteOpen, setPatientAutocompleteOpen] = useState(false);

  useEffect(() => {
    setPatientQuery(form.patientName);
  }, [form.patientName]);

  const update = (field: keyof CalendarFormState, value: string) => {
    onChange({ ...form, [field]: value });
  };

  const matchingPatients = useMemo(() => {
    const needle = patientQuery.trim().toLowerCase();
    if (!needle) return [];

    return patientDirectory
      .filter((patient) => {
        const haystack = [
          patient.name,
          patient.id,
          patient.contact,
          patient.mobileNumber,
          patient.address,
          patient.city
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .slice(0, 6);
  }, [patientDirectory, patientQuery]);

  const handleSelectPatient = (patient: PatientPreviewItem) => {
    setPatientQuery(patient.name);
    setPatientAutocompleteOpen(false);
    onChange({
      ...form,
      patientName: patient.name,
      dentist: form.dentist || patient.attendingDoctor || '',
      treatmentTag: form.treatmentTag || patient.tags?.[0] || ''
    });
  };

  return (
    <div className="calendar-modal-backdrop" role="presentation">
      <section className="calendar-appointment-modal" role="dialog" aria-modal="true" aria-label={mode === 'new' ? 'New Appointment' : 'Edit Appointment'}>
        <header className="calendar-appointment-modal__header">
          <span className="calendar-agenda-modal__icon"><CalendarDays size={18} aria-hidden="true" /></span>
          <div>
            <h3>{mode === 'new' ? 'New Appointment' : 'Edit Appointment'}</h3>
            <p>Schedule dental consultations, recalls, and clinic events.</p>
          </div>
          <button type="button" className="calendar-modal__close" onClick={onClose} aria-label="Close appointment form">
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <div className="calendar-appointment-modal__body">
          <label className="calendar-field calendar-field--wide calendar-field--patient-search">
            <span className="calendar-field__label-row">
              <span>Patient / Client Name</span>
              <button
                type="button"
                className="calendar-quick-register"
                onClick={() => {
                  setPatientAutocompleteOpen(false);
                  onClose();
                  emitOpenAddPatient();
                }}
              >
                Quick Register New Patient
              </button>
            </span>
            <div className="calendar-search-field-wrap">
              <div className="calendar-search-field">
                <Search size={15} aria-hidden="true" />
                <input
                value={patientQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setPatientQuery(value);
                  setPatientAutocompleteOpen(true);
                  update('patientName', value);
                }}
                onFocus={() => setPatientAutocompleteOpen(true)}
                onBlur={() => {
                  window.setTimeout(() => setPatientAutocompleteOpen(false), 120);
                }}
                placeholder="Search patient"
              />
              </div>
            {patientAutocompleteOpen && matchingPatients.length > 0 ? (
              <div className="calendar-patient-suggestion-list">
                {matchingPatients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    className="calendar-patient-suggestion"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSelectPatient(patient);
                    }}
                  >
                    <strong>{patient.name}</strong>
                    <small>{patient.id} • {patient.contact || patient.mobileNumber || patient.city || 'Patient record'}</small>
                  </button>
                ))}
              </div>
            ) : null}
            </div>
          </label>

          <label className="calendar-field">
            <span>Date</span>
            <input type="date" value={normalizeDateInput(form.date)} onChange={(event) => update('date', event.target.value)} />
          </label>

          <label className="calendar-field">
            <span>Type</span>
            <select value={form.type} onChange={(event) => update('type', event.target.value)}>
              {allTypes.map((type) => <option key={type} value={type}>{typeMeta[type].label}</option>)}
            </select>
          </label>

          <label className="calendar-field calendar-field--wide">
            <span>Appointment / Event Title</span>
            <input value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="Orthodontics Adjustment" />
          </label>

          <label className="calendar-field">
            <span>Start Time</span>
            <input type="time" value={form.startTime} onChange={(event) => update('startTime', event.target.value)} />
          </label>

          <label className="calendar-field">
            <span>End Time</span>
            <input type="time" value={form.endTime} onChange={(event) => update('endTime', event.target.value)} />
          </label>

          <label className="calendar-field">
            <span>Status</span>
            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
              {(['Scheduled', 'Confirmed', 'Waiting', 'In Treatment', 'Completed', 'Cancelled', 'No Show'] as ScheduleStatus[]).map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>

          <label className="calendar-field calendar-field--wide">
            <span>Dentist / Associate</span>
            <select value={form.dentist} onChange={(event) => update('dentist', event.target.value)}>
              <option value="">Select associate</option>
              <option value="Dr. Maria Jessica Tanarte">Dr. Maria Jessica Tanarte</option>
            </select>
          </label>

          <label className="calendar-field">
            <span>Treatment Tag</span>
            <input value={form.treatmentTag} onChange={(event) => update('treatmentTag', event.target.value)} placeholder="Orthodontics / Prophylaxis / Surgery" />
          </label>

          <label className="calendar-field calendar-field--full">
            <span>Clinical Notes / Reason</span>
            <textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} placeholder="Notes, reason, or preparation reminders" />
          </label>
        </div>

        <footer className="calendar-appointment-modal__footer">
          {mode === 'edit' && (
            <button type="button" className="calendar-archive-btn" onClick={onArchive}>
              <Archive size={15} aria-hidden="true" />
              Archive
            </button>
          )}
          <div className="calendar-appointment-modal__footer-actions">
            <button type="button" className="calendar-cancel-btn" onClick={onClose}>
              <X size={15} aria-hidden="true" />
              Cancel
            </button>
            <button type="button" className="calendar-save-btn" onClick={onSave}>
              {mode === 'new' ? <Save size={15} aria-hidden="true" /> : <Check size={15} aria-hidden="true" />}
              {mode === 'new' ? 'Save Appointment' : 'Save Changes'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function buildMonthDays(currentMonth: Date) {
  const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const startOffset = start.getDay();
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startOffset);

  return Array.from({ length: 42 }).map((_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return {
      date,
      isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
      key: formatDateKey(date)
    };
  });
}

function buildWeekDays(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

function formatDateKey(date: Date) {
  return getLocalDateKey(date);
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function normalizeDateInput(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '2026-08-07';
  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

function formatTimeRange(startTime?: string, endTime?: string) {
  if (!startTime && !endTime) return 'Any time';
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime || 'Any time';
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).toUpperCase();
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
