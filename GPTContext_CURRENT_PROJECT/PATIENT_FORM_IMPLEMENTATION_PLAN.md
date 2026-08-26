# Patient Form Implementation Plan

Generated: 2026-08-09

## Files To Modify

- `src/features/clinic-subsystem/pdf-designer/PatientRecordPrintForm.tsx`
- `src/index.css`

## Components To Modify

- `PatientRecordPrintForm`
- `PrintField`
- `CheckItem`

## Functions To Modify

- `PrintField`: add a nested value span for safer truncation/alignment.
- `CheckItem`: replace mojibake check text with structured mark elements.

## CSS Changes

Patient Form-only CSS changes:

- Add `.patient-print-form .configurable-document-header` rules so the Patient Form header matches the reference without affecting other modules.
- Adjust `.patient-print-form` base font and spacing carefully while keeping page size.
- Improve `.patient-print-form__field > i` so values align inside underline fields.
- Add `.patient-print-form__field-value`.
- Add `.patient-print-form__choice-mark`.
- Refine medical question rows and yes/no columns.
- Refine checklist rows.
- Refine footer signature spacing.

## PDF Rendering Changes

No engine change planned.

The current renderer remains:

```text
680px x 962px DOM
-> html2canvas scale 3
-> jsPDF A4 portrait
-> PNG at 0,0,210,297
```

## Expected Result

- Patient Form remains one A4 page.
- Patient Form preview has cleaner header alignment and field layout.
- Checklist selected marks no longer show mojibake.
- YES/NO markers look like form boxes instead of loose letters.
- Field values are centered/truncated inside underline space.
- Other PDF modules are untouched.

## Verification Plan

1. Run Patient Form tests.
2. Run a build or targeted test command if practical.
3. Open/inspect the Patient Form preview if browser testing is available.
4. Confirm no source files for other PDF modules changed.
5. Create `PATIENT_FORM_IMPLEMENTATION_RESULT.md`.
