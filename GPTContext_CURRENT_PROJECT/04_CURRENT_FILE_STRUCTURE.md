# Current File Structure

## PDF Designer Folder

Path: `src/features/clinic-subsystem/pdf-designer/`

| File | Role |
|---|---|
| `PDFDesignerPage.tsx` | Main Modify PDF workspace, settings UI, preview, print/download. |
| `modifyPdfSettings.ts` | Global settings types, defaults, localStorage persistence, theme mapping. |
| `capturePrintableDocument.ts` | DOM clone and html2canvas capture helper. |
| `getPrintablePages.ts` | Detects multi-page print sections. |
| `ConfigurableDocumentHeader.tsx` | Configurable clinic document header renderer. |
| `ClinicDocumentBrand.tsx` | Clinic brand display helper. |
| `PatientRecordPrintForm.tsx` | Patient information printable form. |
| `DentalChartPrintForm.tsx` | Dental chart printable form. |
| `TreatmentRecordPrintForm.tsx` | Treatment record printable form. |
| `CertificatePrintForm.tsx` | Certificate printable form. |
| `ConsentPrintForm.tsx` | Consent printable form. |
| `ContractPrintForm.tsx` | Multi-page contract printable form. |
| `optimizeUploadedImage.ts` | Image optimization for localStorage-safe data URLs. |
| `templateTypes.ts` | Legacy/general template type definitions. |
| `pdfDesigner.mock.ts` | Mock templates/data. |
| `BrandingSettings.tsx` | Branding settings component. |
| `SectionManager.tsx` | Section visibility/order component. |
| `TemplateEditor.tsx` | Template editing component. |
| `TemplateList.tsx` | Template list component. |
| `*.test.tsx`, `*.test.ts` | Unit and component tests. |

## Patient Certificates Folder

Path: `src/features/clinic-subsystem/patients/clinical/certificates/`

| File | Role |
|---|---|
| `PatientFormsWorkspace.tsx` | Patient document workspace and PDF export for active patient forms. |
| `contractFormStore.ts` | Patient-specific contract localStorage helpers. |
| `CertificateManager.tsx` | Certificate record CRUD shell. |
| `CertificateForm.tsx` | Certificate add/edit modal form. |
| `CertificateList.tsx` | Certificate list UI. |
| `CertificateCard.tsx` | Certificate card UI. |
| `CertificatePreview.tsx` | Certificate preview UI. |
| `certificateTypes.ts` | Certificate domain types. |
| `certificateUtils.ts` | Certificate date/display helpers. |

## Global CSS

Path: `src/index.css`

Important CSS zones:

- `.patient-print-form`
- `.dental-chart-print`
- `.treatment-record-print`
- `.certificate-print-form`
- `.consent-print-form`
- `.contract-print-form`
- `.configurable-document-header`
- `.pdf-document-theme`
- `.pdf-designer__export-pages`
- `.patient-forms-workspace`
- `.patient-forms-history-rail`
- print media rules for `pdf-designer-printing` and `pdf-designer-printing-multiple`

## Test Files

Current tests cover printable forms, settings persistence behavior, configurable document header, and capture behavior.
