import { ScanLine } from 'lucide-react';
import type { PatientPreviewItem } from '../../components/patientTypes';
import {
  PatientModuleScaffold,
  type PatientModuleColumn,
  type PatientModuleField,
  type PatientModuleRecordBase,
  type UploadPreviewState
} from '../shared/PatientModuleScaffold';
import { isSeededPatient } from '../shared/isSeededPatient';

interface UploadXrayRecord extends PatientModuleRecordBase {
  uploadedDate: string;
  fileName: string;
  uploadFile: string;
  imageType: string;
  notes: string;
  requestedBy: string;
  uploadPreview?: UploadPreviewState | null;
}

const fields: PatientModuleField[] = [
  { key: 'uploadedDate', label: 'Upload Date', type: 'date' },
  { key: 'fileName', label: 'File Name', type: 'text', placeholder: 'e.g. pano-2026-08-09.jpg' },
  { key: 'uploadFile', label: 'Upload Image / Video', type: 'file', span: true, accept: '.png,.jpg,.jpeg,.mp4,image/png,image/jpeg,video/mp4' },
  { key: 'imageType', label: 'Image Type', type: 'select', options: ['Panoramic', 'Periapical', 'Cephalometric', 'Photo Set'] },
  { key: 'requestedBy', label: 'Requested By', type: 'text', placeholder: 'Dentist / staff' },
  { key: 'notes', label: 'Imaging Notes', type: 'textarea', span: true, placeholder: 'Capture details, view, observations, upload notes...' },
  { key: 'statusLabel', label: 'Status', type: 'select', options: ['Uploaded', 'For Review', 'Archived'] }
];

const columns: PatientModuleColumn<UploadXrayRecord>[] = [
  {
    key: 'uploadedDate',
    label: 'Date Uploaded',
    render: (record) => <><strong>{formatDate(record.uploadedDate)}</strong><span>{record.imageType}</span></>,
    exportValue: (record) => `${record.uploadedDate} ${record.imageType}`
  },
  {
    key: 'fileName',
    label: 'File / Imaging Notes',
    render: (record) => (
      <>
        <strong className="patient-module-truncate" title={record.fileName}>{record.fileName}</strong>
        <span className="patient-module-truncate" title={record.notes}>{record.notes}</span>
      </>
    ),
    exportValue: (record) => `${record.fileName} ${record.notes}`
  },
  {
    key: 'requestedBy',
    label: 'Requested By',
    render: (record) => <><strong>{record.requestedBy}</strong><span>Radiograph intake</span></>,
    exportValue: (record) => record.requestedBy
  },
  {
    key: 'status',
    label: 'Status',
    render: (record) => <span className={`patient-module-status patient-module-status--${record.statusTone}`}>{record.statusLabel}</span>,
    exportValue: (record) => record.statusLabel
  }
];

export function UploadXrays({ patient }: { patient: PatientPreviewItem }) {
  return (
    <PatientModuleScaffold
      patient={patient}
      title="Upload / Xrays"
      icon={ScanLine}
      searchPlaceholder="Search file name, imaging notes, requestor..."
      newButtonLabel="New Upload Entry"
      exportFileName="upload-xrays"
      emptyTitle="No imaging uploads yet"
      emptyDescription="Maintain x-ray, photo set, and radiograph references for this patient."
      fields={fields}
      columns={columns}
      initialRecords={(currentPatient): UploadXrayRecord[] => (
        isSeededPatient(currentPatient)
          ? [
              {
                id: 'XRAY-001',
                uploadedDate: '2026-08-03',
                fileName: 'P001-panoramic-initial.jpg',
                uploadFile: 'P001-panoramic-initial.jpg',
                imageType: 'Panoramic',
                notes: 'Baseline panoramic capture before restorative planning.',
                requestedBy: 'Dr. Maria Jessica Tanarte',
                statusLabel: 'For Review',
                statusTone: 'warning',
                uploadPreview: null
              }
            ]
          : []
      )}
      createDraft={() => ({
        uploadedDate: '2026-08-09',
        fileName: '',
        uploadFile: '',
        imageType: 'Panoramic',
        requestedBy: '',
        notes: '',
        statusLabel: 'Uploaded'
      })}
      recordToDraft={(record) => ({
        uploadedDate: record.uploadedDate,
        fileName: record.fileName,
        uploadFile: record.uploadFile,
        imageType: record.imageType,
        notes: record.notes,
        requestedBy: record.requestedBy,
        statusLabel: record.statusLabel
      })}
      buildRecord={(draft, _patient, existingRecord, uploadPreview): UploadXrayRecord => ({
        id: existingRecord?.id || `XRAY-${Date.now()}`,
        uploadedDate: draft.uploadedDate,
        fileName: draft.fileName || draft.uploadFile,
        uploadFile: draft.uploadFile,
        imageType: draft.imageType,
        notes: draft.notes,
        requestedBy: draft.requestedBy,
        statusLabel: draft.statusLabel || 'Uploaded',
        statusTone: draft.statusLabel === 'Archived' ? 'neutral' : draft.statusLabel === 'For Review' ? 'warning' : 'success',
        uploadPreview: uploadPreview || existingRecord?.uploadPreview || null
      })}
      duplicateRecord={(record): UploadXrayRecord => ({ ...record, id: `XRAY-${Date.now()}`, fileName: `${record.fileName}.copy` })}
      getSearchText={(record) => [record.fileName, record.imageType, record.notes, record.requestedBy, record.statusLabel].join(' ').toLowerCase()}
      getMenuMeta={(record) => record.fileName}
      getRowGridTemplate={() => 'minmax(180px, 1.1fr) minmax(340px, 2fr) minmax(180px, 1fr) minmax(120px, 0.8fr)'}
      modalTitle={{ create: 'New Upload / Xray Entry', edit: 'Edit Upload / Xray Entry' }}
      modalDescription="Document imaging uploads, attach capture notes, and keep review status visible in the patient record."
      modalVariant="upload"
    />
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));
}
