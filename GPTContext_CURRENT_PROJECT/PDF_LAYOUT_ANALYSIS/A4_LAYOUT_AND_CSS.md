# A4 Layout And CSS Analysis

## Global Layout Approach

The printable documents are styled as fixed, paper-like React components. The app uses CSS classes for form-specific dimensions and print-specific behavior.

## Important CSS Classes

- `.patient-print-form`
- `.dental-chart-print`
- `.treatment-record-print`
- `.certificate-print-form`
- `.consent-print-form`
- `.contract-print-form`
- `.contract-print-form__page`
- `.configurable-document-header`
- `.pdf-document-theme`
- `.patient-forms-workspace__sheet`

## Theme Classes

`getDocumentThemePresentation` generates classes that control:

- font size
- label size
- border style
- underline style
- section separators
- overflow behavior
- spacing density

## CSS Variables

Theme presentation currently emits:

- `--pdf-font-scale`
- `--pdf-label-scale`
- `--pdf-line-height`

## Form Layout Notes

- Patient Information Form uses section grids and form-like underline fields.
- Dental Chart Form uses an odontogram layout, arch groups, tooth SVG surfaces, legend, recommendation grid, and footer.
- Treatment Record uses a fixed table with optional columns.
- Certificate Form uses centered certificate body text with inline blanks and writing lines.
- Consent Form uses checklist columns, authorization text, and signature blocks.
- Contract Form uses separate page sections and ledger table layout.

## Visual Fragility Points

- A4 scaling can expose overflow if content height grows.
- Long text needs either wrapping or truncation depending on selected overflow setting.
- Dental chart tooth layout is dense and should be tested after any font or spacing change.
- Contract page sections must remain page-sized to keep multi-page export stable.
