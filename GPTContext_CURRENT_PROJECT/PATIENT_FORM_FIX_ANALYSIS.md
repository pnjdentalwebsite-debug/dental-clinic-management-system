# Patient Form Fix Analysis

Generated: 2026-08-09

## Scope

Only the Patient Form PDF module is analyzed for implementation. Other PDF modules must remain unchanged.

## Current Flow

```text
Patient Data
-> PatientFormsWorkspace / PDFDesignerPage
-> PatientRecordPrintForm
-> patient-print-form HTML/CSS layout template
-> capturePrintableDocument / browser print CSS
-> jsPDF A4 output or browser print output
```

## Current

File:

- `src/features/clinic-subsystem/pdf-designer/PatientRecordPrintForm.tsx`
- `src/index.css`
- `src/features/clinic-subsystem/patients/components/patientDocumentData.ts`
- `src/features/clinic-subsystem/pdf-designer/capturePrintableDocument.ts`
- `src/features/clinic-subsystem/patients/clinical/certificates/PatientFormsWorkspace.tsx`
- `src/features/clinic-subsystem/pdf-designer/PDFDesignerPage.tsx`

Component:

- Main component: `PatientRecordPrintForm`
- Related component: `ConfigurableDocumentHeader`
- Related patient workspace component: `PatientFormsWorkspace`
- Related designer component: `PDFDesignerPage`

Implementation:

- Renders `<article className="patient-print-form" data-pdf-print-root="patient-form">`.
- Uses `ConfigurableDocumentHeader` for logo, clinic identity, and right photo.
- Uses `buildPatientDocumentIdentity(patient)` for normalized patient name, birth date, age, and sex.
- Uses `PrintField` for underlined label/value fields.
- Uses `CheckItem` for allergy and medical condition checklists.
- Uses `visibleSectionIds` and `sectionOrder` to hide and reorder sections.
- Uses `patient-print-form` CSS for all page sizing, rows, fields, checklists, and footer.

Output:

- One page, `680px x 962px` DOM.
- Exported as one A4 portrait PDF page through `html2canvas` and `jsPDF`.
- Browser print scales the 680px page by `1.1672`.

## Target

Expected behavior:

- Preserve the current Patient Form feature set.
- Preserve patient auto-fill and section visibility/order.
- Keep one A4 portrait Patient Form page.
- Keep shared PDF renderer behavior.
- Improve Patient Form visual match only.
- Fix corrupted check mark output.

Expected layout:

- Header should look like a dental clinic registration sheet: left logo/seal, centered clinic brand, right 2x2 photo.
- Patient information rows should be aligned and readable with long underline fields.
- Dental History and Medical History should use clear section titles and full-width line placement.
- Medical questions should have stable YES/NO columns and compact row height.
- Footer should keep date and signature lines at the bottom without crowding.

Expected output:

- Patient Form PDF remains one A4 page.
- Header, field rows, checklists, and signatures align cleanly in preview, print, and download.

## Differences

Problem:

- `CheckItem` renders `(âœ“)` for selected checklist values.

Root cause:

- Source contains mojibake text for the check symbol.

Required adjustment:

- Replace text-based mojibake with an ASCII-safe/CSS-safe mark. Use a simple `x` or CSS generated mark inside the Patient Form only.

Problem:

- Patient form styles are compressed and partially generic; the reference preview expects a cleaner clinical intake sheet with stronger header and field alignment.

Root cause:

- `.patient-print-form` uses very small base font, small gaps, and old header-specific classes while the rendered component now uses `ConfigurableDocumentHeader`.

Required adjustment:

- Add Patient Form-scoped CSS for `.patient-print-form .configurable-document-header` and tighten patient-specific grids/fields without changing shared header behavior.

Problem:

- Patient field values can visually crowd underline areas.

Root cause:

- `PrintField` places values directly in the underline element without a dedicated value class or truncation behavior.

Required adjustment:

- Add a value span inside the underline element and CSS to center, truncate, and protect underline layout.

Problem:

- YES/NO question markers are plain `O` text and not visually aligned like form checkboxes.

Root cause:

- Medical question rows hardcode text markers instead of using a reusable mark element.

Required adjustment:

- Replace marker text with Patient Form-only checkbox mark spans.

Problem:

- Footer signature/date area is functional but visually light.

Root cause:

- Footer only uses basic flex and underlined spans.

Required adjustment:

- Keep structure but refine spacing, line height, and signature label hierarchy in Patient Form CSS.

## Non-Changes

- Do not modify `DentalChartPrintForm`.
- Do not modify `TreatmentRecordPrintForm`.
- Do not modify `CertificatePrintForm`.
- Do not modify `ConsentPrintForm`.
- Do not modify `ContractPrintForm`.
- Do not change `capturePrintableDocument`.
- Do not change `jsPDF` settings.
- Do not change global `ConfigurableDocumentHeader` behavior outside Patient Form scope.
