# 14 Line Border Spacing Analysis

## Global Border Controls

`getDocumentThemePresentation` applies classes based on settings:

- `is-border-solid-black`
- `is-border-soft-gray`
- `is-border-none`
- `is-underline-solid`
- `is-underline-dotted`
- `is-underline-none`

Soft gray border changes many table and line borders to `#94a3b8`.

No border makes table/rule/medical borders transparent.

## Underline Controls

Underline dotted affects:

- `i` elements
- `.certificate-print-form__inline`
- `.consent-print-form__inline-blank`

Underline none makes those underlines transparent.

## Patient Form Lines

Fields use child `i` elements:

- height: `9px`
- border-bottom: `1px solid #111111`

Signature spans use:

- border-bottom: `1px solid #111111`

Women-only section:

- border: `1px solid #d9e1ec`

## Dental Chart Lines

Patient meta:

- border-bottom: `2px solid #111111`

Chart:

- border-bottom: `1px solid #111111`

Center vertical line:

- pseudo-element width `1px`
- background `#111111`

Upper permanent arch:

- border-bottom: `1px solid #111111`

X-ray line:

- `border-top: 1px solid #111111`

Remarks:

- underline `border-bottom: 1px solid #111111`

## Treatment Record Borders

Table:

- outer border: `1px solid #050505`
- cells: right and bottom border `1px solid #050505`

Footer signature:

- border-bottom: `1px solid #111111`

## Certificate Borders

Rule:

- height `2px`
- background black

Inline blanks:

- border-bottom `1px solid #111111`

Writing lines:

- normal line: `1px`
- last line: `2px`

Dentist name:

- border-bottom `1px solid #111111`

## Consent Borders

Title:

- border-top `2px solid #111111`

Medical section:

- border `1px solid #111111`

Checkbox:

- `10px x 10px`
- border `1px solid #7b8490`
- border-radius `2px`

Signature:

- border-bottom `1px solid #111111`

## Contract Borders

Fields:

- strong child gets bottom border `1px solid #111827`

Ledger:

- all cells border `1px solid #111827`

Signature lines:

- span border-bottom `1px solid #111827`

Lined blocks:

- div border-bottom `1px solid #111827`

## Spacing Controls

Theme spacing classes:

- compact: `--pdf-section-gap: 3px`
- balanced: print root gap `5px`
- spacious: print root gap `8px`

Most spacing is hard-coded per module through `padding`, `gap`, and `margin`.
