# 15 Component Code Mapping

## Engine Mapping

| Visual Output | Code Owner |
|---|---|
| PDF download | `PDFDesignerPage.downloadPreviewPage`, `PatientFormsWorkspace.downloadDocument` |
| Browser print | `PDFDesignerPage.printPreviewPage`, `PatientFormsWorkspace.printDocument` |
| DOM capture | `capturePrintableDocument` |
| Page splitting | `getPrintablePages` |
| Header layout | `ConfigurableDocumentHeader` |
| Theme classes | `getDocumentThemePresentation` |
| Settings persistence | `loadModifyPdfSettings`, `saveModifyPdfSettings` |

## Patient Form Mapping

| Output Area | Component/CSS |
|---|---|
| Root page | `PatientRecordPrintForm`, `.patient-print-form` |
| Header | `ConfigurableDocumentHeader` |
| Badge | `.patient-print-form__badge` |
| Personal fields | `.patient-print-form__row`, `PrintField` |
| Medical questions | `medicalQuestions`, `.patient-print-form__question` |
| Allergies | `allergyItems`, `CheckItem`, `.patient-print-form__check-grid--allergies` |
| Medical conditions | `medicalConditions`, `.patient-print-form__check-grid--conditions` |
| Signatures | `.patient-print-form__footer`, `.patient-print-form__signature-block` |

## Dental Chart Mapping

| Output Area | Component/CSS |
|---|---|
| Root page | `DentalChartPrintForm`, `.dental-chart-print` |
| Patient meta | `.dental-chart-print__patient-meta` |
| Tooth arrays | `pediatricUpper`, `permanentUpper`, `permanentLower`, `pediatricLower` |
| Tooth arch | `ToothArch`, `.dental-chart-print__arch` |
| Tooth SVG | `PrintTooth`, `odontogramSurfacePaths` |
| Legend | `LegendColumn`, `.dental-chart-print__legend` |
| X-ray lines | `XrayLine`, `.dental-chart-print__xray-row` |
| Recommendations | `CheckLine`, `.dental-chart-print__recommendation-grid` |
| Remarks | `.dental-chart-print__remarks` |

## Treatment Record Mapping

| Output Area | Component/CSS |
|---|---|
| Root page | `TreatmentRecordPrintForm`, `.treatment-record-print` |
| Table | `.treatment-record-print__table` |
| Column widths | `.treatment-record-print__col-*` |
| Body rows | `blankRows` |
| Density | `rowHeightDensity`, `.is-compact`, `.is-comfortable`, `.is-relaxed` |
| Footer | `.treatment-record-print__footer` |

## Certificate Mapping

| Output Area | Component/CSS |
|---|---|
| Root page | `CertificatePrintForm`, `.certificate-print-form` |
| Contact | `.certificate-print-form__contact` |
| Rule | `.certificate-print-form__rule` |
| Title | `.certificate-print-form h1` |
| Inline blanks | `InlineValue`, `.certificate-print-form__inline` |
| Writing lines | `WritingLines`, `.certificate-print-form__writing-lines` |
| Signature | `.certificate-print-form__dentist` |

## Consent Mapping

| Output Area | Component/CSS |
|---|---|
| Root page | `ConsentPrintForm`, `.consent-print-form` |
| Identity | `LabeledValue`, `.consent-print-form__identity` |
| Medical checklist | `ChecklistColumn`, `.consent-print-form__medical` |
| Allergies | `allergyItems` |
| Risks | `risks` |
| Questions | `QuestionLine` |
| Signatures | `SignatureLine`, `.consent-print-form__signatures` |

## Contract Mapping

| Output Area | Component/CSS |
|---|---|
| Root | `ContractPrintForm`, `.contract-print-form` |
| Pages | `.contract-print-form__page`, `data-pdf-page` |
| Identity fields | `InlineField`, `.contract-print-form__identity` |
| Sections | `ContractSection` |
| Roman lists | `RomanList`, `.contract-print-form__roman-list` |
| Lined text | `LinedBlock` |
| Signatures | `SignatureLine`, `.contract-print-form__signature-grid` |
| Payment table | `.contract-print-form__ledger` |
