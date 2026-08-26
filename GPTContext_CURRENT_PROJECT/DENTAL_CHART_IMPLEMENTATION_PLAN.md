# Dental Chart Form Implementation Plan

## Files To Modify
- `src/features/clinic-subsystem/pdf-designer/DentalChartPrintForm.tsx`
- `src/index.css`

## Components To Modify
- `DentalChartPrintForm`
- `PrintTooth`
- `CheckLine`

## Functions To Modify
- `PrintTooth`: preserve four-cell code box, add visible `+N` overflow indicator when more than four tags are present.
- `CheckLine`: replace corrupted check text with a PDF-safe mark.

## CSS Changes
- Add Dental Chart-scoped configurable header rules:
  - `.dental-chart-print .configurable-document-header`
  - `.dental-chart-print .configurable-document-header__left`
  - `.dental-chart-print .configurable-document-header__identity`
  - `.dental-chart-print .configurable-document-header__brand-image`
  - `.dental-chart-print .configurable-document-header__identity-text`
  - `.dental-chart-print .configurable-document-header__photo`
- Rebalance Dental Chart-only print layout:
  - Adjust patient metadata spacing.
  - Improve chart title spacing.
  - Improve tooth row and arch spacing.
  - Slightly increase tooth SVG/code-box readability while keeping one-page fit.
  - Improve legend, recommendation, remarks, and footer spacing.
  - Allow remarks to wrap compactly instead of one-line clipping.

## Rendering Changes
- Keep the existing `680px x 962px` fixed capture page.
- Keep existing tooth arrays and odontogram surface rendering.
- Keep existing section visibility props.
- Keep static x-ray lines because no current Dental Chart data model fields exist for x-ray selections.

## Data Changes
- No data model changes.
- No storage changes.
- No changes to Patient Form or any other PDF modules.

## Expected Result
- Dental Chart PDF remains a single-page printable form.
- Header, patient metadata, tooth chart, legend, recommendation, remarks, and footer are better aligned.
- All permanent and pediatric teeth still render.
- Tooth tag overflow is visible instead of silently dropped.
- Recommendation check marks render cleanly.
- Existing tests continue to pass.
