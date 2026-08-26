# 09 A4 Page Configuration

## PDF Output Page

The final PDF page is A4 portrait:

- Width: `210mm`
- Height: `297mm`
- Orientation: portrait
- Unit: millimeters

## DOM Capture Page

The printable DOM page is normalized to:

- Width: `680px`
- Height: `962px`

This is the internal page coordinate system for all non-contract printable forms.

## Conversion Relationship

The captured `680px x 962px` canvas is inserted into a `210mm x 297mm` PDF page.

Approximate scale:

- horizontal: `210 / 680 = 0.3088mm per px`
- vertical: `297 / 962 = 0.3087mm per px`

## Print Scale

Print CSS applies:

- `transform: scale(1.1672)`
- transform origin: top left

This scales `680px x 962px` to roughly browser print dimensions matching A4.

## Per-Module Page Padding

| Module | CSS Class | Padding |
|---|---|---|
| Patient Form | `.patient-print-form` | `22px 26px 18px` |
| Dental Chart | `.dental-chart-print` | `18px 34px 18px` |
| Treatment Record | `.treatment-record-print` | `22px 26px 18px` |
| Certificate Form | `.certificate-print-form` | `22px 26px 18px` |
| Consent Form | `.consent-print-form` | `22px 26px 18px` |
| Contract Page | `.contract-print-form__page` | `24px 26px 20px` |

## Approximate Printable Areas

| Module | Content Width | Content Height |
|---|---:|---:|
| Patient Form | `680 - 26 - 26 = 628px` | `962 - 22 - 18 = 922px` |
| Dental Chart | `680 - 34 - 34 = 612px` | `962 - 18 - 18 = 926px` |
| Treatment Record | `628px` | `922px` |
| Certificate Form | `628px` | `922px` |
| Consent Form | `628px` | `922px` |
| Contract Page | `628px` | `918px` |

## Margins Controlled By Settings

Header-specific margins are configurable through:

- `headerBottomMargin`
- `leftImageMargins`
- `middleImageMargins`
- `rightImageMargins`

Badge margins are configurable through:

- `badgeMarginTop`
- `badgeMarginBottom`

## Fixed Capture Host

`capturePrintableDocument` creates an offscreen host:

- position: fixed
- left: `-10000px`
- top: `0`
- width: `680px`
- height: `962px`
- overflow: hidden
- background: white

## Implication For Modifications

If a reference PDF requires true coordinate-based placement, current code must still be changed in CSS/JSX coordinates first. The engine captures whatever the browser renders inside the fixed 680x962 page.
