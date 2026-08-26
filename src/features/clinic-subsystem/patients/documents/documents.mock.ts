import type { PatientPreviewItem } from '../components/patientTypes';
import type {
  PatientDocumentHistoryItem,
  PatientDocumentPreviewModel,
  PatientDocumentTypeOption
} from './documentTypes';

export const patientDocumentTypes: PatientDocumentTypeOption[] = [
  {
    id: 'patient-information-report',
    label: 'Patient Information Report',
    description: 'Personal patient summary and registration details.',
    templateId: 'tmpl-patient-info',
    source: 'Patient Profile Data'
  },
  {
    id: 'dental-chart-report',
    label: 'Dental Chart Report',
    description: 'Visual dental findings report with chart notes and recommendations.',
    templateId: 'tmpl-dental-chart-report',
    source: 'Dental Chart Module'
  },
  {
    id: 'treatment-history-report',
    label: 'Treatment History Report',
    description: 'Completed dental procedures and treatment workflow summary.',
    templateId: 'tmpl-treatment-certificate',
    source: 'Treatment Record Module'
  },
  {
    id: 'certificate-document',
    label: 'Certificate',
    description: 'Official clinic document generated from certificate history.',
    templateId: 'tmpl-dental-clearance',
    source: 'Certificate Management Module'
  }
];

export const buildPatientDocumentsHistory = (patient: PatientPreviewItem): PatientDocumentHistoryItem[] => [
  {
    id: 'doc-history-1',
    patientId: patient.id,
    title: 'Patient Information Report',
    documentType: 'patient-information-report',
    templateId: 'tmpl-patient-info',
    createdDate: 'July 29, 2026',
    status: 'Generated',
    dataSource: ['Patient profile', 'Contact details', 'Medical history'],
    createdAt: '2026-07-29T08:15:00.000Z'
  },
  {
    id: 'doc-history-2',
    patientId: patient.id,
    title: 'Dental Chart Report',
    documentType: 'dental-chart-report',
    templateId: 'tmpl-dental-chart-report',
    createdDate: 'July 28, 2026',
    status: 'Draft',
    dataSource: ['Dental chart', 'Condition markers', 'Clinical notes'],
    createdAt: '2026-07-28T15:40:00.000Z'
  },
  {
    id: 'doc-history-3',
    patientId: patient.id,
    title: 'Treatment History Report',
    documentType: 'treatment-history-report',
    templateId: 'tmpl-treatment-certificate',
    createdDate: 'July 27, 2026',
    status: 'Archived',
    dataSource: ['Procedures', 'Dentist notes', 'Billing history'],
    createdAt: '2026-07-27T10:30:00.000Z'
  }
];

export function buildPatientDocumentPreview(
  patient: PatientPreviewItem,
  documentType: PatientDocumentTypeOption,
  history: PatientDocumentHistoryItem[]
): PatientDocumentPreviewModel {
  const sectionMap: Record<PatientDocumentTypeOption['id'], PatientDocumentPreviewModel['sections']> = {
    'patient-information-report': [
      {
        title: 'Patient Information',
        lines: [
          `Patient Name: ${patient.name}`,
          `Birth Date: ${patient.birthDate}`,
          `Sex: ${patient.sex}`,
          `Address: ${patient.address}`,
          `Medical History: ${patient.medicalHistory}`
        ]
      },
      {
        title: 'Registration Notes',
        lines: [
          `First Visit: ${patient.firstVisit}`,
          `Recall Date: ${patient.recallDate}`,
          `Balance: ${patient.balance}`
        ]
      }
    ],
    'dental-chart-report': [
      {
        title: 'Clinical Findings',
        lines: [
          `Primary dental notes: ${patient.dentalNotes}`,
          `Allergies: ${patient.allergies}`,
          `Medical notes: ${patient.medicalNotes}`
        ]
      },
      {
        title: 'Recommendations',
        lines: [
          'Monitor oral hygiene and recall schedule.',
          'Review charted findings during the next consultation.',
          `Patient status: ${patient.status}`
        ]
      }
    ],
    'treatment-history-report': [
      {
        title: 'Treatment History',
        lines: [
          'Cleaning - Completed - Dr. Santos - PHP 1,200',
          'Extraction - Completed - Dr. Reyes - PHP 2,500',
          'Consultation - Scheduled - Dr. Cruz - PHP 500'
        ]
      },
      {
        title: 'Balance Summary',
        lines: [
          `Current balance: ${patient.balance}`,
          `Upcoming appointment: ${patient.upcomingAppointments[0] || 'None scheduled'}`,
          `Previous appointment: ${patient.previousAppointments[0] || 'None recorded'}`
        ]
      }
    ],
    'certificate-document': [
      {
        title: 'Certificate Information',
        lines: [
          'Certificate Type: Dental Clearance',
          `Patient Name: ${patient.name}`,
          'Dentist: Dr. Santos',
          'Issue Date: July 29, 2026'
        ]
      },
      {
        title: 'Remarks',
        lines: ['Issued for official clinic verification.', 'Prepared from certificate management history.']
      }
    ]
  };

  return {
    patient,
    documentType,
    templateName: documentType.label,
    sections: [
      {
        title: 'Clinic Branding',
        lines: ['Angelo Dental Clinic', 'Main Branch', 'Printable patient document preview']
      },
      ...sectionMap[documentType.id],
      {
        title: 'Source Summary',
        lines: [`Patient ID: ${patient.id}`, `Contact: ${patient.contact}`, `Template: ${documentType.templateId}`, `Source module: ${documentType.source}`]
      }
    ],
    history
  };
}
