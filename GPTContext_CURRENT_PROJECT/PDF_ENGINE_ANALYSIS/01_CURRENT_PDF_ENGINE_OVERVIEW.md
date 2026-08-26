# 01 Current PDF Engine Overview

## Engine Identity

The current PDF engine is a browser-side React DOM rendering engine. It does not generate PDF pages from coordinates in a PDF library directly. Instead, it renders printable React components as HTML, styles them with CSS to match A4 proportions, captures the rendered DOM with `html2canvas`, and writes each captured image into `jsPDF`.

## Engine Files

| Area | File |
|---|---|
| Settings and defaults | `src/features/clinic-subsystem/pdf-designer/modifyPdfSettings.ts` |
| Master PDF workspace | `src/features/clinic-subsystem/pdf-designer/PDFDesignerPage.tsx` |
| Patient document workspace | `src/features/clinic-subsystem/patients/clinical/certificates/PatientFormsWorkspace.tsx` |
| DOM capture helper | `src/features/clinic-subsystem/pdf-designer/capturePrintableDocument.ts` |
| Multi-page helper | `src/features/clinic-subsystem/pdf-designer/getPrintablePages.ts` |
| Shared header | `src/features/clinic-subsystem/pdf-designer/ConfigurableDocumentHeader.tsx` |
| Printable form CSS | `src/index.css` |

## PDF Library

- PDF library: `jspdf`
- DOM renderer: `html2canvas`
- Rendering method: HTML/CSS to canvas to PDF image
- Unit: `mm`
- Orientation: `portrait`
- PDF format: `a4`
- PDF compression: `true`

## Page Model

The visual page model is based on a 680px wide by 962px tall printable HTML element. During PDF insertion, that captured image is stretched into an A4 page at `210mm x 297mm`.

## Main Export Pipeline

```text
Patient / clinic data
-> React print component props
-> Printable HTML root with data-pdf-print-root
-> CSS A4-like page layout
-> Offscreen cloned DOM at 680px x 962px
-> html2canvas capture at scale 3
-> jsPDF A4 page
-> addImage PNG 0,0,210,297
-> Browser download
```

## Print Pipeline

```text
Printable React form
-> Body class added
-> CSS hides app UI and reveals print form
-> window.print()
-> afterprint cleanup
```

## Supported Modules

| Module | Component | Printable Root |
|---|---|---|
| Patient Form | `PatientRecordPrintForm` | `data-pdf-print-root="patient-form"` |
| Dental Chart Form | `DentalChartPrintForm` | `data-pdf-print-root="dental-chart"` |
| Treatment Record Form | `TreatmentRecordPrintForm` | `data-pdf-print-root="treatment-record"` |
| Certificate Form | `CertificatePrintForm` | `data-pdf-print-root="certificate-form"` |
| Consent Form | `ConsentPrintForm` | `data-pdf-print-root="consent-form"` |
| Contract Form | `ContractPrintForm` | `data-pdf-print-root="contract-form"` |

## Multi-Page Logic

`getPrintablePages(printRoot)` checks for child elements with `[data-pdf-page]`.

- If child pages exist, those child pages are exported one by one.
- If child pages do not exist, the root itself becomes one page.
- Contract Form uses this mechanism with four pages.

## Storage And Settings

- Global key: `masterFileModifyPdfSettings`
- Sync event: `clinic:modify-pdf-settings-changed`
- Patient contract key: `patientContractForm:<patientId>`

## Critical Fidelity Controls

- Capture size: `680px x 962px`
- Capture scale: `3`
- CSS print scale: `scale(1.1672)`
- PDF output image size: `210mm x 297mm`
- Root overflow: most forms use `overflow: hidden`
- Contract pages use `min-height: 962px` and page break rules
