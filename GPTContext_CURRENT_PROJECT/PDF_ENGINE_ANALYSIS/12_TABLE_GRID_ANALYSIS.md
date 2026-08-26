# 12 Table Grid Analysis

## Real Tables

The current PDF system has two primary HTML tables:

- Treatment Record table
- Contract ledger table

Other form areas use CSS grids, not `<table>`.

## Treatment Record Table

Class: `.treatment-record-print__table`

Width:

- `100%` of printable content width, approximately `628px`

Borders:

- table border: `1px solid #050505`
- cell right/bottom borders: `1px solid #050505`
- last column removes right border
- last body row removes bottom border

Columns:

| Column | CSS Width | Alignment |
|---|---:|---|
| Date | `13.5%` | left |
| Tooth No./s | `9%` | left |
| Procedure | `22%` | left |
| Dentist/s | `15.5%` | left |
| Amount Charged | `13.33%` | right in header group |
| Amount Paid | `13.33%` | right in header group |
| Balance | `13.33%` | right in header group |

Header:

- height: `38px`
- padding: `3px 6px`
- font size: `6.6px`
- font weight: `800`

Body:

- 32 rows
- compact row height: `11.5px`
- comfortable row height: `13.5px`
- relaxed row height: `15.5px`
- cell padding: `0 3px`

## Contract Ledger Table

Class: `.contract-print-form__ledger`

Width:

- `100%` of contract content width, approximately `628px`

Borders:

- border-collapse: collapse
- th/td border: `1px solid #111827`

Cells:

- padding: `6px 8px`
- text-align: left
- vertical-align: top
- table font size: `10px`
- header font size: `10.4px`

Data:

- `ledgerRows` prop
- default generated rows if none are supplied

## CSS Grid Used As Tables

Patient Form:

- rows and fields use CSS grid instead of HTML tables.
- fields use label plus underlined value grid.

Dental Chart:

- chart body uses grid for row labels and tooth arches.
- arches use grid for tooth placement.
- legend uses grid columns like a compact table.

Consent Form:

- identity uses grid.
- medical checklist uses two major grid columns.
- conditions use three grid columns.
- check rows use grid for YES, NO, label.

Contract Form:

- identity uses grid.
- signature grid uses two columns.
- most body sections use ordered lists, not tables.

## Modification Guidance

To match a reference table:

- change column widths in `colgroup` classes for Treatment Record.
- change cell heights and padding in CSS.
- change row count in `blankRows`.
- change Contract ledger headings and columns in JSX plus `.contract-print-form__ledger` CSS.
- for grid-like sections, update `grid-template-columns`, `gap`, and child order.
