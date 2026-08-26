import type { PDFTemplate } from './templateTypes';

const now = new Date().toISOString();

export const pdfDesignerTemplates: PDFTemplate[] = [
  {
    id: 'tmpl-dental-clearance',
    name: 'Dental Clearance',
    documentType: 'dental-clearance-certificate',
    sections: [
      { id: 'patient-info', title: 'Patient Information', visible: true, order: 1, contentType: 'patient' },
      { id: 'dental-findings', title: 'Dental Findings', visible: true, order: 2, contentType: 'findings' },
      { id: 'dentist-info', title: 'Dentist Information', visible: true, order: 3, contentType: 'dentist' },
      { id: 'signature-area', title: 'Signature Area', visible: true, order: 4, contentType: 'signature' },
      { id: 'footer', title: 'Footer', visible: true, order: 5, contentType: 'footer' }
    ],
    branding: {
      clinicName: 'Angelo Dental Clinic',
      clinicAddress: 'Main Branch, Dental Avenue',
      contactNumber: '+63 912 345 6789',
      logo: 'CLINIC LOGO',
      footerText: 'Prepared using the clinic PDF designer foundation.'
    },
    pageOrientation: 'portrait',
    margins: 'standard',
    headerPosition: 'top',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'tmpl-treatment-certificate',
    name: 'Treatment Certificate',
    documentType: 'treatment-certificate',
    sections: [
      { id: 'patient-info', title: 'Patient Information', visible: true, order: 1, contentType: 'patient' },
      { id: 'treatment-info', title: 'Treatment Information', visible: true, order: 2, contentType: 'treatment' },
      { id: 'dentist-info', title: 'Dentist Information', visible: true, order: 3, contentType: 'dentist' },
      { id: 'signature-area', title: 'Signature Area', visible: true, order: 4, contentType: 'signature' },
      { id: 'footer', title: 'Footer', visible: true, order: 5, contentType: 'footer' }
    ],
    branding: {
      clinicName: 'Angelo Dental Clinic',
      clinicAddress: 'Main Branch, Dental Avenue',
      contactNumber: '+63 912 345 6789',
      logo: 'CLINIC LOGO',
      footerText: 'Prepared using the clinic PDF designer foundation.'
    },
    pageOrientation: 'portrait',
    margins: 'standard',
    headerPosition: 'top',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'tmpl-dental-chart-report',
    name: 'Dental Chart Report',
    documentType: 'dental-chart-report',
    sections: [
      { id: 'patient-info', title: 'Patient Information', visible: true, order: 1, contentType: 'patient' },
      { id: 'chart-summary', title: 'Dental Findings', visible: true, order: 2, contentType: 'chart' },
      { id: 'recommendation', title: 'Recommendations', visible: true, order: 3, contentType: 'recommendation' },
      { id: 'signature-area', title: 'Signature Area', visible: true, order: 4, contentType: 'signature' },
      { id: 'footer', title: 'Footer', visible: true, order: 5, contentType: 'footer' }
    ],
    branding: {
      clinicName: 'Angelo Dental Clinic',
      clinicAddress: 'Main Branch, Dental Avenue',
      contactNumber: '+63 912 345 6789',
      logo: 'CLINIC LOGO',
      footerText: 'Prepared using the clinic PDF designer foundation.'
    },
    pageOrientation: 'landscape',
    margins: 'compact',
    headerPosition: 'compact',
    createdAt: now,
    updatedAt: now
  },
  {
    id: 'tmpl-patient-info',
    name: 'Patient Information Report',
    documentType: 'patient-information-report',
    sections: [
      { id: 'patient-info', title: 'Patient Information', visible: true, order: 1, contentType: 'patient' },
      { id: 'medical-info', title: 'Medical Information', visible: true, order: 2, contentType: 'medical' },
      { id: 'appointments', title: 'Appointment History', visible: true, order: 3, contentType: 'appointments' },
      { id: 'footer', title: 'Footer', visible: true, order: 4, contentType: 'footer' }
    ],
    branding: {
      clinicName: 'Angelo Dental Clinic',
      clinicAddress: 'Main Branch, Dental Avenue',
      contactNumber: '+63 912 345 6789',
      logo: 'CLINIC LOGO',
      footerText: 'Prepared using the clinic PDF designer foundation.'
    },
    pageOrientation: 'portrait',
    margins: 'standard',
    headerPosition: 'top',
    createdAt: now,
    updatedAt: now
  }
];
