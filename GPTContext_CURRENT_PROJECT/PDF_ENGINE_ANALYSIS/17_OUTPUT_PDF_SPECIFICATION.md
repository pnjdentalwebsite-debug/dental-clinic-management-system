# 17 Output PDF Specification

## File Type

Generated output is `.pdf`.

## Download Filenames

Master workspace:

- `clinic-selected-forms.pdf`

Patient workspace:

- `<patient.id>-<activeDocument>.pdf`

Examples:

- `P001-patient-information-form.pdf`
- `P001-dental-chart-form.pdf`
- `P001-contract-form.pdf`

## Page Count

| Module | Page Count |
|---|---:|
| Patient Form | 1 |
| Dental Chart | 1 |
| Treatment Record | 1 |
| Certificate Form | 1 |
| Consent Form | 1 |
| Contract Form | 4 |

Master export page count equals the total enabled forms plus extra pages from multi-page forms.

## PDF Page Settings

- orientation: portrait
- unit: mm
- format: a4
- compress: true

## Image Insert Settings

- format: PNG
- x: `0`
- y: `0`
- width: `210`
- height: `297`
- compression: `FAST`

## html2canvas Settings

- backgroundColor: `#ffffff`
- scale: `3`
- useCORS: `true`
- logging: `false`

## Printed Output Behavior

Patient print:

- hides all app content
- reveals printable forms
- fixes active print form to top-left
- scales root by `1.1672`

Master multi-print:

- hides all app content
- reveals `.pdf-designer__export-pages`
- each `.pdf-designer__export-page` is `210mm x 297mm`
- every export page breaks after itself except the last

## Known Output Problems To Watch

- Content can clip if a single-page form exceeds root height.
- Browser print may scale differently depending on print settings.
- Uploaded images must be data URLs or CORS-safe.
- Very long names/fields require overflow handling through theme or CSS.
- Contract page count is manually controlled, not automatic.
