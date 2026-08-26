# Current AI Rebuild Prompt

Use this prompt when asking another AI to rebuild or modify the current PDF/document system.

```text
You are working in a React + TypeScript + Vite dental clinic project. Rebuild or modify the existing frontend PDF/document system while preserving current behavior.

The system is client-side. Printable React components render A4-like HTML/CSS forms. Browser print uses body classes and window.print(). PDF download dynamically imports html2canvas and jsPDF, captures printable DOM into canvases, then places each canvas as a full A4 image in a jsPDF document.

Core folders:
- src/features/clinic-subsystem/pdf-designer/
- src/features/clinic-subsystem/patients/clinical/certificates/
- src/index.css

Supported documents:
- Patient Information Form
- Dental Chart Form
- Treatment Record
- Certificate Form
- Consent Form
- Contract Form

Preserve these printable root markers:
- data-pdf-print-root="patient-form"
- data-pdf-print-root="dental-chart"
- data-pdf-print-root="treatment-record"
- data-pdf-print-root="certificate-form"
- data-pdf-print-root="consent-form"
- data-pdf-print-root="contract-form"

Preserve multi-page behavior:
- getPrintablePages must return child [data-pdf-page] elements when present.
- Contract Form currently uses data-pdf-page sections for multiple PDF pages.

Preserve settings:
- localStorage key: masterFileModifyPdfSettings
- custom event: clinic:modify-pdf-settings-changed
- settings must include clinic identity, header order, image visibility/sizing/margins, dentist/signature visibility, page export toggles, patient form sections, dental chart options, treatment options, certificate/consent/contract titles, typography, borders, underlines, separators, overflow, and spacing density.

Preserve patient workspace:
- PatientFormsWorkspace renders Documents & Forms.
- It subscribes to Modify PDF settings changes.
- It supports zoom, print, and download PDF.
- It includes DentalChartHistoryRail under Dental Chart Form.
- DentalChartHistoryRail displays saved dental chart records, 3 per page, selected card with date, summary, and check icon.
- Contract form data persists to patientContractForm:<patientId>.

Export rules:
- html2canvas scale 3, white background, useCORS true.
- jsPDF portrait A4, unit mm, compress true.
- addImage PNG at 0,0,210,297.
- Master export saves clinic-selected-forms.pdf.
- Patient export saves <patientId>-<activeDocument>.pdf.

When changing UI, do not remove existing data flow, state, event handlers, localStorage keys, or print markers. Improve only the requested component. After edits, run tests or build when appropriate.
```
