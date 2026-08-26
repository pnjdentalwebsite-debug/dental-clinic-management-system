export type CertificateTypeId = 'dental-clearance' | 'treatment-certificate' | 'consultation-certificate' | 'custom';

export type CertificateStatus = 'Draft' | 'Issued' | 'Archived';

export type CertificateFilter = 'All' | 'Draft' | 'Issued' | 'Archived';

export type CertificateSort = 'newest' | 'oldest';

export interface CertificateTypeOption {
  id: CertificateTypeId;
  label: string;
  description: string;
  fields: string[];
}

export interface CertificateRecord {
  id: string;
  patientId: string;
  certificateType: CertificateTypeId;
  title: string;
  issuedDate: string;
  dentist: string;
  clinicName: string;
  purpose: string;
  remarks: string;
  status: CertificateStatus;
  createdAt: string;
}

export interface CertificateFormValues {
  certificateType: CertificateTypeId;
  title: string;
  issuedDate: string;
  dentist: string;
  purpose: string;
  remarks: string;
  status: CertificateStatus;
}
