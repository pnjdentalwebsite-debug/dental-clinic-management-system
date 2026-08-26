# Current Test Cases

## Existing Automated Test Areas

- `capturePrintableDocument.test.ts`
- `CertificatePrintForm.test.tsx`
- `ConfigurableDocumentHeader.test.tsx`
- `ConsentPrintForm.test.tsx`
- `DentalChartPrintForm.test.tsx`
- `PatientRecordPrintForm.test.tsx`
- `PDFDesignerPage.test.tsx`
- `TreatmentRecordPrintForm.test.tsx`

## Recommended Smoke Tests

1. Open Master File Directory / Modify PDF.
2. Change clinic name, save configuration, confirm save message.
3. Open patient Certificates tab, confirm updated clinic name appears in printable preview.
4. Toggle dentist/signature visibility for one module, confirm only that module changes.
5. Download Patient Information Form, confirm PDF saves as `<patientId>-patient-information-form.pdf`.
6. Download master enabled forms, confirm `clinic-selected-forms.pdf` saves.
7. Open Contract Form and confirm multi-page PDF includes all contract pages.
8. Add/edit contract rows, reload, confirm data persists for the same patient.
9. Add dental chart record, open Certificates / Dental Chart Form, confirm history rail shows the record.
10. Select older dental chart history item, confirm printable Dental Chart Form changes.
11. Add more than three dental chart records, confirm pagination displays `1/2` or higher.
12. Print active patient document, confirm only the printable sheet appears in print preview.

## Visual QA Checklist

- A4 forms are not clipped.
- Header images do not distort unless Stretch is selected.
- Right photo placeholder remains in expected position.
- Patient form sections follow configured order.
- Dental chart odontogram remains centered and readable.
- Treatment table rows remain aligned.
- Certificate writing lines remain visible.
- Consent checkboxes remain visible in print.
- Contract page breaks remain correct.
- Dental chart history rail selected card is readable and non-overlapping.

## Regression Risks To Test

- localStorage full or invalid JSON.
- Missing patient data.
- Large uploaded image.
- Hidden signature but visible dentist name.
- Visible signature but hidden dentist name.
- Contract multi-page export after CSS changes.
- Browser print after preview zoom changes.
- Download after document is scrolled.
