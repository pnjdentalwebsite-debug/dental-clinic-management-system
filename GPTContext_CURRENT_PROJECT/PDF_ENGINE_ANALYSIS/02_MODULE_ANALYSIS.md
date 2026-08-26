# 02 Module Analysis

## Module Map

```text
PDFDesignerPage
|
|-- DocumentTheme
|   |-- PatientRecordPrintForm
|   |-- DentalChartPrintForm
|   |-- TreatmentRecordPrintForm
|   |-- CertificatePrintForm
|   |-- ConsentPrintForm
|   `-- ContractPrintForm
|
|-- ConfigurableDocumentHeader
|   |-- LeftImage
|   |-- ClinicIdentity
|   `-- RightPhoto
|
|-- capturePrintableDocument
`-- getPrintablePages
```

## Module Responsibilities

| Module | Responsibility |
|---|---|
| Patient Form | Collects and prints patient identity, dental history, medical history, allergies, questionnaire, conditions, and signatures. |
| Dental Chart Form | Prints odontogram, tooth numbering, condition markings, legends, x-ray checklist, recommendations, remarks, and dentist signoff. |
| Treatment Record | Prints tabular treatment ledger with date, tooth number, procedure, dentist, amounts, balance, and dentist signature. |
| Certificate Form | Prints certificate statement with clinic contact, title, date, patient name/age, diagnosis lines, recommendation lines, legal purpose text, and dentist signature. |
| Consent Form | Prints oral surgery consent with identity fields, medical and allergy checklists, medication/physician questions, risks, authorization, and signatures. |
| Contract Form | Prints orthodontic treatment contract across four explicit pages with identity, inclusions, non-inclusions, terms, acknowledgements, package details, and payment table. |

## Shared Header

All current major print modules use `ConfigurableDocumentHeader`. It renders three configurable zones:

- left image/logo
- clinic identity and optional middle logo
- right 2x2 photo

## Shared Theme

`DocumentTheme` wraps printable forms and applies:

- CSS variables for font scale, label scale, line height
- modifier classes for borders, underline style, separators, overflow, spacing

## Shared Data Binding

Data enters through React props. There is no separate PDF template DSL. The template is the JSX markup inside each print component.

## Module Output Model

Every module outputs HTML. PDF output is an image of that HTML. Therefore, changing the PDF appearance means changing:

- JSX structure
- CSS class rules
- settings mapping
- props passed from `PDFDesignerPage` or `PatientFormsWorkspace`

## High-Level Component Tree Examples

```text
PatientRecordPrintForm
|-- ConfigurableDocumentHeader
|-- Badge
|-- Patient Information Record
|-- Minor / Referral Details
|-- Dental History
|-- Medical History
|-- Medical Questions
|-- Allergies
|-- Health Details
|-- For Women Only
|-- Medical Conditions Checklist
`-- Signature & Consent Footer
```

```text
DentalChartPrintForm
|-- ConfigurableDocumentHeader
|-- Patient Meta
|-- Dental Status Chart
|   |-- Temporary Upper
|   |-- Permanent Upper
|   |-- Permanent Lower
|   `-- Temporary Lower
|-- Legend / X-ray
|-- Recommendations
|-- Remarks
`-- Footer / Dentist Signoff
```

```text
ContractPrintForm
|-- Page 1 data-pdf-page
|-- Page 2 data-pdf-page
|-- Page 3 data-pdf-page
`-- Page 4 data-pdf-page
```
