# 16 Rendering Logic Analysis

## Settings Rendering Logic

`PDFDesignerPage` loads settings from localStorage and passes them into preview components. Settings are converted to header props through `createDocumentHeaderSettings` and to CSS theme through `getDocumentThemePresentation`.

## Master Preview Logic

`ConfiguredDocumentPage` checks `pageKey` and returns the matching print component. It wraps the result in `DocumentTheme`.

Branches:

- Patient Form -> `PatientFormPreview`
- Dental Chart -> `DentalChartPreview`
- Treatment Record -> `TreatmentRecordPreview`
- Certificate Form -> `CertificatePrintForm`
- Consent Form -> `ConsentPrintForm`
- Contract Form -> `ContractPrintForm`

## Patient Preview Logic

`PatientFormsWorkspace` stores `activeDocument`. `PatientConfiguredDocument` selects the matching print component and injects patient-specific data.

## Dental Chart Rendering Logic

Dental chart data is transformed into `teethByNumber`.

```text
dentalChart.teeth
-> map toothNumber to ToothEntry
-> ToothArch reads teethByNumber[number]
-> PrintTooth reads tooth condition and surface markings
-> SVG paths render condition fill/marking
```

## Treatment Record Rendering Logic

```text
rows prop
-> blankRows length 32
-> for each rowIndex
-> row = rows[rowIndex]
-> render row values or blanks
```

## Certificate Rendering Logic

Static certificate body is mixed with props:

- issue date
- patient name
- patient age
- clinic name
- dentist/signature/license

Writing areas are not data-driven; they are blank lines.

## Consent Rendering Logic

```text
selectedMedicalConditions
-> lowercase Set
-> ChecklistColumn
-> yes/no check mark rendering

selectedAllergies
-> lowercase Set
-> ChecklistColumn
```

Risks are static array content rendered in order.

## Contract Rendering Logic

Static legal sections are arrays rendered as Roman lists. Patient-specific and package-specific data are inserted into fields and lined blocks. `normalizePaymentTerms` ensures enough payment term lines.

## PDF Rendering Logic

```text
query printable root
-> getPrintablePages
-> for each page
   -> capturePrintableDocument
   -> canvas.toDataURL('image/png')
   -> pdf.addPage if not first
   -> pdf.addImage(...)
-> pdf.save(...)
```

## Print Rendering Logic

Print CSS uses body classes and visibility rules. For patient printing, the active form is fixed at the top-left and scaled. For master multi-print, hidden export pages become visible and each `.pdf-designer__export-page` becomes an A4 page.
