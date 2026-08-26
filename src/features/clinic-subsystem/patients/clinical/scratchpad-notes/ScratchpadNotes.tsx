import { NotebookPen } from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import {
  PatientModuleScaffold,
  type PatientModuleColumn,
  type PatientModuleField,
  type PatientModuleRecordBase
} from '../shared/PatientModuleScaffold';
import { isSeededPatient } from '../shared/isSeededPatient';

interface ScratchpadRecord extends PatientModuleRecordBase {
  notedDate: string;
  category: string;
  subject: string;
  details: string;
  owner: string;
}

const fields: PatientModuleField[] = [
  { key: 'notedDate', label: 'Note Date', type: 'date' },
  { key: 'category', label: 'Category', type: 'select', options: ['Chairside', 'Admin', 'Clinical Reminder', 'Callout'] },
  { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Quick note subject' },
  { key: 'owner', label: 'Owner', type: 'text', placeholder: 'Who left the note' },
  { key: 'details', label: 'Scratchpad Note', type: 'textarea', span: true, placeholder: 'Temporary reminders, quick observations, next-chair notes...' },
  { key: 'statusLabel', label: 'Status', type: 'select', options: ['Open', 'Reviewed', 'Closed'] }
];

const columns: PatientModuleColumn<ScratchpadRecord>[] = [
  {
    key: 'notedDate',
    label: 'Date',
    render: (record) => <><strong>{formatDate(record.notedDate)}</strong><span>{record.category}</span></>,
    exportValue: (record) => `${record.notedDate} ${record.category}`
  },
  {
    key: 'subject',
    label: 'Scratchpad Note',
    render: (record) => <><strong>{record.subject}</strong><span>{record.details}</span></>,
    exportValue: (record) => `${record.subject} ${record.details}`
  },
  {
    key: 'owner',
    label: 'Owner',
    render: (record) => <><strong>{record.owner}</strong><span>Internal working note</span></>,
    exportValue: (record) => record.owner
  },
  {
    key: 'status',
    label: 'Status',
    render: (record) => <span className={`patient-module-status patient-module-status--${record.statusTone}`}>{record.statusLabel}</span>,
    exportValue: (record) => record.statusLabel
  }
];

export function ScratchpadNotes({ patient }: { patient: PatientPreviewItem }) {
  return (
    <PatientModuleScaffold
      patient={patient}
      title="Scratchpad Notes"
      icon={NotebookPen}
      searchPlaceholder="Search subject, details, owner..."
      newButtonLabel="New Scratchpad Note"
      exportFileName="scratchpad-notes"
      emptyTitle="No scratchpad notes yet"
      emptyDescription="Add quick internal notes without crowding formal progress documentation."
      fields={fields}
      columns={columns}
      initialRecords={(currentPatient): ScratchpadRecord[] => (
        isSeededPatient(currentPatient)
          ? [
              {
                id: 'SP-001',
                notedDate: '2026-08-08',
                category: 'Chairside',
                subject: 'Prefers early morning slots',
                details: 'Patient responds faster to 8AM slots and prefers SMS reminders.',
                owner: 'Angela - Front Desk',
                statusLabel: 'Open',
                statusTone: 'warning'
              }
            ]
          : []
      )}
      createDraft={() => ({
        notedDate: '2026-08-09',
        category: 'Chairside',
        subject: '',
        owner: '',
        details: '',
        statusLabel: 'Open'
      })}
      recordToDraft={(record) => ({ ...record })}
      buildRecord={(draft, _patient, existingRecord): ScratchpadRecord => ({
        id: existingRecord?.id || `SP-${Date.now()}`,
        notedDate: draft.notedDate,
        category: draft.category,
        subject: draft.subject,
        owner: draft.owner,
        details: draft.details,
        statusLabel: draft.statusLabel || 'Open',
        statusTone: draft.statusLabel === 'Closed' ? 'neutral' : draft.statusLabel === 'Reviewed' ? 'success' : 'warning'
      })}
      duplicateRecord={(record): ScratchpadRecord => ({ ...record, id: `SP-${Date.now()}`, subject: `${record.subject} Copy` })}
      getSearchText={(record) => [record.category, record.subject, record.owner, record.details, record.statusLabel].join(' ').toLowerCase()}
      getMenuMeta={(record) => formatDate(record.notedDate)}
      getRowGridTemplate={() => 'minmax(180px, 1.1fr) minmax(340px, 2fr) minmax(180px, 1fr) minmax(120px, 0.8fr)'}
      modalTitle={{ create: 'New Scratchpad Note', edit: 'Edit Scratchpad Note' }}
      modalDescription="Capture fast internal reminders and chairside context that should stay separate from formal chart notes."
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
