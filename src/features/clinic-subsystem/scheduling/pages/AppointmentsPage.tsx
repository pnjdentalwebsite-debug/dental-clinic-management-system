import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  PencilLine,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserRound,
  XCircle
} from 'lucide-react';
import { ClinicPageHeader } from '../../components/ClinicPageHeader';
import { AppointmentToolbar } from '../components/appointments/AppointmentToolbar';
import { AppointmentTable } from '../components/appointments/AppointmentTable';
import { AppointmentDetailsPanel } from '../components/appointments/AppointmentDetailsPanel';
import { AppointmentConfirmationDialog } from '../components/appointments/AppointmentConfirmationDialog';
import {
  CLINIC_SCHEDULES_UPDATED_EVENT,
  getClinicScheduleItems,
  saveClinicScheduleItems
} from '../scheduleStorage';
import type { CalendarScheduleItem, ScheduleAppointment, ScheduleStatus } from '../types';
import type { AppointmentStatusHistoryEntry } from '../components/appointments/AppointmentStatusHistory';

interface Props {
  currentClinic: any;
  onReturnToDashboard: () => void;
}

type AppointmentRecord = ScheduleAppointment & {
  scheduleType?: CalendarScheduleItem['type'];
  notes?: string;
  statusHistory: AppointmentStatusHistoryEntry[];
};

type AppointmentMenuAction = 'view' | 'edit' | 'confirm' | 'reschedule' | 'cancel' | 'delete';
type PreviewModalKind = 'view' | 'edit' | 'reschedule' | 'cancel' | 'delete';

type PendingTransition = {
  appointmentId: string;
  nextStatus: ScheduleAppointment['status'];
  title: string;
  description: string;
} | null;

const allowedTransitions: Record<ScheduleAppointment['status'], ScheduleAppointment['status'][]> = {
  Scheduled: ['Confirmed', 'Cancelled'],
  Confirmed: ['Waiting', 'No Show', 'Cancelled'],
  Waiting: ['In Treatment', 'Cancelled'],
  'In Treatment': ['Completed'],
  Completed: [],
  Cancelled: [],
  'No Show': []
};

const TODAY_KEY = '2026-08-09';
const INCLUDED_TYPES: CalendarScheduleItem['type'][] = ['appointments', 'recalls', 'online'];

function formatStatusTime(item: CalendarScheduleItem) {
  if (item.startTime) {
    return formatTime12Hour(item.startTime);
  }

  if (item.time && item.time !== 'Any time') {
    return item.time;
  }

  return 'All day';
}

function formatTime12Hour(value: string) {
  const [hoursRaw = '00', minutesRaw = '00'] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${normalizedHours}:${`${minutes}`.padStart(2, '0')} ${suffix}`;
}

function buildStatusHistory(status: ScheduleStatus, item: CalendarScheduleItem): AppointmentStatusHistoryEntry[] {
  const seeded: AppointmentStatusHistoryEntry[] = [{ status: 'Scheduled', time: formatStatusTime(item) }];

  if (status === 'Confirmed') {
    seeded.push({ status: 'Confirmed', time: 'Front desk confirmed' });
  } else if (status === 'Waiting') {
    seeded.push(
      { status: 'Confirmed', time: 'Arrived at clinic' },
      { status: 'Waiting', time: 'Waiting in lounge' }
    );
  } else if (status === 'In Treatment') {
    seeded.push(
      { status: 'Confirmed', time: 'Arrived at clinic' },
      { status: 'Waiting', time: 'Chart reviewed' },
      { status: 'In Treatment', time: 'Chairside started' }
    );
  } else if (status === 'Completed') {
    seeded.push(
      { status: 'Confirmed', time: 'Arrived at clinic' },
      { status: 'Waiting', time: 'Chart reviewed' },
      { status: 'In Treatment', time: 'Chairside started' },
      { status: 'Completed', time: 'Visit closed' }
    );
  } else if (status === 'Cancelled') {
    seeded.push({ status: 'Cancelled', time: 'Cancelled by clinic' });
  } else if (status === 'No Show') {
    seeded.push(
      { status: 'Confirmed', time: 'Reminder sent' },
      { status: 'No Show', time: 'Patient did not arrive' }
    );
  }

  return seeded;
}

function buildAppointmentRecords(clinicId?: string) {
  return getClinicScheduleItems(undefined, clinicId)
    .filter((item) => INCLUDED_TYPES.includes(item.type))
    .map<AppointmentRecord>((item) => ({
      id: item.id,
      clinicId: item.clinicId,
      clinicName: item.clinicName,
      patientId: item.patientId,
      patientName: item.patientName,
      date: item.date,
      time: formatStatusTime(item),
      procedure: item.procedure || item.title,
      dentist: item.dentist || 'Unassigned',
      status: item.status,
      scheduleType: item.type,
      notes: item.notes || '',
      statusHistory: buildStatusHistory(item.status, item)
    }))
    .sort((left, right) => {
      const leftStamp = `${left.date} ${left.time}`;
      const rightStamp = `${right.date} ${right.time}`;
      return leftStamp.localeCompare(rightStamp);
    });
}

function reloadAppointmentRecords(
  clinicId: string | undefined,
  setAppointments: (records: AppointmentRecord[]) => void,
  setSelectedAppointmentId: (updater: (current: string | null) => string | null) => void
) {
  const scheduleItems = getClinicScheduleItems(undefined, clinicId);
  const records = buildAppointmentRecords(clinicId);
  setAppointments(records);
  setSelectedAppointmentId((current) => current && records.some((record) => record.id === current) ? current : records[0]?.id || null);

  const hasPersistableChanges = records.some((record) => {
    const source = scheduleItems.find((item) => item.id === record.id);
    return source && source.status !== record.status;
  });

  if (hasPersistableChanges) {
    saveClinicScheduleItems(scheduleItems.map((item) => {
      const record = records.find((entry) => entry.id === item.id);
      return record ? { ...item, status: record.status } : item;
    }), clinicId);
  }
}

export function AppointmentsPage(_props: Props) {
  const { currentClinic, onReturnToDashboard } = _props;
  const currentDateLabel = 'August 9, 2026';

  const [searchValue, setSearchValue] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [procedureFilter, setProcedureFilter] = useState('All');
  const [appointments, setAppointments] = useState(() => buildAppointmentRecords(currentClinic?.id));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(() => buildAppointmentRecords(currentClinic?.id)[0]?.id || null);
  const [pendingTransition, setPendingTransition] = useState<PendingTransition>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [activePreviewModal, setActivePreviewModal] = useState<PreviewModalKind>('view');

  useEffect(() => {
    reloadAppointmentRecords(currentClinic?.id, setAppointments, setSelectedAppointmentId);
  }, [currentClinic?.id]);

  useEffect(() => {
    const handleSchedulesUpdated = () => {
      reloadAppointmentRecords(currentClinic?.id, setAppointments, setSelectedAppointmentId);
    };

    window.addEventListener(CLINIC_SCHEDULES_UPDATED_EVENT, handleSchedulesUpdated);
    window.addEventListener('storage', handleSchedulesUpdated);

    return () => {
      window.removeEventListener(CLINIC_SCHEDULES_UPDATED_EVENT, handleSchedulesUpdated);
      window.removeEventListener('storage', handleSchedulesUpdated);
    };
  }, [currentClinic?.id]);

  const filteredAppointments = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    return appointments.filter((appointment) => {
      const matchesSearch = !query
        || [appointment.id, appointment.patientName, appointment.procedure, appointment.dentist]
          .filter((value): value is string => Boolean(value))
          .some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'All' || appointment.status === statusFilter;
      const matchesProcedure = procedureFilter === 'All' || appointment.procedure === procedureFilter;
      const matchesDate = matchesDateFilter(appointment.date, dateFilter);
      return matchesSearch && matchesStatus && matchesProcedure && matchesDate;
    });
  }, [appointments, dateFilter, procedureFilter, searchValue, statusFilter]);

  const selectedAppointment = filteredAppointments.find((appointment) => appointment.id === selectedAppointmentId) || filteredAppointments[0] || null;
  const selectedHistory = selectedAppointment?.statusHistory || [];
  const allowedNextStatuses = selectedAppointment ? allowedTransitions[selectedAppointment.status] : [];
  const queueSummary = useMemo(() => ({
    activeCount: appointments.filter((appointment) => !['Completed', 'Cancelled', 'No Show'].includes(appointment.status)).length,
    scheduledCount: appointments.filter((appointment) => appointment.status === 'Scheduled').length,
    waitingCount: appointments.filter((appointment) => ['Waiting', 'In Treatment'].includes(appointment.status)).length,
    completedCount: appointments.filter((appointment) => ['Completed', 'No Show'].includes(appointment.status)).length
  }), [appointments]);

  const clearFilters = () => {
    setSearchValue('');
    setDateFilter('All');
    setStatusFilter('All');
    setProcedureFilter('All');
  };

  const showTodayQueue = () => {
    setDateFilter('Today');
    setStatusFilter('All');
    setProcedureFilter('All');
    setActivePreviewModal('view');
  };

  const showNeedsAction = () => {
    setDateFilter('All');
    setStatusFilter('Scheduled');
    setProcedureFilter('All');
    setActivePreviewModal('cancel');
  };

  const requestTransition = (nextStatus: ScheduleAppointment['status'], description: string) => {
    if (!selectedAppointment || !allowedNextStatuses.includes(nextStatus)) {
      return;
    }

    setPendingTransition({
      appointmentId: selectedAppointment.id,
      nextStatus,
      title: `Update appointment status to ${nextStatus}`,
      description
    });
  };

  const confirmTransition = () => {
    if (!pendingTransition) return;

    setAppointments((current) => {
      const nextAppointments = current.map((appointment) => {
        if (appointment.id !== pendingTransition.appointmentId) {
          return appointment;
        }

        const updatedHistory: AppointmentStatusHistoryEntry[] = [
          ...appointment.statusHistory,
          { status: pendingTransition.nextStatus, time: 'Updated by front desk' }
        ];

        return {
          ...appointment,
          status: pendingTransition.nextStatus,
          statusHistory: updatedHistory
        };
      });

      const scheduleItems = getClinicScheduleItems(undefined, currentClinic?.id);
      saveClinicScheduleItems(scheduleItems.map((item) => {
        const appointment = nextAppointments.find((entry) => entry.id === item.id);
        return appointment ? { ...item, status: appointment.status } : item;
      }), currentClinic?.id);

      return nextAppointments;
    });

    setSelectedAppointmentId(pendingTransition.appointmentId);
    setPendingTransition(null);
    setActiveActionMenuId(null);
  };

  const handleMenuAction = (action: AppointmentMenuAction, appointment: ScheduleAppointment) => {
    setSelectedAppointmentId(appointment.id);
    setActiveActionMenuId(null);

    if (action === 'confirm') {
      requestTransition('Confirmed', 'Confirm changing appointment status to Confirmed?');
      return;
    }

    if (action === 'cancel') {
      setActivePreviewModal('cancel');
      requestTransition('Cancelled', 'Confirm changing appointment status to Cancelled?');
      return;
    }

    if (action === 'view') setActivePreviewModal('view');
    if (action === 'edit') setActivePreviewModal('edit');
    if (action === 'reschedule') setActivePreviewModal('reschedule');
    if (action === 'delete') setActivePreviewModal('delete');
  };

  const selectedPendingDescription = pendingTransition?.description || '';
  const selectedPatientInitials = selectedAppointment
    ? selectedAppointment.patientName
      .split(/[,\s]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
    : 'PT';

  return (
    <div className="scheduling-appointments appointment-spec">
      <ClinicPageHeader
        sectionLabel="PATIENT SCHEDULES"
        title="Appointments"
        subtitle="Manage and track patient appointments."
        date={currentDateLabel}
        actions={(
          <button type="button" className="btn btn-outline scheduling-appointments__return" onClick={onReturnToDashboard}>
            Return to Branch Dashboard
          </button>
        )}
      />

      <div className="appointment-spec__layout">
        <aside className="appointment-spec__rail appointment-spec__rail--left">
          <section className="appointment-spec-card appointment-spec-card--teal">
            <div className="appointment-spec-card__eyebrow">Quick Action</div>
            <button type="button" className="appointment-spec__new-button">
              + New Appointment
            </button>
            <p>Quickly create a new appointment with patient, procedure, dentist, date, and time.</p>
          </section>

          <section className="appointment-spec-card">
            <div className="appointment-spec-card__eyebrow appointment-spec-card__eyebrow--green">New Appointment Modal</div>
            <div className="appointment-spec-form">
              <div className="appointment-spec-form__row">
                <label>Patient</label>
                <button type="button" className="appointment-spec-input appointment-spec-input--select">
                  Search patient...
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="appointment-spec-form__row">
                <label>Procedure</label>
                <button type="button" className="appointment-spec-input appointment-spec-input--select">
                  Select procedure
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="appointment-spec-form__row">
                <label>Dentist</label>
                <button type="button" className="appointment-spec-input appointment-spec-input--select">
                  Assigned dentist
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="appointment-spec-form__split">
                <div className="appointment-spec-form__row">
                  <label>Date</label>
                  <button type="button" className="appointment-spec-input">
                    <Calendar size={14} />
                    Aug 9, 2026
                  </button>
                </div>
                <div className="appointment-spec-form__row">
                  <label>Time</label>
                  <button type="button" className="appointment-spec-input appointment-spec-input--select">
                    10:00 AM
                    <ChevronDown size={14} />
                  </button>
                </div>
              </div>
              <div className="appointment-spec-form__split">
                <div className="appointment-spec-form__row">
                  <label>Duration</label>
                  <button type="button" className="appointment-spec-input appointment-spec-input--select">
                    30 mins
                    <ChevronDown size={14} />
                  </button>
                </div>
                <div className="appointment-spec-form__row">
                  <label>Notes</label>
                  <div className="appointment-spec-input appointment-spec-input--textarea">
                    Chair note or reminder...
                  </div>
                </div>
              </div>
              <div className="appointment-spec-form__actions">
                <button type="button" className="btn btn-outline">Cancel</button>
                <button type="button" className="btn btn-primary">Save</button>
              </div>
            </div>
          </section>

          <section className="appointment-spec-card">
            <div className="appointment-spec-card__eyebrow appointment-spec-card__eyebrow--blue">Appointment Details</div>
            <div className="appointment-preview-profile">
              <div className="appointment-preview-profile__avatar">{selectedPatientInitials}</div>
              <div>
                <strong>{selectedAppointment?.patientName || 'Select patient'}</strong>
                <span>{selectedAppointment?.id || 'No appointment selected'}</span>
              </div>
              {selectedAppointment ? <span className="appointment-preview-profile__badge">{selectedAppointment.status}</span> : null}
            </div>
            <div className="appointment-preview-list">
              <div><CalendarClock size={15} /><span>{selectedAppointment ? formatPreviewDate(selectedAppointment.date) : 'Date'}</span></div>
              <div><Clock3 size={15} /><span>{selectedAppointment?.time || 'Time'}</span></div>
              <div><Stethoscope size={15} /><span>{selectedAppointment?.procedure || 'Procedure'}</span></div>
              <div><UserRound size={15} /><span>{selectedAppointment?.dentist || 'Dentist'}</span></div>
              <div><FileText size={15} /><span>{selectedAppointment?.notes || 'No notes'}</span></div>
            </div>
          </section>
        </aside>

        <div className="appointment-spec__center">
          <div className="clinic-dashboard-panel scheduling-appointments__panel">
            <section className="appointment-workflow" aria-label="Front desk workflow summary">
              <article className="appointment-workflow__card">
                <span>Active</span>
                <strong>{queueSummary.activeCount}</strong>
                <p>Open appointments</p>
              </article>
              <article className="appointment-workflow__card appointment-workflow__card--confirmed">
                <span>Scheduled</span>
                <strong>{queueSummary.scheduledCount}</strong>
                <p>Upcoming appointments</p>
              </article>
              <article className="appointment-workflow__card appointment-workflow__card--waiting">
                <span>Waiting</span>
                <strong>{queueSummary.waitingCount}</strong>
                <p>In treatment queue</p>
              </article>
              <article className="appointment-workflow__card appointment-workflow__card--attention">
                <span>Completed Today</span>
                <strong>{queueSummary.completedCount}</strong>
                <p>Finished today</p>
              </article>
            </section>

            <div className="appointment-workflow__hint">
              <strong>Front-desk workflow:</strong> select a booking, verify details, then move it through the status actions on the right panel.
            </div>

            <AppointmentToolbar
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              dateFilter={dateFilter}
              statusFilter={statusFilter}
              procedureFilter={procedureFilter}
              onDateFilterChange={setDateFilter}
              onStatusFilterChange={setStatusFilter}
              onProcedureFilterChange={setProcedureFilter}
              onShowToday={showTodayQueue}
              onShowNeedsAction={showNeedsAction}
              onClearFilters={clearFilters}
            />

            {filteredAppointments.length > 0 ? (
              <div className="scheduling-appointments__content">
                <AppointmentTable
                  appointments={filteredAppointments}
                  selectedAppointmentId={selectedAppointment?.id}
                  onSelectAppointment={(appointment) => setSelectedAppointmentId(appointment.id)}
                  activeMenuAppointmentId={activeActionMenuId}
                  onToggleMenu={(appointmentId) => setActiveActionMenuId((current) => current === appointmentId ? null : appointmentId)}
                  onMenuAction={handleMenuAction}
                />
                <AppointmentDetailsPanel
                  appointment={selectedAppointment}
                  statusHistory={selectedHistory}
                  onRequestTransition={(nextStatus, confirmMessage) => requestTransition(nextStatus, confirmMessage)}
                />
              </div>
            ) : (
              <div className="clinic-dashboard-empty-state scheduling-appointments__empty">
                <strong>No appointments found.</strong>
                <p>Try adjusting your search or clearing the current filters.</p>
                <button type="button" className="btn btn-primary" style={{ width: 'auto' }} onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        <aside className="appointment-spec__rail appointment-spec__rail--right">
          <section className="appointment-spec-card appointment-spec-card--amber">
            <div className="appointment-spec-card__eyebrow">Date Picker (Today)</div>
            <div className="appointment-calendar-card">
              <div className="appointment-calendar-card__head">
                <button type="button">{'<'}</button>
                <strong>August 2026</strong>
                <button type="button">{'>'}</button>
              </div>
              <div className="appointment-calendar-card__grid appointment-calendar-card__grid--labels">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="appointment-calendar-card__grid">
                {['26', '27', '28', '29', '30', '31', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((day) => (
                  <span key={day} className={day === '9' ? 'is-active' : ''}>{day}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="appointment-spec-card">
            <div className="appointment-spec-card__eyebrow appointment-spec-card__eyebrow--cyan">Filters Panel</div>
            <div className="appointment-spec-form">
              <div className="appointment-spec-form__row">
                <label>Status</label>
                <button type="button" className="appointment-spec-input appointment-spec-input--select">All Status <ChevronDown size={14} /></button>
              </div>
              <div className="appointment-spec-form__row">
                <label>Dentist</label>
                <button type="button" className="appointment-spec-input appointment-spec-input--select">All Dentists <ChevronDown size={14} /></button>
              </div>
              <div className="appointment-spec-form__row">
                <label>Procedure</label>
                <button type="button" className="appointment-spec-input appointment-spec-input--select">All Procedures <ChevronDown size={14} /></button>
              </div>
              <div className="appointment-spec-form__split appointment-spec-form__split--compact">
                <div className="appointment-spec-form__row">
                  <label>Start date</label>
                  <button type="button" className="appointment-spec-input">Aug 1, 2026</button>
                </div>
                <div className="appointment-spec-form__row">
                  <label>End date</label>
                  <button type="button" className="appointment-spec-input">Aug 31, 2026</button>
                </div>
              </div>
              <div className="appointment-spec-form__actions">
                <button type="button" className="btn btn-outline">Reset</button>
                <button type="button" className="btn btn-primary">Apply</button>
              </div>
            </div>
          </section>

          <section className="appointment-spec-card appointment-spec-card--orange">
            <div className="appointment-spec-card__eyebrow">Status Dropdown</div>
            <div className="appointment-status-menu-preview">
              {['Scheduled', 'Confirmed', 'Waiting', 'In Progress', 'Completed', 'Cancelled'].map((label) => (
                <div key={label} className="appointment-status-menu-preview__item">
                  <span className={`appointment-status-dot appointment-status-dot--${label.toLowerCase().replace(/\s+/g, '-')}`}></span>
                  <span>{label}</span>
                  {label === 'Scheduled' ? <CheckCircle2 size={14} /> : null}
                </div>
              ))}
            </div>
          </section>

          <section className="appointment-spec-card appointment-spec-card--purple">
            <div className="appointment-spec-card__eyebrow">Actions Menu (3 dots)</div>
            <div className="appointment-actions-preview">
              {[
                { icon: Eye, label: 'View Appointment Details' },
                { icon: PencilLine, label: 'Edit Appointment' },
                { icon: CalendarClock, label: 'Reschedule Appointment' },
                { icon: XCircle, label: 'Cancel Appointment' },
                { icon: Trash2, label: 'Delete Appointment' }
              ].map(({ icon: Icon, label }) => (
                <div key={label} className={`appointment-actions-preview__item${label.includes('Delete') ? ' is-danger' : ''}`}>
                  <Icon size={14} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="appointment-spec__bottom">
        <ExampleModalCard
          tone="blue"
          title="View Details Modal"
          description="Detailed information about the selected appointment."
          active={activePreviewModal === 'view'}
        >
          <AppointmentMiniProfile patientName={selectedAppointment?.patientName} appointmentId={selectedAppointment?.id} status={selectedAppointment?.status} initials={selectedPatientInitials} />
          <MiniDetail icon={CalendarClock} label="Date" value={selectedAppointment ? formatPreviewDate(selectedAppointment.date) : 'August 9, 2026'} />
          <MiniDetail icon={Clock3} label="Time" value={selectedAppointment?.time || '10:00 AM'} />
          <MiniDetail icon={Stethoscope} label="Procedure" value={selectedAppointment?.procedure || 'Procedure'} />
          <MiniDetail icon={UserRound} label="Dentist" value={selectedAppointment?.dentist || 'Unassigned'} />
        </ExampleModalCard>

        <ExampleModalCard
          tone="green"
          title="Edit Appointment Modal"
          description="Edit appointment information."
          active={activePreviewModal === 'edit'}
        >
          <MiniField label="Patient" value={`${selectedAppointment?.patientName || 'Ana Villanueva'} (${selectedAppointment?.id || 'P001'})`} />
          <MiniField label="Procedure" value={selectedAppointment?.procedure || 'Online Cleaning Booking'} />
          <MiniField label="Dentist" value={selectedAppointment?.dentist || 'Dr. Maria Jessica Tanarte'} />
          <MiniField label="Date" value={selectedAppointment ? formatPreviewDate(selectedAppointment.date) : 'Aug 9, 2026'} />
          <MiniField label="Time" value={selectedAppointment?.time || '10:00 AM'} />
        </ExampleModalCard>

        <ExampleModalCard
          tone="amber"
          title="Reschedule Modal"
          description="Reschedule to a new date and time."
          active={activePreviewModal === 'reschedule'}
        >
          <MiniField label="Current" value={`${selectedAppointment ? formatPreviewDate(selectedAppointment.date) : 'Aug 9, 2026'} • ${selectedAppointment?.time || '10:00 AM'}`} />
          <MiniField label="New Date" value="Aug 10, 2026" />
          <MiniField label="New Time" value="11:00 AM" />
          <MiniField label="Duration" value="30 mins" />
        </ExampleModalCard>

        <ExampleModalCard
          tone="red"
          title="Cancel Appointment Modal"
          description="Cancel an appointment with reason and note."
          active={activePreviewModal === 'cancel'}
        >
          <div className="appointment-alert appointment-alert--danger">
            <ShieldAlert size={16} />
            <span>You are about to cancel this appointment.</span>
          </div>
          <MiniField label="Patient" value={`${selectedAppointment?.patientName || 'Ana Villanueva'} (${selectedAppointment?.id || 'P001'})`} />
          <MiniField label="Date & Time" value={`${selectedAppointment ? formatPreviewDate(selectedAppointment.date) : 'Aug 9, 2026'} • ${selectedAppointment?.time || '10:00 AM'}`} />
          <MiniField label="Reason" value="Select cancellation reason" />
        </ExampleModalCard>

        <ExampleModalCard
          tone="rose"
          title="Delete Confirmation"
          description="Permanently delete an appointment."
          active={activePreviewModal === 'delete'}
        >
          <div className="appointment-delete-preview">
            <div className="appointment-delete-preview__icon"><Trash2 size={18} /></div>
            <strong>Delete Appointment?</strong>
            <p>This action cannot be undone.</p>
            <span>{selectedAppointment?.patientName || 'Selected patient'} • {selectedAppointment?.id || 'A001'}</span>
          </div>
        </ExampleModalCard>
      </section>

      <AppointmentConfirmationDialog
        open={pendingTransition !== null}
        title={pendingTransition?.title || 'Update appointment'}
        description={selectedPendingDescription}
        onConfirm={confirmTransition}
        onCancel={() => setPendingTransition(null)}
      />
    </div>
  );
}

function formatPreviewDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function AppointmentMiniProfile({
  patientName,
  appointmentId,
  status,
  initials
}: {
  patientName?: string;
  appointmentId?: string;
  status?: string;
  initials: string;
}) {
  return (
    <div className="appointment-preview-profile">
      <div className="appointment-preview-profile__avatar">{initials}</div>
      <div>
        <strong>{patientName || 'Selected patient'}</strong>
        <span>{appointmentId || 'No appointment selected'}</span>
      </div>
      {status ? <span className="appointment-preview-profile__badge">{status}</span> : null}
    </div>
  );
}

function MiniDetail({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <div className="appointment-mini-detail">
      <Icon size={14} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div className="appointment-mini-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ExampleModalCard({
  tone,
  title,
  description,
  active,
  children
}: {
  tone: 'blue' | 'green' | 'amber' | 'red' | 'rose';
  title: string;
  description: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <article className={`appointment-modal-example appointment-modal-example--${tone}${active ? ' is-active' : ''}`}>
      <div className="appointment-modal-example__eyebrow">{title}</div>
      <div className="appointment-modal-example__body">
        {children}
      </div>
      <p>{description}</p>
    </article>
  );
}

function matchesDateFilter(date: string, filter: string) {
  if (filter === 'All') return true;
  if (filter === 'Today') return date === TODAY_KEY;
  if (filter === 'Tomorrow') return date === '2026-08-10';
  if (filter === 'This Week') {
    return ['2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14', '2026-08-15'].includes(date);
  }
  return true;
}
