export type PDFDocumentTypeId =
  | 'dental-clearance-certificate'
  | 'treatment-certificate'
  | 'dental-chart-report'
  | 'patient-information-report';

export interface BrandingSettings {
  clinicName: string;
  clinicAddress: string;
  contactNumber: string;
  logo: string;
  footerText: string;
}

export interface DocumentSection {
  id: string;
  title: string;
  visible: boolean;
  order: number;
  contentType: string;
}

export interface PDFTemplate {
  id: string;
  name: string;
  documentType: PDFDocumentTypeId;
  sections: DocumentSection[];
  branding: BrandingSettings;
  pageOrientation: 'portrait' | 'landscape';
  margins: 'compact' | 'standard' | 'spacious';
  headerPosition: 'top' | 'center' | 'compact';
  createdAt: string;
  updatedAt: string;
}
