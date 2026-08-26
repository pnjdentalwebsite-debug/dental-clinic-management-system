# 03 Patient Form Analysis

## Module Name

Patient Form / Patient Information Form

## Component

`PatientRecordPrintForm`

## File Location

`src/features/clinic-subsystem/pdf-designer/PatientRecordPrintForm.tsx`

## Printable Root

`<article className="patient-print-form" data-pdf-print-root="patient-form">`

## Props

- `clinicName`
- `address`
- `contact`
- `badgeText`
- `showClinicName`
- `showAddress`
- `showContact`
- `showBadge`
- `showLeftImage`
- `showLeftImageOutline`
- `showRightImage`
- `visibleSectionIds`
- `sectionOrder`
- `headerSettings`
- `badgeMarginTop`
- `badgeMarginBottom`
- `dentistName`
- `signatureImageData`
- `signatureSize`
- `signaturePlacement`
- `patient`

## Utilities And Child Functions

- `buildPatientDocumentIdentity(patient)`: derives normalized identity data.
- `PrintField`: renders a label, underlined value area, and optional caption.
- `CheckItem`: renders checkbox-style checklist row.
- `ConfigurableDocumentHeader`: shared clinic header.

## Data Structures

`medicalQuestions` contains seven question rows. Several include follow-up underline fields.

`allergyItems` contains:

- Local Anesthetic
- Sulfa Drugs
- Latex
- Penicillin / Antibiotics
- Aspirin
- Other:

`medicalConditions` contains 36 checklist items including blood pressure, epilepsy, HIV/AIDS, ulcers, heart disease, hepatitis, respiratory problems, kidney disease, stroke, cancer, asthma, diabetes, and others.

## Layout Structure

```text
PatientRecordPrintForm
|
|-- Header
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
`-- Signature Footer
```

## CSS Page Configuration

Class: `.patient-print-form`

- width: `680px`
- height: `962px`
- padding: `22px 26px 18px`
- overflow: `hidden`
- background: `#ffffff`
- font family: `Arial, Helvetica, sans-serif`
- font size: `7.6px`
- line height: `1.16`
- display: `flex`
- direction: column
- gap: `3px`

## Header Layout

Class: `.patient-print-form__header`

- min-height: `76px`
- display: `grid`
- grid columns: `72px minmax(0, 1fr) 72px`
- gap: `14px`

Header is mostly superseded by `ConfigurableDocumentHeader` when `headerSettings` is provided.

## Row And Field Layout

Main row class: `.patient-print-form__row`

- display: grid
- align-items: end
- gap: `8px`

Row variants:

- Name row: `36px 1.15fr 1.15fr 0.8fr`
- Three-column row: `1.12fr 1.12fr 0.82fr`
- Minor row: `62px 1fr`
- Medical row: `1fr 1fr`
- Medical address row: `1.45fr 0.55fr`

Field class: `.patient-print-form__field`

- min-height: `11px`
- grid columns: `max-content minmax(18px, 1fr)`
- gap: `3px`
- underline is the child `i` with `border-bottom: 1px solid #111111`

## Section Control

The form uses `visibleSectionIds` and `sectionOrder`.

- `visibleSectionIds` determines display/hide for sections.
- `sectionOrder` changes render order when passed from settings.

## Auto-Filled Patient Data

Patient data fills:

- name
- birth date
- sex
- age
- nickname
- home address
- occupation
- religion
- mobile number/contact
- email
- dental insurance
- parent/guardian details
- previous dentist
- physician details
- medical concern fields

## Signature Area

Class: `.patient-print-form__footer`

- margin-top: auto
- padding: `0 20px 1px`
- display: flex
- justify-content: space-between
- gap: `30px`

Signature block:

- width: `145px`
- wide signature block: `240px`
- underline: `border-bottom: 1px solid #111111`

## Modification Hotspots

- Overall page size and padding: `.patient-print-form`
- Field underline layout: `.patient-print-form__field`
- Checklist columns: `.patient-print-form__check-grid`
- Question layout: `.patient-print-form__question`
- Section visibility/order: `modifyPdfSettings.patientFormSections`
- Source markup: `PatientRecordPrintForm.tsx`
