import { BellRing } from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import {
  PatientModuleScaffold,
  type PatientModuleColumn,
  type PatientModuleField
} from '../shared/PatientModuleScaffold';
import {
  createInitialDentalRecallRecords,
  DENTAL_RECALLS_UPDATED_EVENT,
  getScopedDentalRecallsStorageKey,
  type DentalRecallRecord
} from './dentalRecallStore';

const fields: PatientModuleField[] = [
  { key: 'recallDate', label: 'Recall Date', type: 'date' },
  { key: 'recallReason', label: 'Recall Reason', type: 'text', placeholder: 'e.g. 6-month prophylaxis' },
  { key: 'assignedTo', label: 'Assigned To', type: 'text', placeholder: 'Dentist or coordinator' },
  { key: 'reminderChannel', label: 'Reminder Channel', type: 'select', options: ['SMS', 'Call', 'Email', 'Messenger'] },
  { key: 'notes', label: 'Follow-up Notes', type: 'textarea', span: true, placeholder: 'Reminder script, next step, patient response...' },
  { key: 'statusLabel', label: 'Status', type: 'select', options: ['Scheduled', 'Sent', 'Overdue'] }
];

const columns: PatientModuleColumn<DentalRecallRecord>[] = [
  {
    key: 'recallDate',
    label: 'Recall Date',
    render: (record) => <><strong>{formatDate(record.recallDate)}</strong><span>{record.reminderChannel}</span></>,
    exportValue: (record) => `${record.recallDate} ${record.reminderChannel}`
  },
  {
    key: 'recallReason',
    label: 'Reason & Notes',
    render: (record) => <><strong>{record.recallReason}</strong><span>{record.notes}</span></>,
    exportValue: (record) => `${record.recallReason} ${record.notes}`
  },
  {
    key: 'assignedTo',
    label: 'Assigned To',
    render: (record) => <><strong>{record.assignedTo}</strong><span>Recall owner</span></>,
    exportValue: (record) => record.assignedTo
  },
  {
    key: 'status',
    label: 'Status',
    render: (record) => <span className={`patient-module-status patient-module-status--${record.statusTone}`}>{record.statusLabel}</span>,
    exportValue: (record) => record.statusLabel
  }
];

export function DentalRecalls({ patient }: { patient: PatientPreviewItem }) {
  return (
    <PatientModuleScaffold
      patient={patient}
      title="Dental Recalls"
      icon={BellRing}
      searchPlaceholder="Search recall reason, notes, assigned staff..."
      newButtonLabel="New Recall Entry"
      exportFileName="dental-recalls"
      emptyTitle="No recall reminders yet"
      emptyDescription="Schedule patient follow-up cadence and reminder actions for future appointments."
      fields={fields}
      columns={columns}
      initialRecords={(currentPatient): DentalRecallRecord[] => createInitialDentalRecallRecords(currentPatient)}
      createDraft={() => ({
        recallDate: '2026-08-20',
        recallReason: '',
        assignedTo: '',
        reminderChannel: 'SMS',
        notes: '',
        statusLabel: 'Scheduled'
      })}
      recordToDraft={(record) => ({ ...record })}
      buildRecord={(draft, _patient, existingRecord): DentalRecallRecord => ({
        id: existingRecord?.id || `RECALL-${Date.now()}`,
        recallDate: draft.recallDate,
        recallReason: draft.recallReason,
        assignedTo: draft.assignedTo,
        reminderChannel: draft.reminderChannel,
        notes: draft.notes,
        statusLabel: draft.statusLabel || 'Scheduled',
        statusTone: draft.statusLabel === 'Overdue' ? 'attention' : draft.statusLabel === 'Sent' ? 'warning' : 'success',
        source: existingRecord?.source,
        sourceId: existingRecord?.sourceId
      })}
      duplicateRecord={(record): DentalRecallRecord => ({
        ...record,
        id: `RECALL-${Date.now()}`,
        statusLabel: 'Scheduled',
        statusTone: 'success',
        source: 'manual',
        sourceId: undefined
      })}
      getSearchText={(record) => [record.recallReason, record.assignedTo, record.reminderChannel, record.notes, record.statusLabel].join(' ').toLowerCase()}
      getMenuMeta={(record) => formatDate(record.recallDate)}
      getRowGridTemplate={() => 'minmax(180px, 1.1fr) minmax(340px, 2fr) minmax(180px, 1fr) minmax(120px, 0.8fr)'}
      modalTitle={{ create: 'New Dental Recall Entry', edit: 'Edit Dental Recall Entry' }}
      modalDescription="Track recall schedules, reminder channels, and follow-up coordination inside the patient record."
      storageKey={getScopedDentalRecallsStorageKey(patient.id, patient.clinicId)}
      syncEventName={DENTAL_RECALLS_UPDATED_EVENT}
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

