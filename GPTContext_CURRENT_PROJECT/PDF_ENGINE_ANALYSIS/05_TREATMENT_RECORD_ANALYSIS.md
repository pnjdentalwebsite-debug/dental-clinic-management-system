# 05 Treatment Record Analysis

## Module Name

Treatment Record Form

## Component

`TreatmentRecordPrintForm`

## File Location

`src/features/clinic-subsystem/pdf-designer/TreatmentRecordPrintForm.tsx`

## Printable Root

`data-pdf-print-root="treatment-record"`

## Props

- `clinicName`
- `address`
- `contact`
- `title`
- `dentistTitle`
- `showClinicName`
- `showAddress`
- `showContact`
- `showLeftImage`
- `showLeftImageOutline`
- `showRightImage`
- `showTitle`
- `showDentistColumn`
- `showBalanceColumn`
- `rowHeightDensity`
- `headerSettings`
- `dentistName`
- `signatureImageData`
- `signatureSize`
- `signaturePlacement`
- `rows`

## Row Data Type

`PrintableTreatmentRow`

- `id`
- `date`
- `toothNumber`
- `procedure`
- `dentist`
- `amountCharged`
- `amountPaid`
- `balance`

## Rendering Logic

The component creates `blankRows = Array.from({ length: 32 })`. It always renders 32 body rows. Dynamic row data fills the first rows by index. Missing row values render empty cells.

## Table Structure

```text
TreatmentRecordPrintForm
|
|-- ConfigurableDocumentHeader
|-- h1 title
|-- table
|   |-- colgroup
|   |-- thead
|   `-- tbody 32 rows
`-- footer dentist signature
```

## Dynamic Columns

`showDentistColumn` controls the Dentist column.

`showBalanceColumn` controls the Balance column.

## Density Logic

`rowHeightDensity` maps to class:

- starts with `Relaxed` -> `is-relaxed`
- starts with `Comfortable` -> `is-comfortable`
- otherwise -> `is-compact`

## CSS Page Configuration

Class: `.treatment-record-print`

- width: `680px`
- height: `962px`
- padding: `22px 26px 18px`
- font family: `Arial, Helvetica, sans-serif`
- font size: `7.2px`
- line height: `1.16`
- display: flex column

## Table CSS

Class: `.treatment-record-print__table`

- width: `100%`
- table-layout: `fixed`
- border-collapse: `collapse`
- border: `1px solid #050505`

Header cells:

- height: `38px`
- padding: `3px 6px`
- font size: `6.6px`
- font weight: `800`
- vertical align: middle

Body cells:

- compact height: `11.5px`
- comfortable height: `13.5px`
- relaxed height: `15.5px`
- padding: `0 3px`

## Column Widths

- Date: `13.5%`
- Tooth: `9%`
- Procedure: `22%`
- Dentist: `15.5%`
- Amount columns: `13.33%`

## Signature Section

Footer:

- margin-top: auto
- justify-content: flex-end
- signature block width: `228px`
- underline min-height: `16px`

## Modification Hotspots

- Number of rows: `blankRows` length
- Column visibility: `showDentistColumn`, `showBalanceColumn`
- Column widths: `.treatment-record-print__col-*`
- Row height: `.is-comfortable`, `.is-relaxed`
- Table border and padding: `.treatment-record-print__table`
