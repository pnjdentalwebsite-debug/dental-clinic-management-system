# Current Code Architecture

## Architecture Type

The PDF/document module is a frontend-rendered document architecture.

## Layers

| Layer | Responsibility | Main Files |
|---|---|---|
| Settings Layer | Stores and broadcasts global document settings | `modifyPdfSettings.ts` |
| Document Shell Layer | Chooses form, applies theme, passes settings | `PDFDesignerPage.tsx`, `PatientFormsWorkspace.tsx` |
| Printable Form Layer | React markup for A4 printable forms | `*PrintForm.tsx` |
| Capture Layer | Converts DOM to canvas | `capturePrintableDocument.ts` |
| PDF Assembly Layer | Adds canvases to A4 jsPDF pages | `PDFDesignerPage.tsx`, `PatientFormsWorkspace.tsx` |
| Styling Layer | A4 dimensions, print media, theme classes | `src/index.css` |

## Master Workspace Flow

1. `PDFDesignerPage` loads settings with `loadModifyPdfSettings`.
2. User edits settings in the sidebar panels.
3. Settings mutate local React state.
4. User saves using `saveConfiguration`.
5. `saveModifyPdfSettings` writes localStorage and dispatches `clinic:modify-pdf-settings-changed`.
6. Preview renders selected document inside `DocumentTheme`.
7. Print/download uses printable roots inside `.pdf-designer__export-page`.

## Patient Workspace Flow

1. `PatientFormsWorkspace` loads the same Modify PDF settings.
2. It subscribes to settings changes and browser focus/visibility events.
3. User selects a document from the sidebar.
4. `PatientConfiguredDocument` maps selected key to the matching print form.
5. Patient, dental chart, and contract data are injected into the selected print form.
6. Print/download captures the currently visible printable root.

## Settings Synchronization

The master workspace and patient workspace communicate through localStorage and browser events, not through a central React store.

Key mechanisms:

- localStorage key: `masterFileModifyPdfSettings`
- custom event: `clinic:modify-pdf-settings-changed`
- storage event listener
- window focus listener
- document visibility listener

## Document Identity

Patient printable forms use `buildPatientDocumentIdentity` from the clinic subsystem components. This normalizes patient name, age, sex, birth date, and clinic-facing identity fields before rendering print templates.

## Multi-Page Strategy

Most forms are single printable roots. The contract form renders multiple child pages with `data-pdf-page`, allowing export to split one document into multiple PDF pages while keeping a single root form.
