# PDF Modification Playbook

## Safe Modification Process

1. Identify whether the change belongs to settings, printable markup, patient workspace UI, or CSS.
2. Preserve all `data-pdf-print-root` markers.
3. Preserve `data-pdf-page` on multi-page form pages.
4. Update CSS and component markup together when layout changes.
5. Test visible preview, browser print, and downloaded PDF.

## Adding A New Printable Form

1. Create a new print component in `pdf-designer/`.
2. Add a unique `data-pdf-print-root`.
3. Add a page key to `ModifyPdfPageKey`.
4. Add export toggle defaults in `defaultModifyPdfSettings.pagesToExport`.
5. Add visibility defaults if dentist/signature controls are needed.
6. Add a preview branch in `PDFDesignerPage`.
7. Add a patient branch in `PatientConfiguredDocument`.
8. Add CSS for preview, print, and theme behavior.
9. Add tests for rendering and export markers.

## Modifying Existing Form Layout

- Change the print component for structure.
- Change `src/index.css` for dimensions, typography, and print behavior.
- Verify the form still fits inside capture dimensions.
- Verify the downloaded PDF is not clipped.
- Verify browser print still uses the correct body class rules.

## Modifying Header Behavior

- Edit `ConfigurableDocumentHeader.tsx` for markup/logic.
- Edit `modifyPdfSettings.ts` if new settings are needed.
- Edit CSS under `.configurable-document-header`.
- Test with hidden left image, hidden right photo, long clinic name, and uploaded images.

## Modifying Dental Chart History

- Main component: `DentalChartHistoryRail` in `PatientFormsWorkspace.tsx`.
- Styling: `.patient-forms-history-rail` selectors in `src/index.css`.
- Preserve page size of 3 unless product requirements change.
- Preserve selected card, date, summary, and check icon behavior.

## Debugging PDF Download

- Confirm the target document has `[data-pdf-print-root]`.
- Confirm contract pages have `[data-pdf-page]`.
- Check whether images are data URLs or CORS-safe.
- Temporarily lower html2canvas scale if canvas memory errors occur.
- Inspect whether CSS transform or zoom is being applied to the captured clone.
