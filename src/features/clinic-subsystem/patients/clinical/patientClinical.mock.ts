import type { PatientPreviewItem } from '../components/patientTypes';
import type { ClinicalModuleStatus, PatientClinicalSummary, PatientClinicalTab } from './patientClinicalTypes';

export const patientClinicalTabs: PatientClinicalTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'Patient summary and clinical readiness snapshot.',
    status: 'available'
  },
  {
    id: 'dental-chart',
    label: 'Dental Chart',
    description: 'Interactive tooth charting and clinical findings workspace.',
    status: 'available'
  },
  {
    id: 'progress-notes',
    label: 'Progress Notes',
    description: 'Clinical visit notes, treatment plans, attachments, and progress billing.',
    status: 'available'
  },
  {
    id: 'certificates',
    label: 'Certificates',
    description: 'Certificate history, creation workflow, and document preview.',
    status: 'available'
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    description: 'Medication orders, prescription history, and refill tracking.',
    status: 'available'
  },
  {
    id: 'bills-payments',
    label: 'Bills & Payments',
    description: 'Billing ledger, payment entries, and settlement references.',
    status: 'available'
  },
  {
    id: 'upload-xrays',
    label: 'Upload / Xrays',
    description: 'Radiograph uploads, viewing slots, and imaging notes.',
    status: 'available'
  },
  {
    id: 'dental-recalls',
    label: 'Dental Recalls',
    description: 'Recall cadence, reminders, and follow-up tracking.',
    status: 'available'
  },
  {
    id: 'appointments',
    label: 'Appointments',
    description: 'Patient-specific appointment history and linked schedule data.',
    status: 'available'
  },
  {
    id: 'scratchpad-notes',
    label: 'Scratchpad Notes',
    description: 'Quick working notes for chairside references and reminders.',
    status: 'available'
  },
  {
    id: 'followup-lists',
    label: 'Followup Lists',
    description: 'Actionable follow-up queues for unfinished clinical tasks.',
    status: 'available'
  }
];

const emptyChartStatus: ClinicalModuleStatus = {
  id: 'dental-chart-status',
  title: 'Dental Chart Status',
  statusLabel: 'No chart created',
  description: 'Clinical charting is prepared for the next implementation phase.',
  tone: 'neutral'
};

const emptyTreatmentStatus: ClinicalModuleStatus = {
  id: 'active-treatment-status',
  title: 'Active Treatments',
  statusLabel: 'Treatment workspace ready',
  description: 'Open the Treatment Record tab to manage patient treatment history.',
  tone: 'ready'
};

const emptyCertificateStatus: ClinicalModuleStatus = {
  id: 'certificate-status',
  title: 'Certificates',
  statusLabel: 'Certificate workflow ready',
  description: 'Open the Certificates tab to create patient documents.',
  tone: 'ready'
};

export const buildPatientClinicalSummary = (patient: PatientPreviewItem): PatientClinicalSummary => ({
  patient,
  chartStatus: emptyChartStatus,
  treatmentStatus: emptyTreatmentStatus,
  recentActivity: [emptyCertificateStatus.statusLabel]
});
