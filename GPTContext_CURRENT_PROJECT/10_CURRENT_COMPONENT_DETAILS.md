# Current Component Details

## `PDFDesignerPage`

Responsibilities:

- Load, edit, lock, and save global Modify PDF settings.
- Render settings controls.
- Render active form preview.
- Render hidden enabled export pages.
- Print selected forms.
- Download selected forms into one PDF.

Important state:

- `settings`
- `previewPage`
- `isDownloading`
- `isProcessingImage`
- `saveMessage`

## `PatientFormsWorkspace`

Responsibilities:

- Render patient-side document list.
- Keep active document state.
- Subscribe to global Modify PDF settings.
- Keep contract form state per patient.
- Select dental chart history records.
- Render printable preview with zoom.
- Print/download active document.

Important state:

- `activeDocument`
- `zoom`
- `isDownloading`
- `selectedDentalChartId`
- `settings`
- `contractForm`

## `PatientConfiguredDocument`

Maps selected page key to the correct printable component:

- `patient-information-form` to `PatientRecordPrintForm`
- `dental-chart-form` to `DentalChartPrintForm`
- `treatment-record` to `TreatmentRecordPrintForm`
- `certificate-form` to `CertificatePrintForm`
- `consent-form` to `ConsentPrintForm`
- `contract-form` to `ContractPrintForm`

## `ConfigurableDocumentHeader`

Responsibilities:

- Render left image, clinic identity, and right photo.
- Respect visibility and ordering settings.
- Render image placeholders when image data is missing.
- Apply size, margin, fit, and crop settings.

## `DentalChartHistoryRail`

Responsibilities:

- Display dental chart records under Dental Chart Form.
- Show three records per page.
- Select a record and notify parent.
- Show selected record with highlighted card and check icon.

Data displayed:

- Date from `record.checkedDate`
- Summary from `record.remarks || record.findings || 'No summary'`

## `ContractFormEditor`

Responsibilities:

- Edit patient-specific contract fields.
- Edit down payment terms.
- Edit ledger rows.
- Add and reset ledger rows.
- Persist through `contractFormStore.ts`.

## Printable Forms

All printable forms are pure React print templates with props for patient data, header settings, titles, visibility, signature, and form-specific content.
