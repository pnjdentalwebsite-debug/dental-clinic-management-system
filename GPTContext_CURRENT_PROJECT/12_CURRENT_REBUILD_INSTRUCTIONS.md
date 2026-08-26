# Current Rebuild Instructions

## Goal

Rebuild the existing PDF/document system with the same behavior, not a new product concept.

## Required Modules

1. Global Modify PDF settings page.
2. Shared settings persistence and sync utility.
3. Configurable document header.
4. Six printable form components.
5. Patient Documents & Forms workspace.
6. Dental Chart History Rail under Dental Chart Form.
7. Contract form editor with patient localStorage persistence.
8. Browser print and PDF download engine.
9. A4 CSS and print media rules.

## Rebuild Steps

1. Define `ModifyPdfSettings` with all current keys and safe defaults.
2. Implement `loadModifyPdfSettings`, `saveModifyPdfSettings`, and `subscribeToModifyPdfSettings`.
3. Build `ConfigurableDocumentHeader` with left image, clinic identity, and right photo slots.
4. Build `DocumentTheme` that maps settings to CSS variables and modifier classes.
5. Build each printable form as a React component with `data-pdf-print-root`.
6. Add `data-pdf-page` sections to any multi-page form, especially Contract Form.
7. Implement `capturePrintableDocument` with offscreen clone, fixed capture size, font wait, paint wait, and html2canvas.
8. Implement `getPrintablePages`.
9. Implement master multi-form export and patient active-form export.
10. Implement print body classes and print media CSS.
11. Implement patient Certificates workspace and route integration.
12. Implement dental chart history selection and pagination.
13. Implement contract form localStorage.
14. Add tests for settings persistence, capture, form rendering, and export page markers.

## Must Preserve

- localStorage key `masterFileModifyPdfSettings`
- custom event `clinic:modify-pdf-settings-changed`
- printable root markers
- A4 PDF insertion dimensions
- patient export filename pattern
- master export filename
- dental chart history behavior
- contract form patient storage key pattern

## Must Avoid

- Do not capture scaled preview DOM directly.
- Do not remove `[data-pdf-print-root]`.
- Do not remove `[data-pdf-page]` from multi-page contract.
- Do not make settings patient-specific unless intentionally changing product behavior.
- Do not rely on server-side PDF generation unless the architecture is intentionally redesigned.
