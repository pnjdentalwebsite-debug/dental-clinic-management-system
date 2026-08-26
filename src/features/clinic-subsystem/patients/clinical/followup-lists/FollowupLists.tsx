import { ClipboardCheck } from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import {
  PatientModuleScaffold,
  type PatientModuleColumn,
  type PatientModuleField,
  type PatientModuleRecordBase
} from '../shared/PatientModuleScaffold';
import { isSeededPatient } from '../shared/isSeededPatient';

interface FollowupRecord extends PatientModuleRecordBase {
  targetDate: string;
  taskTitle: string;
  owner: string;
  priority: string;
  notes: string;
}

const fields: PatientModuleField[] = [
  { key: 'targetDate', label: 'Target Date', type: 'date' },
  { key: 'taskTitle', label: 'Follow-up Task', type: 'text', placeholder: 'e.g. Confirm lab delivery' },
  { key: 'owner', label: 'Owner', type: 'text', placeholder: 'Assigned staff / dentist' },
  { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
  { key: 'notes', label: 'Task Notes', type: 'textarea', span: true, placeholder: 'Instructions, blockers, callback notes...' },
  { key: 'statusLabel', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Done'] }
];

const columns: PatientModuleColumn<FollowupRecord>[] = [
  {
    key: 'targetDate',
    label: 'Target Date',
    render: (record) => <><strong>{formatDate(record.targetDate)}</strong><span>{record.priority} priority</span></>,
    exportValue: (record) => `${record.targetDate} ${record.priority}`
  },
  {
    key: 'taskTitle',
    label: 'Task & Notes',
    render: (record) => <><strong>{record.taskTitle}</strong><span>{record.notes}</span></>,
    exportValue: (record) => `${record.taskTitle} ${record.notes}`
  },
  {
    key: 'owner',
    label: 'Owner',
    render: (record) => <><strong>{record.owner}</strong><span>Follow-up assignee</span></>,
    exportValue: (record) => record.owner
  },
  {
    key: 'status',
    label: 'Status',
    render: (record) => <span className={`patient-module-status patient-module-status--${record.statusTone}`}>{record.statusLabel}</span>,
    exportValue: (record) => record.statusLabel
  }
];

export function FollowupLists({ patient }: { patient: PatientPreviewItem }) {
  return (
    <PatientModuleScaffold
      patient={patient}
      title="Followup Lists"
      icon={ClipboardCheck}
      searchPlaceholder="Search follow-up task, owner, notes..."
      newButtonLabel="New Follow-up Task"
      exportFileName="followup-lists"
      emptyTitle="No follow-up tasks yet"
      emptyDescription="Track open patient-related tasks that still need callbacks, confirmations, or completion."
      fields={fields}
      columns={columns}
      initialRecords={(currentPatient): FollowupRecord[] => (
        isSeededPatient(currentPatient)
          ? [
              {
                id: 'FU-001',
                targetDate: '2026-08-12',
                taskTitle: 'Confirm whitening kit availability',
                owner: 'Inventory Coordinator',
                priority: 'Medium',
                notes: 'Update patient before scheduled Friday follow-up.',
                statusLabel: 'Pending',
                statusTone: 'warning'
              }
            ]
          : []
      )}
      createDraft={() => ({
        targetDate: '2026-08-12',
        taskTitle: '',
        owner: '',
        priority: 'Medium',
        notes: '',
        statusLabel: 'Pending'
      })}
      recordToDraft={(record) => ({ ...record })}
      buildRecord={(draft, _patient, existingRecord): FollowupRecord => ({
        id: existingRecord?.id || `FU-${Date.now()}`,
        targetDate: draft.targetDate,
        taskTitle: draft.taskTitle,
        owner: draft.owner,
        priority: draft.priority,
        notes: draft.notes,
        statusLabel: draft.statusLabel || 'Pending',
        statusTone: draft.statusLabel === 'Done' ? 'success' : draft.statusLabel === 'In Progress' ? 'attention' : 'warning'
      })}
      duplicateRecord={(record): FollowupRecord => ({ ...record, id: `FU-${Date.now()}`, statusLabel: 'Pending', statusTone: 'warning' })}
      getSearchText={(record) => [record.taskTitle, record.owner, record.priority, record.notes, record.statusLabel].join(' ').toLowerCase()}
      getMenuMeta={(record) => formatDate(record.targetDate)}
      getRowGridTemplate={() => 'minmax(180px, 1.1fr) minmax(340px, 2fr) minmax(180px, 1fr) minmax(120px, 0.8fr)'}
      modalTitle={{ create: 'New Follow-up Task', edit: 'Edit Follow-up Task' }}
      modalDescription="Keep patient-specific action items visible until every callback, approval, or pending task is resolved."
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
