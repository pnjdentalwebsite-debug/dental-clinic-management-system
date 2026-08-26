# 07 Consent Form Analysis

## Module Name

Consent Form

## Component

`ConsentPrintForm`

## File Location

`src/features/clinic-subsystem/pdf-designer/ConsentPrintForm.tsx`

## Printable Root

`data-pdf-print-root="consent-form"`

## Props

- `headerSettings`
- `title`
- `dentistName`
- `signatureImageData`
- `signatureSize`
- `signaturePlacement`
- `patientName`
- `birthDate`
- `patientAge`
- `patientStatus`
- `selectedMedicalConditions`
- `selectedAllergies`

## Data Arrays

- `medicalColumns`: 3 arrays of medical conditions.
- `allergyItems`: Penicillin, Other Antibiotics, Local Anesthesia, Others.
- `risks`: 14 risk statement strings.

## Child Functions

- `ChecklistColumn`
- `QuestionLine`
- `LabeledValue`
- `InlineBlank`
- `SignatureLine`

## Structure

```text
ConsentPrintForm
|
|-- ConfigurableDocumentHeader compact
|-- h1 title
|-- Patient identity grid
|-- Medical History heading
|-- Medical checklist grid
|   |-- 3 condition columns
|   `-- Allergy / medication questions
|-- Authorization paragraphs
|-- Risk ordered list
|-- Consent checkbox statement
|-- Centered legal statements
`-- Signature grid
```

## Checklist Logic

The component normalizes selected values into lowercase sets:

- `medicalConditionSet`
- `allergySet`

`ChecklistColumn` renders YES/NO boxes. If selected, YES receives check and NO is blank. If not selected, NO receives check.

## CSS Page Configuration

Class: `.consent-print-form`

- width: `680px`
- height: `962px`
- padding: `22px 26px 18px`
- font family: `Arial, Helvetica, sans-serif`
- font size: `7.95px`
- line height: `1.24`
- display: flex column

## Identity Grid

Class: `.consent-print-form__identity`

- display: grid
- columns: `2fr 1.12fr 0.55fr 0.78fr`
- gap: `10px`
- margin-bottom: `7px`

## Medical Checklist Layout

Class: `.consent-print-form__medical`

- display: grid
- columns: `minmax(0, 3fr) minmax(142px, 1.18fr)`
- gap: `9px`
- padding: `8px 10px 7px`
- border: `1px solid #111111`

Condition columns:

- grid columns: `repeat(3, minmax(0, 1fr))`
- gap: `8px`

Check row:

- grid columns: `13px 13px minmax(0, 1fr)`
- min-height: `16px`
- checkbox size: `10px x 10px`

## Authorization And Risk Text

Authorization section:

- padding-top: `6px`
- paragraphs margin: `5px 0`
- ordered list margin: `4px 0 5px 18px`
- list item line-height: `1.16`

## Signature Area

Class: `.consent-print-form__signatures`

- margin-top: auto
- grid columns: two equal columns
- gap: `22px 64px`

Signature line:

- min-height: `38px`
- underline span height: `14px`

## Modification Hotspots

- Risk text and order: `risks` array
- Medical conditions: `medicalColumns`
- Allergy options: `allergyItems`
- Identity layout: `.consent-print-form__identity`
- Checklist spacing: `.consent-print-form__check-row`
- Signature layout: `.consent-print-form__signatures`
