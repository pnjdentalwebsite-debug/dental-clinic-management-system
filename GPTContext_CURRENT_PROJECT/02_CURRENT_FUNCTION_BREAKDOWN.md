# Current Function Breakdown

## PDF Engine Helpers

| Function | File | Responsibility |
|---|---|---|
| `capturePrintableDocument` | `pdf-designer/capturePrintableDocument.ts` | Clones a printable element into an offscreen fixed host and captures it with `html2canvas`. |
| `getPrintablePages` | `pdf-designer/getPrintablePages.ts` | Returns child `[data-pdf-page]` elements when present, otherwise returns the root printable element. |
| `loadModifyPdfSettings` | `pdf-designer/modifyPdfSettings.ts` | Reads global Modify PDF settings from localStorage and merges with defaults. |
| `saveModifyPdfSettings` | `pdf-designer/modifyPdfSettings.ts` | Saves settings, verifies storage write, dispatches sync events. |
| `subscribeToModifyPdfSettings` | `pdf-designer/modifyPdfSettings.ts` | Subscribes to settings sync via custom event and storage event. |
| `createDocumentHeaderSettings` | `pdf-designer/modifyPdfSettings.ts` | Maps global settings into header props. |
| `getDocumentThemePresentation` | `pdf-designer/modifyPdfSettings.ts` | Converts style settings into CSS variables and class names. |
| `optimizeUploadedImage` | `pdf-designer/optimizeUploadedImage.ts` | Downscales uploaded images and converts to WebP for reliable browser storage. |

## Main Workspace Components

| Component | File | Responsibility |
|---|---|---|
| `PDFDesignerPage` | `pdf-designer/PDFDesignerPage.tsx` | Master settings editor, preview tabs, save/lock, print/export selected forms. |
| `PatientFormsWorkspace` | `patients/clinical/certificates/PatientFormsWorkspace.tsx` | Patient-side document preview, document selection, print/download, contract editor, dental chart history rail. |
| `PatientConfiguredDocument` | `PatientFormsWorkspace.tsx` | Chooses the correct printable form for the selected patient document. |
| `DentalChartHistoryRail` | `PatientFormsWorkspace.tsx` | Shows dental chart records under Dental Chart Form, 3 per page, selectable. |
| `ContractFormEditor` | `PatientFormsWorkspace.tsx` | Edits patient-specific contract fields and ledger rows. |

## Printable Form Components

| Component | File | Root Marker |
|---|---|---|
| `PatientRecordPrintForm` | `pdf-designer/PatientRecordPrintForm.tsx` | `data-pdf-print-root="patient-form"` |
| `DentalChartPrintForm` | `pdf-designer/DentalChartPrintForm.tsx` | `data-pdf-print-root="dental-chart"` |
| `TreatmentRecordPrintForm` | `pdf-designer/TreatmentRecordPrintForm.tsx` | `data-pdf-print-root="treatment-record"` |
| `CertificatePrintForm` | `pdf-designer/CertificatePrintForm.tsx` | `data-pdf-print-root="certificate-form"` |
| `ConsentPrintForm` | `pdf-designer/ConsentPrintForm.tsx` | `data-pdf-print-root="consent-form"` |
| `ContractPrintForm` | `pdf-designer/ContractPrintForm.tsx` | `data-pdf-print-root="contract-form"` |

## Settings Mutation Functions

- `updateSettings`: blocks edits when template is locked.
- `updateField`: updates a top-level settings field.
- `updatePagesToExport`: toggles a form in the multi-form export list.
- `updateModuleVisibility`: toggles dentist name/signature visibility per module.
- `moveHeaderItem`: reorders the three header zones.
- `movePatientSection`: reorders patient information sections.
- `togglePatientSectionVisibility`: hides or shows a patient section.
- `updateMarginField`: edits image margins.
- `updateImageField`: optimizes image upload and stores image data.
- `saveConfiguration`: persists settings and publishes synchronization events.
- `toggleTemplateLock`: locks/unlocks settings and saves when locking.

## Export Functions

- `printPreviewPage`: Master workspace print for enabled pages using `pdf-designer-printing-multiple`.
- `downloadPreviewPage`: Master workspace PDF export into `clinic-selected-forms.pdf`.
- `printDocument`: Patient workspace print for active document using `pdf-designer-printing`.
- `downloadDocument`: Patient workspace PDF export into `<patientId>-<activeDocument>.pdf`.
