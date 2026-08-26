# Current Data Flow

## Global Settings Data Flow

1. Defaults live in `defaultModifyPdfSettings`.
2. `loadModifyPdfSettings` reads `masterFileModifyPdfSettings`.
3. Parsed settings are merged with defaults to prevent missing fields from breaking the UI.
4. `PDFDesignerPage` edits settings in component state.
5. `saveModifyPdfSettings` serializes settings to localStorage.
6. A custom event and storage event notify other parts of the app.
7. `PatientFormsWorkspace` receives updated settings through subscription and focus/visibility sync.

## Patient Data Flow

1. Patient record data is passed into `PatientFormsWorkspace`.
2. `PatientConfiguredDocument` builds document identity using patient helper utilities.
3. Printable forms receive patient fields through props.
4. Missing data is rendered as blanks, `N/A`, empty lines, or defaults depending on form design.

## Dental Chart Data Flow

1. Dental chart records are created in the Dental Chart patient tab.
2. Patient record page passes `dentalChart` and `dentalCharts` into `PatientFormsWorkspace`.
3. `DentalChartHistoryRail` displays `dentalCharts`, three records per page.
4. Selecting a history item sets `selectedDentalChartId`.
5. `selectedDentalChart` is passed to `DentalChartPrintForm`.
6. The printable Dental Chart Form updates based on the selected historical chart.

## Contract Data Flow

1. `PatientFormsWorkspace` initializes contract form state from `loadPatientContractForm(patient, settings)`.
2. Defaults are generated from patient identity and Modify PDF dentist settings.
3. Edits are saved to localStorage key `patientContractForm:<patientId>`.
4. The same contract state feeds `ContractFormEditor` and `ContractPrintForm`.

## PDF Download Data Flow

1. User clicks Download PDF.
2. Active printable root is found using `[data-pdf-print-root]`.
3. `getPrintablePages` expands multi-page forms by reading `[data-pdf-page]`.
4. Each page is captured with `capturePrintableDocument`.
5. Each canvas becomes a PNG.
6. `jsPDF.addImage` places each PNG at full A4 size.
7. The PDF is saved locally by the browser.

## Print Data Flow

1. User clicks Print.
2. A body class is temporarily added.
3. CSS print rules hide app chrome and show printable documents.
4. `window.print()` opens browser print.
5. `afterprint` or a timeout removes the temporary body class.
