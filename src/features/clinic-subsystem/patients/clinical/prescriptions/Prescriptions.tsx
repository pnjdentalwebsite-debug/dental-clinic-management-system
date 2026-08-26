import { useMemo } from 'react';
import { Pill } from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import {
  PatientModuleScaffold,
  type PatientModuleColumn,
  type PatientModuleField,
  type PatientModuleRecordBase
} from '../shared/PatientModuleScaffold';
import { masterFileDirectoryService } from '../../../master-files/masterFileDirectoryService';
import { isSeededPatient } from '../shared/isSeededPatient';

interface PrescriptionRecord extends PatientModuleRecordBase {
  prescribedDate: string;
  templateName: string;
  medication: string;
  dosage: string;
  instructions: string;
  prescribedBy: string;
}

const columns: PatientModuleColumn<PrescriptionRecord>[] = [
  {
    key: 'prescribedDate',
    label: 'Date',
    render: (record) => <><strong>{formatDate(record.prescribedDate)}</strong><span>{record.dosage}</span></>,
    exportValue: (record) => `${record.prescribedDate} ${record.dosage}`
  },
  {
    key: 'medication',
    label: 'Prescription',
    render: (record) => <><strong>{record.medication}</strong><span>{record.instructions}</span></>,
    exportValue: (record) => `${record.medication} ${record.instructions}`
  },
  {
    key: 'prescribedBy',
    label: 'Prescribed By',
    render: (record) => <><strong>{record.prescribedBy}</strong><span>Dental medication order</span></>,
    exportValue: (record) => record.prescribedBy
  },
  {
    key: 'status',
    label: 'Status',
    render: (record) => <StatusPill label={record.statusLabel} tone={record.statusTone} />,
    exportValue: (record) => record.statusLabel
  }
];

export function Prescriptions({ patient }: { patient: PatientPreviewItem }) {
  const prescriptionTemplates = useMemo(
    () => masterFileDirectoryService.getActiveTagRecords('prescription-templates'),
    []
  );
  const templateByName = useMemo(
    () => Object.fromEntries(prescriptionTemplates.map((template) => [template.name, template])) as Record<string, (typeof prescriptionTemplates)[number]>,
    [prescriptionTemplates]
  );
  const fields: PatientModuleField[] = [
    { key: 'prescribedDate', label: 'Prescribed Date', type: 'date' },
    { key: 'templateName', label: 'Prescription Template', type: 'select' },
    { key: 'medication', label: 'Prescription Name', type: 'text', placeholder: 'e.g. Post-Extraction Antibiotic & Painkiller' },
    { key: 'dosage', label: 'Description', type: 'text', placeholder: 'e.g. Standard post-op medication template' },
    { key: 'instructions', label: 'Prescription Details', type: 'textarea', span: true, placeholder: 'Medication lines, dosage instructions, and diagnosis notes...' },
    { key: 'prescribedBy', label: 'Prescribed By', type: 'text', placeholder: 'Dentist name' },
    { key: 'statusLabel', label: 'Status', type: 'select', options: ['Active', 'Completed', 'Refill Due'] }
  ];

  return (
    <PatientModuleScaffold
      patient={patient}
      title="Prescriptions"
      icon={Pill}
      searchPlaceholder="Search medication, dosage, doctor..."
      newButtonLabel="New Prescription"
      exportFileName="prescriptions"
      emptyTitle="No prescriptions logged yet"
      emptyDescription="Create medication orders, dosage reminders, and refill tracking for this patient."
      fields={fields}
      columns={columns}
      initialRecords={(currentPatient): PrescriptionRecord[] => (
        isSeededPatient(currentPatient)
          ? [
              {
                id: 'RX-001',
                prescribedDate: '2026-08-06',
                templateName: 'Post-Extraction Antibiotic & Painkiller',
                medication: 'Mefenamic Acid 500mg',
                dosage: '1 tablet every 8 hours',
                instructions: 'Take after meals for three days after oral surgery.',
                prescribedBy: 'Dr. Maria Jessica Tanarte',
                statusLabel: 'Active',
                statusTone: 'success'
              }
            ]
          : []
      )}
      createDraft={() => ({
        prescribedDate: '2026-08-09',
        templateName: '',
        medication: '',
        dosage: '',
        instructions: '',
        prescribedBy: 'Dr. Maria Jessica Tanarte',
        statusLabel: 'Active'
      })}
      recordToDraft={(record) => ({ ...record })}
      buildRecord={(draft, _patient, existingRecord): PrescriptionRecord => ({
        id: existingRecord?.id || `RX-${Date.now()}`,
        prescribedDate: draft.prescribedDate,
        templateName: draft.templateName,
        medication: draft.medication,
        dosage: draft.dosage,
        instructions: draft.instructions,
        prescribedBy: draft.prescribedBy,
        statusLabel: draft.statusLabel || 'Active',
        statusTone: draft.statusLabel === 'Completed' ? 'neutral' : draft.statusLabel === 'Refill Due' ? 'warning' : 'success'
      })}
      duplicateRecord={(record): PrescriptionRecord => ({ ...record, id: `RX-${Date.now()}`, medication: `${record.medication} Copy`, statusLabel: 'Refill Due', statusTone: 'warning' })}
      getSearchText={(record) => [record.medication, record.dosage, record.instructions, record.prescribedBy, record.statusLabel].join(' ').toLowerCase()}
      getMenuMeta={(record) => formatDate(record.prescribedDate)}
      getRowGridTemplate={() => 'minmax(180px, 1.2fr) minmax(280px, 1.8fr) minmax(180px, 1.1fr) minmax(120px, 0.8fr)'}
      modalTitle={{ create: 'New Prescription Record', edit: 'Edit Prescription Record' }}
      modalDescription="Manage medications, dosage patterns, refills, and prescribing dentist notes."
      getFieldOptions={(field) => {
        if (field.key === 'templateName') {
          return prescriptionTemplates.map((template) => template.name);
        }
        return field.options;
      }}
      onDraftFieldChange={(fieldKey, value) => {
        if (fieldKey !== 'templateName') {
          return;
        }

        const selectedTemplate = templateByName[value];
        if (!selectedTemplate) {
          return {
            medication: '',
            dosage: '',
            instructions: ''
          };
        }

        return {
          medication: selectedTemplate.name,
          dosage: selectedTemplate.description || '',
          instructions: selectedTemplate.details || ''
        };
      }}
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}

function StatusPill({ label, tone }: { label: string; tone: PrescriptionRecord['statusTone'] }) {
  return <span className={`patient-module-status patient-module-status--${tone}`}>{label}</span>;
}
