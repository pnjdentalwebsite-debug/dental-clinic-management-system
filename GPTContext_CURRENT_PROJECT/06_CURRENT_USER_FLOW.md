# Current User Flow

## Master Modify PDF Flow

1. User opens Master File Directory / Modify PDF.
2. User sees clinic PDF settings and preview workspace.
3. User chooses which pages are enabled for export.
4. User edits header, clinic identity, images, title, visibility, patient sections, dental chart options, treatment columns, form titles, and style settings.
5. User can switch preview tabs to inspect each form.
6. User can save configuration.
7. User can print enabled pages.
8. User can download enabled pages as `clinic-selected-forms.pdf`.

## Patient Certificates Documents Flow

1. User opens a patient individual record.
2. User opens the Certificates tab.
3. User sees Documents & Forms sidebar.
4. User chooses Patient Form, Dental Chart Form, Treatment Record, Certificate Form, Consent Form, or Contract Form.
5. User can zoom the printable preview.
6. User can print or download the active document.
7. If Dental Chart Form is selected, chart history appears under that sidebar item.
8. If Contract Form is selected, a patient-specific editor appears above the printable preview.

## Dental Chart History Flow

1. User creates dental chart records in the Dental Chart tab.
2. User opens Certificates / Dental Chart Form.
3. Dental chart records appear in the chart history rail.
4. User selects one history record.
5. Selected record is highlighted with a card and check icon.
6. The printable Dental Chart Form preview reflects the selected record.

## Output Flow

1. For print, browser print dialog handles final paper or PDF destination.
2. For download, the app creates a generated PDF file in the browser.
3. Master export filename is `clinic-selected-forms.pdf`.
4. Patient export filename is `<patientId>-<activeDocument>.pdf`.
