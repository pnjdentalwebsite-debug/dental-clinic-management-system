# 19 Final Rebuild Prompt

```text
Modify the current PDF generator to reproduce the target PDF output exactly.

You are working in a React + TypeScript + Vite dental clinic project. The current PDF system is browser-side and DOM-based. Do not replace it unless explicitly requested. Printable React components render HTML/CSS pages at 680px x 962px, html2canvas captures the DOM at scale 3, and jsPDF writes each captured PNG into an A4 portrait page at 0,0,210,297mm.

Core files:
- src/features/clinic-subsystem/pdf-designer/PDFDesignerPage.tsx
- src/features/clinic-subsystem/pdf-designer/modifyPdfSettings.ts
- src/features/clinic-subsystem/pdf-designer/capturePrintableDocument.ts
- src/features/clinic-subsystem/pdf-designer/getPrintablePages.ts
- src/features/clinic-subsystem/pdf-designer/ConfigurableDocumentHeader.tsx
- src/features/clinic-subsystem/pdf-designer/PatientRecordPrintForm.tsx
- src/features/clinic-subsystem/pdf-designer/DentalChartPrintForm.tsx
- src/features/clinic-subsystem/pdf-designer/TreatmentRecordPrintForm.tsx
- src/features/clinic-subsystem/pdf-designer/CertificatePrintForm.tsx
- src/features/clinic-subsystem/pdf-designer/ConsentPrintForm.tsx
- src/features/clinic-subsystem/pdf-designer/ContractPrintForm.tsx
- src/features/clinic-subsystem/patients/clinical/certificates/PatientFormsWorkspace.tsx
- src/index.css

Preserve printable roots:
- data-pdf-print-root="patient-form"
- data-pdf-print-root="dental-chart"
- data-pdf-print-root="treatment-record"
- data-pdf-print-root="certificate-form"
- data-pdf-print-root="consent-form"
- data-pdf-print-root="contract-form"

Preserve Contract Form page markers:
- data-pdf-page="contract-page-1"
- data-pdf-page="contract-page-2"
- data-pdf-page="contract-page-3"
- data-pdf-page="contract-page-4"

Current A4 implementation:
- DOM page width: 680px
- DOM page height: 962px
- jsPDF page: A4 portrait
- jsPDF unit: mm
- image insertion: PNG at 0,0,210,297
- html2canvas scale: 3
- capture background: #ffffff
- useCORS: true

Modify visual output by changing JSX structure and src/index.css. Treat the 680x962 DOM page as the coordinate system. Convert the target PDF reference into CSS padding, grid-template-columns, gaps, margins, table column widths, font sizes, line heights, borders, and page sections.

For Patient Form:
- edit PatientRecordPrintForm.tsx and .patient-print-form CSS
- preserve auto-filled patient data and section visibility
- match personal info, contact, dental history, medical history, allergies, questionnaire, photo, and signature layout

For Dental Chart Form:
- edit DentalChartPrintForm.tsx and .dental-chart-print CSS
- preserve tooth arrays, condition mapping, surface markings, and dentalChart data binding
- match tooth positions, numbering, SVG symbols, legend, x-ray, recommendations, remarks, and footer

For Treatment Record:
- edit TreatmentRecordPrintForm.tsx and .treatment-record-print CSS
- preserve PrintableTreatmentRow mapping
- match table columns, row heights, borders, title, and signature section

For Certificate Form:
- edit CertificatePrintForm.tsx and .certificate-print-form CSS
- preserve header, patient name/age, issue date, dentist/signature/license props
- match title typography, diagnosis lines, recommendation lines, date, and signature alignment

For Consent Form:
- edit ConsentPrintForm.tsx and .consent-print-form CSS
- preserve selectedMedicalConditions and selectedAllergies logic
- match checklist layout, paragraphs, risk section, page wrapping, and signatures

For Contract Form:
- edit ContractPrintForm.tsx and .contract-print-form CSS
- preserve four data-pdf-page sections unless page count intentionally changes
- match long text layout, terms, inclusions, non-inclusions, payment details, ledger table, and signatures

Do not remove settings behavior:
- localStorage key masterFileModifyPdfSettings
- custom event clinic:modify-pdf-settings-changed
- createDocumentHeaderSettings
- getDocumentThemePresentation

Do not capture the zoomed preview. Keep capturePrintableDocument cloning offscreen unless redesigning the engine.

After modification, verify:
- visible preview matches target
- browser print matches target
- downloaded PDF matches target
- no clipping at 680x962 capture size
- multi-page Contract Form exports all pages
- patient data still auto-fills correctly
```
