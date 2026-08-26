import { CalendarClock } from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import {
  PatientModuleScaffold,
  type PatientModuleColumn,
  type PatientModuleField
} from '../shared/PatientModuleScaffold';
import {
  APPOINTMENTS_UPDATED_EVENT,
  createInitialAppointmentRecords,
  getScopedAppointmentsStorageKey,
  type AppointmentRecord
} from './appointmentStore';

const fields: PatientModuleField[] = [
  { key: 'appointmentDate', label: 'Appointment Date', type: 'date' },
  { key: 'appointmentTime', label: 'Appointment Time', type: 'time' },
  { key: 'appointmentType', label: 'Appointment Type', type: 'text', placeholder: 'e.g. Initial consultation' },
  { key: 'provider', label: 'Provider', type: 'text', placeholder: 'Assigned doctor' },
  { key: 'notes', label: 'Schedule Notes', type: 'textarea', span: true, placeholder: 'Chair instructions, expected procedure, reminders...' },
  { key: 'statusLabel', label: 'Status', type: 'select', options: ['Scheduled', 'Confirmed', 'Pending', 'Completed', 'Cancelled'] }
];

const columns: PatientModuleColumn<AppointmentRecord>[] = [
  {
    key: 'appointmentDate',
    label: 'Date & Time',
    render: (record) => <><strong>{formatDate(record.appointmentDate)}</strong><span>{formatTime(record.appointmentTime)}</span></>,
    exportValue: (record) => `${record.appointmentDate} ${record.appointmentTime}`
  },
  {
    key: 'appointmentType',
    label: 'Appointment',
    render: (record) => (
      <>
        <strong>{record.appointmentType}</strong>
        <span>{record.notes}</span>
        {record.recallReason ? <span className="patient-module-table__subnote">Recall reason: {record.recallReason}</span> : null}
      </>
    ),
    exportValue: (record) => `${record.appointmentType} ${record.notes} ${record.recallReason || ''}`.trim()
  },
  {
    key: 'provider',
    label: 'Provider',
    render: (record) => <><strong>{record.provider}</strong><span>Patient schedule entry</span></>,
    exportValue: (record) => record.provider
  },
  {
    key: 'status',
    label: 'Status',
    render: (record) => <span className={`patient-module-status patient-module-status--${record.statusTone}`}>{record.statusLabel}</span>,
    exportValue: (record) => record.statusLabel
  }
];

export function AppointmentsModule({ patient }: { patient: PatientPreviewItem }) {
  return (
    <PatientModuleScaffold
      patient={patient}
      title="Appointments"
      icon={CalendarClock}
      searchPlaceholder="Search appointment type, provider, notes..."
      newButtonLabel="New Appointment"
      exportFileName="appointments"
      emptyTitle="No patient appointments yet"
      emptyDescription="Keep patient-specific scheduling history and planned visits in one tab."
      fields={fields}
      columns={columns}
      initialRecords={createInitialAppointmentRecords}
      createDraft={() => ({
        appointmentDate: '2026-08-20',
        appointmentTime: '09:00',
        appointmentType: '',
        provider: '',
        notes: '',
        statusLabel: 'Pending'
      })}
      recordToDraft={(record) => ({ ...record })}
      buildRecord={(draft, _patient, existingRecord): AppointmentRecord => ({
        id: existingRecord?.id || `APPT-${Date.now()}`,
        appointmentDate: draft.appointmentDate,
        appointmentTime: draft.appointmentTime,
        appointmentType: draft.appointmentType,
        provider: draft.provider,
        notes: draft.notes,
        recallReason: existingRecord?.recallReason || '',
        statusLabel: draft.statusLabel || 'Pending',
        statusTone:
          draft.statusLabel === 'Completed'
            ? 'neutral'
            : draft.statusLabel === 'Pending' || draft.statusLabel === 'Scheduled'
              ? 'warning'
              : draft.statusLabel === 'Cancelled'
                ? 'attention'
                : 'success'
      })}
      duplicateRecord={(record): AppointmentRecord => ({ ...record, id: `APPT-${Date.now()}`, statusLabel: 'Pending', statusTone: 'warning' })}
      getSearchText={(record) => [record.appointmentType, record.provider, record.notes, record.statusLabel].join(' ').toLowerCase()}
      getMenuMeta={(record) => `${formatDate(record.appointmentDate)} ${formatTime(record.appointmentTime)}`}
      getRowGridTemplate={() => 'minmax(180px, 1.1fr) minmax(340px, 2fr) minmax(180px, 1fr) minmax(120px, 0.8fr)'}
      modalTitle={{ create: 'New Patient Appointment', edit: 'Edit Patient Appointment' }}
      modalDescription="Manage patient-specific upcoming visits and completed appointment records."
      storageKey={getScopedAppointmentsStorageKey(patient.id, patient.clinicId)}
      syncEventName={APPOINTMENTS_UPDATED_EVENT}
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string) {
  if (!value) return 'Time not set';

  const parsed = new Date(`2026-08-09T${value}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(parsed);
}
