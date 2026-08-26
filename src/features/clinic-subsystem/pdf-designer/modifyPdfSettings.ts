import type { CSSProperties } from 'react';
import type {
  DocumentHeaderItemKey,
  DocumentHeaderSettings
} from './ConfigurableDocumentHeader';

export type ModifyPdfPageKey =
  | 'patient-information-form'
  | 'dental-chart-form'
  | 'treatment-record'
  | 'certificate-form'
  | 'consent-form'
  | 'contract-form';

export type ModifyPdfHeaderItemKey = DocumentHeaderItemKey;

export type ModifyPdfModuleVisibilityKey =
  | 'patient-information-record'
  | 'dental-chart'
  | 'treatment-record'
  | 'certificate-form'
  | 'consent-form'
  | 'contract-form';

export type ModifyPdfSectionItem = {
  id: string;
  label: string;
  visible: boolean;
};

export interface ModifyPdfSettings {
  locked: boolean;
  pagesToExport: Record<ModifyPdfPageKey, boolean>;
  headerLayoutOrder: ModifyPdfHeaderItemKey[];
  clinicName: string;
  showClinicName: boolean;
  address: string;
  showAddress: boolean;
  contact: string;
  showContact: boolean;
  headerBottomMargin: number;
  badgeText: string;
  showBadge: boolean;
  badgeMarginTop: number;
  badgeMarginBottom: number;
  leftImageName: string;
  showLeftImage: boolean;
  showLeftImageOutline: boolean;
  leftImageSize: number;
  leftImageMargins: { top: number; bottom: number; left: number; right: number };
  middleImageName: string;
  showMiddleImage: boolean;
  middleImageSize: number;
  middleImageMargins: { top: number; bottom: number; left: number; right: number };
  rightImageName: string;
  showRightImage: boolean;
  imageFit: string;
  cropPositionX: number;
  cropPositionY: number;
  rightImageMargins: { top: number; bottom: number; left: number; right: number };
  dentistName: string;
  dentistTitle: string;
  dentistLicense: string;
  signatureSource: string;
  signatureImageData: string;
  signatureSize: number;
  placementStrategy: string;
  visibilityByModule: Record<ModifyPdfModuleVisibilityKey, { showName: boolean; showSignature: boolean }>;
  patientFormSections: ModifyPdfSectionItem[];
  chartMainTitle: string;
  showChartTitle: boolean;
  showLegend: boolean;
  showFindings: boolean;
  showRecommendations: boolean;
  showFooter: boolean;
  treatmentTableTitle: string;
  showTreatmentTitle: boolean;
  showDentistColumn: boolean;
  showBalanceColumn: boolean;
  rowHeightDensity: string;
  certificateTitle: string;
  certificateIntro: string;
  consentTitle: string;
  contractTitle: string;
  fontSize: string;
  labelSize: string;
  lineSpacing: string;
  borderStyle: string;
  underlineStyle: string;
  sectionSeparator: string;
  overflowBehavior: string;
  spacingDensity: string;
}

export const modifyPdfStorageKey = 'masterFileModifyPdfSettings';
export const modifyPdfSettingsChangedEvent = 'clinic:modify-pdf-settings-changed';

export const defaultModifyPdfSettings: ModifyPdfSettings = {
  locked: true,
  pagesToExport: {
    'patient-information-form': true,
    'dental-chart-form': true,
    'treatment-record': true,
    'certificate-form': true,
    'consent-form': true,
    'contract-form': true
  },
  headerLayoutOrder: ['left-image', 'clinic-info-logo', 'right-photo'],
  clinicName: 'P & J TANARTE',
  showClinicName: true,
  address: 'BAYAN LUMA IV IMUS CAVITE',
  showAddress: true,
  contact: '0953 834 3062',
  showContact: true,
  headerBottomMargin: 8,
  badgeText: 'PATIENT RECORD',
  showBadge: true,
  badgeMarginTop: 8,
  badgeMarginBottom: 8,
  leftImageName: '',
  showLeftImage: true,
  showLeftImageOutline: true,
  leftImageSize: 65,
  leftImageMargins: { top: 0, bottom: 0, left: 0, right: 0 },
  middleImageName: '',
  showMiddleImage: false,
  middleImageSize: 50,
  middleImageMargins: { top: 0, bottom: 0, left: 16, right: 16 },
  rightImageName: '',
  showRightImage: true,
  imageFit: 'Cover (Crop to fit)',
  cropPositionX: 50,
  cropPositionY: 50,
  rightImageMargins: { top: 0, bottom: 0, left: 0, right: 0 },
  dentistName: 'No doctor selected yet',
  dentistTitle: 'Attending Dentist',
  dentistLicense: '',
  signatureSource: 'No signature saved for selected doctor',
  signatureImageData: '',
  signatureSize: 100,
  placementStrategy: 'Right Align',
  visibilityByModule: {
    'patient-information-record': { showName: false, showSignature: false },
    'dental-chart': { showName: true, showSignature: false },
    'treatment-record': { showName: true, showSignature: false },
    'certificate-form': { showName: true, showSignature: false },
    'consent-form': { showName: true, showSignature: false },
    'contract-form': { showName: true, showSignature: false }
  },
  patientFormSections: [
    { id: 'patient-information-record', label: 'Patient Information Record', visible: true },
    { id: 'minor-referral-details', label: 'Minor / Referral Details', visible: true },
    { id: 'dental-history', label: 'Dental History', visible: true },
    { id: 'medical-history', label: 'Medical History', visible: true },
    { id: 'medical-questions', label: 'Medical Questions', visible: true },
    { id: 'allergies', label: 'Allergies', visible: true },
    { id: 'health-details', label: 'Health Details', visible: true },
    { id: 'for-women-only', label: 'For Women Only', visible: true },
    { id: 'medical-conditions-checklist', label: 'Medical Conditions Checklist', visible: true },
    { id: 'signature-consent', label: 'Signature & Consent', visible: true }
  ],
  chartMainTitle: 'DENTAL STATUS CHART',
  showChartTitle: true,
  showLegend: true,
  showFindings: true,
  showRecommendations: true,
  showFooter: true,
  treatmentTableTitle: 'TREATMENT RECORD',
  showTreatmentTitle: true,
  showDentistColumn: true,
  showBalanceColumn: true,
  rowHeightDensity: 'Compact (Fits More)',
  certificateTitle: 'DENTAL CERTIFICATE',
  certificateIntro: 'To Whom It May Concern:',
  consentTitle: 'ORAL SURGERY CONSENT FORM',
  contractTitle: 'CONTRACT FOR ORTHODONTIC TREATMENT',
  fontSize: 'Medium',
  labelSize: 'Medium',
  lineSpacing: 'Normal',
  borderStyle: 'Solid Black',
  underlineStyle: 'Solid',
  sectionSeparator: 'None',
  overflowBehavior: 'Truncate',
  spacingDensity: 'Compact'
};

export function loadModifyPdfSettings(): ModifyPdfSettings {
  try {
    const raw = localStorage.getItem(modifyPdfStorageKey);
    if (!raw) return defaultModifyPdfSettings;
    const parsed = JSON.parse(raw) as Partial<ModifyPdfSettings>;
    return {
      ...defaultModifyPdfSettings,
      ...parsed,
      pagesToExport: { ...defaultModifyPdfSettings.pagesToExport, ...parsed.pagesToExport },
      visibilityByModule: {
        ...defaultModifyPdfSettings.visibilityByModule,
        ...parsed.visibilityByModule
      },
      headerLayoutOrder: Array.isArray(parsed.headerLayoutOrder) && parsed.headerLayoutOrder.length > 0
        ? parsed.headerLayoutOrder as ModifyPdfHeaderItemKey[]
        : defaultModifyPdfSettings.headerLayoutOrder,
      patientFormSections: Array.isArray(parsed.patientFormSections) && parsed.patientFormSections.length > 0
        ? parsed.patientFormSections
        : defaultModifyPdfSettings.patientFormSections
    };
  } catch {
    return defaultModifyPdfSettings;
  }
}

export function saveModifyPdfSettings(settings: ModifyPdfSettings): boolean {
  try {
    const serializedSettings = JSON.stringify(settings);
    localStorage.setItem(modifyPdfStorageKey, serializedSettings);
    if (localStorage.getItem(modifyPdfStorageKey) !== serializedSettings) return false;

    window.dispatchEvent(new StorageEvent('storage', {
      key: modifyPdfStorageKey,
      newValue: serializedSettings
    }));
    window.dispatchEvent(new CustomEvent<ModifyPdfSettings>(
      modifyPdfSettingsChangedEvent,
      { detail: settings }
    ));
    return true;
  } catch {
    return false;
  }
}

export function subscribeToModifyPdfSettings(
  listener: (settings: ModifyPdfSettings) => void
) {
  const publishLatestSettings = () => listener(loadModifyPdfSettings());
  const handleSettingsChanged = (event: Event) => {
    const settings = (event as CustomEvent<ModifyPdfSettings>).detail;
    listener(settings || loadModifyPdfSettings());
  };
  const handleStorage = (event: StorageEvent) => {
    if (event.key === modifyPdfStorageKey) publishLatestSettings();
  };

  window.addEventListener(modifyPdfSettingsChangedEvent, handleSettingsChanged);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(modifyPdfSettingsChangedEvent, handleSettingsChanged);
    window.removeEventListener('storage', handleStorage);
  };
}

export function createDocumentHeaderSettings(settings: ModifyPdfSettings): DocumentHeaderSettings {
  return {
    order: settings.headerLayoutOrder,
    clinicName: settings.clinicName,
    showClinicName: settings.showClinicName,
    address: settings.address,
    showAddress: settings.showAddress,
    contact: settings.contact,
    showContact: settings.showContact,
    bottomMargin: settings.headerBottomMargin,
    leftImageData: settings.leftImageName,
    showLeftImage: settings.showLeftImage,
    showLeftImageOutline: settings.showLeftImageOutline,
    leftImageSize: settings.leftImageSize,
    leftImageMargins: settings.leftImageMargins,
    middleImageData: settings.middleImageName,
    showMiddleImage: settings.showMiddleImage,
    middleImageSize: settings.middleImageSize,
    middleImageMargins: settings.middleImageMargins,
    rightImageData: settings.rightImageName,
    showRightImage: settings.showRightImage,
    imageFit: settings.imageFit,
    cropPositionX: settings.cropPositionX,
    cropPositionY: settings.cropPositionY,
    rightImageMargins: settings.rightImageMargins
  };
}

export function getDocumentThemePresentation(settings: ModifyPdfSettings) {
  const style = {
    '--pdf-font-scale': settings.fontSize === 'Small' ? 0.9 : settings.fontSize === 'Large' ? 1.1 : 1,
    '--pdf-label-scale': settings.labelSize === 'Small' ? 0.9 : settings.labelSize === 'Large' ? 1.1 : 1,
    '--pdf-line-height': settings.lineSpacing === 'Compact' ? 1.15 : settings.lineSpacing === 'Relaxed' ? 1.55 : 1.35
  } as CSSProperties;
  const className = [
    'pdf-document-theme',
    `is-border-${slugifySetting(settings.borderStyle)}`,
    `is-underline-${slugifySetting(settings.underlineStyle)}`,
    `is-separator-${slugifySetting(settings.sectionSeparator)}`,
    `is-overflow-${slugifySetting(settings.overflowBehavior)}`,
    `is-spacing-${slugifySetting(settings.spacingDensity)}`
  ].join(' ');

  return { className, style };
}

function slugifySetting(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
