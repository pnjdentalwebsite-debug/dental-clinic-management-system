# Current Output Format

## Export Type

The app produces browser-generated PDF files from rendered HTML/CSS.

## PDF Settings

- Library: `jsPDF`
- Orientation: portrait
- Unit: millimeters
- Format: A4
- Compression: enabled
- Page size used in insertion: `210mm x 297mm`
- Image type inserted: PNG
- Image compression mode: `FAST`

## Canvas Settings

- Library: `html2canvas`
- Scale: `3`
- Background: `#ffffff`
- CORS: enabled
- Logging: disabled

## File Names

- Master Modify PDF export: `clinic-selected-forms.pdf`
- Patient document export: `<patientId>-<activeDocument>.pdf`
- Example: `P001-dental-chart-form.pdf`

## Printable Root Markers

| Document | Marker |
|---|---|
| Patient Information Form | `data-pdf-print-root="patient-form"` |
| Dental Chart Form | `data-pdf-print-root="dental-chart"` |
| Treatment Record | `data-pdf-print-root="treatment-record"` |
| Certificate Form | `data-pdf-print-root="certificate-form"` |
| Consent Form | `data-pdf-print-root="consent-form"` |
| Contract Form | `data-pdf-print-root="contract-form"` |

## Multi-Page Output

Contract Form includes child sections:

- `data-pdf-page="contract-page-1"`
- `data-pdf-page="contract-page-2"`
- `data-pdf-page="contract-page-3"`
- `data-pdf-page="contract-page-4"`

Any printable form can become multi-page if child elements use `data-pdf-page`; `getPrintablePages` will export those children separately.
