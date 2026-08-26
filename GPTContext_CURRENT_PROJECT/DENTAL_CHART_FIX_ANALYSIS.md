# Dental Chart Form Fix Analysis

## Scope
Only the `Dental Chart Form` PDF module is in scope. Patient Form, Treatment Record, Certificate, Consent, Contract, and shared PDF engine behavior should not be redesigned.

## Current Flow
Dental chart data is loaded from the patient Dental Chart workspace and passed into the Certificates workspace preview.

Dental Data

↓

`DentalChartPrintForm`

↓

Patient metadata + tooth chart layout + legend + recommendation + remarks/footer sections

↓

PDF capture/export renderer

↓

Generated Dental Chart Form PDF

## Current
File: `src/features/clinic-subsystem/pdf-designer/DentalChartPrintForm.tsx`

Component: `DentalChartPrintForm`

Implementation:
- Renders a single fixed printable article with `className="dental-chart-print"` and `data-pdf-print-root="dental-chart"`.
- Uses `ConfigurableDocumentHeader` for clinic logo, clinic information, and 2x2 photo placeholder.
- Builds patient display fields with `buildPatientDocumentIdentity()` and `getPatientDocumentDate()`.
- Converts `dentalChart.teeth` into a tooth-number map through `useMemo`.
- Renders pediatric and permanent tooth arrays through `ToothArch` and `PrintTooth`.
- Renders odontogram surfaces from `odontogramSurfacePaths`.
- Renders condition, restoration/prosthetic, surgery, and x-ray legend columns.
- Renders recommendation check lines, remarks/status, checked-by dentist, and date footer.

Rendering:
- Current CSS uses a fixed `680px x 962px` page.
- `.dental-chart-print` uses small Arial typography and page clipping through `overflow: hidden`.
- Tooth code boxes show only four tag cells.
- X-ray legend rows are static lines because the current `DentalChartRecord` type has no x-ray fields.
- Remarks are forced into a single no-wrap ellipsis line.

Output:
- The chart fits on one page, but the page is dense.
- Header and patient metadata are functional but need Dental Chart-specific calibration after the shared configurable header migration.
- Tooth chart is complete, but spacing is tight and can look cramped in PDF.
- Long tooth tag values can silently disappear beyond the first four visible cells.
- Check marks currently use mojibake text in source (`âœ“`) instead of a clean PDF-safe mark.

## Target
Expected:
- Preserve the existing Dental Chart architecture and tooth data mapping.
- Maintain A4-style fixed-page output using the project’s current `680px x 962px` capture system.
- Keep permanent and pediatric tooth arrays exactly ordered.
- Keep odontogram rendering and legend order.
- Improve Dental Chart PDF polish without changing other PDF modules.

Layout:
- Header should align clinic logos, clinic identity, patient/date metadata, and 2x2 photo consistently.
- Tooth chart should remain centered with a readable right/left split and clear permanent/temporary spacing.
- Tooth numbering and surface symbols must remain aligned.
- Legend should be readable, compact, and aligned in columns.
- Recommendation, remarks, signature, and date should stay inside the printable area without visual crowding.

Behavior:
- Data binding should continue to use the existing `DentalChartRecord`.
- If x-ray source fields are unavailable, keep static x-ray lines rather than inventing unsupported data.
- Tooth tag overflow should be handled intentionally inside the four-cell code box.
- Optional visibility props must keep working.

Output:
- One Dental Chart PDF page with cleaner spacing, predictable A4 capture dimensions, preserved tooth grid, and safer overflow handling.

## Differences
Problem: Header uses shared defaults but the Dental Chart page does not have scoped calibration for the configurable header.

Root cause: The old `.dental-chart-print__header` styles are no longer used by `ConfigurableDocumentHeader`; only global header styles apply.

Required adjustment: Add Dental Chart-scoped `.configurable-document-header` sizing and image/text rules.

Problem: Tooth chart is dense and can feel vertically cramped.

Root cause: Current chart padding, arch gaps, tooth SVG size, and code box sizing are tuned for fitting but not balanced after the configurable header migration.

Required adjustment: Slightly rebalance chart padding, row gaps, arch gaps, tooth SVG/code box sizes, and chart header spacing while preserving all tooth arrays.

Problem: More than four tooth tags are not represented.

Root cause: `PrintTooth` slices tags to four cells and drops any extra values.

Required adjustment: Keep four visible cells but show a `+N` overflow indicator in the last cell when additional tags exist.

Problem: Check mark source text is mojibake.

Root cause: Encoded check symbol was stored incorrectly in source.

Required adjustment: Use a PDF-safe ASCII mark for checked recommendation lines.

Problem: Remarks can be hard-clipped as one line.

Root cause: `.dental-chart-print__remarks-copy` uses `white-space: nowrap` and `text-overflow: ellipsis`.

Required adjustment: Allow compact multi-line remarks within the section height.

Problem: X-ray fields are static.

Root cause: `DentalChartRecord` currently does not expose x-ray fields.

Required adjustment: Leave static x-ray lines in place and document that no binding can be safely added without a data-model change.
