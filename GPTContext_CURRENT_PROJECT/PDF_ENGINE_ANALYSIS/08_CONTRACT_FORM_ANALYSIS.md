# 08 Contract Form Analysis

## Module Name

Contract Form

## Component

`ContractPrintForm`

## File Location

`src/features/clinic-subsystem/pdf-designer/ContractPrintForm.tsx`

## Printable Root

`data-pdf-print-root="contract-form"`

## Explicit Pages

- `data-pdf-page="contract-page-1"`
- `data-pdf-page="contract-page-2"`
- `data-pdf-page="contract-page-3"`
- `data-pdf-page="contract-page-4"`

## Props

- `headerSettings`
- `title`
- `patientName`
- `patientAge`
- `patientAddress`
- `patientContact`
- `patientBirthDate`
- `acknowledgementPrintedName`
- `acknowledgementAddressAt`
- `acknowledgementAge`
- `dentistName`
- `dentistRole`
- `treatmentPackage`
- `balanceTerms`
- `downPaymentTerms`
- `ledgerRows`

## Data Structures

`ContractLedgerRow`

- `id`
- `date`
- `amountCharged`
- `amountPaid`
- `remarks`
- `signature`

Static arrays:

- `inclusions`
- `nonInclusionsPageOne`
- `nonInclusionsPageTwo`
- `packageFees`
- `termsPageOne`
- `termsPageTwo`

## Child Functions

- `ContractSection`
- `RomanList`
- `InlineField`
- `InlineText`
- `LinedBlock`
- `SignatureLine`
- `normalizePaymentTerms`

## Structure

```text
ContractPrintForm
|
|-- Page 1
|   |-- Header
|   |-- Title
|   |-- Patient identity
|   |-- Inclusions
|   `-- Non-inclusions page one
|
|-- Page 2
|   |-- Non-inclusions continuation
|   |-- Package fee terms
|   `-- Terms page one
|
|-- Page 3
|   |-- Terms page two
|   |-- Acknowledgement paragraph
|   `-- Signature grid
|
`-- Page 4
    |-- Payment package identity
    |-- Package lines
    |-- Down payment terms
    |-- Balance terms
    `-- Ledger table
```

## CSS Page Configuration

Class: `.contract-print-form`

- display: grid
- gap: `18px`
- font family: `Arial, Helvetica, sans-serif`
- color: `#111827`

Class: `.contract-print-form__page`

- width: `680px`
- min-height: `962px`
- padding: `24px 26px 20px`
- display: grid
- align-content: start
- gap: `18px`

## Text Handling

Long static text is stored in arrays and rendered as Roman ordered lists through `RomanList`. Body copy uses:

- font size: `10.6px`
- line height: `1.45`

`LinedBlock` uses `white-space: pre-wrap`, allowing entered package/payment text to preserve newlines.

## Table Layout

Class: `.contract-print-form__ledger`

- width: `100%`
- border-collapse: `collapse`
- margin-top: `8px`
- font size: `10px`

Cells:

- border: `1px solid #111827`
- padding: `6px 8px`
- text-align: left
- vertical-align: top

## Page Continuation Logic

This form is the only current module with explicit DOM page sections. The PDF engine does not calculate page breaks; the component author manually split content into four `data-pdf-page` sections.

## Modification Hotspots

- Page breaks: `data-pdf-page` section boundaries
- Long legal text: static arrays in `ContractPrintForm.tsx`
- Payment ledger columns: ledger table JSX and CSS
- Package free-text lines: `LinedBlock`
- Page spacing: `.contract-print-form__page`
- Print page breaks: print CSS for `.contract-print-form__page`
