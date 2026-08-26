# Current UI Layout Specification

## Modify PDF Workspace Layout

- Top card: `PDF Designer`, `Modify PDF`, clinic/branch metadata.
- Main layout: settings column and preview column.
- Settings column: document selection, export toggles, header controls, image controls, module visibility, section controls, style controls.
- Preview column: active preview tab and printable page scaled inside a preview surface.
- Hidden export area: `.pdf-designer__export-pages` contains enabled printable forms for multi-form print/download.

## Patient Documents Workspace Layout

- Container: `.patient-forms-workspace`.
- Left sidebar: Documents & Forms header, document navigation, optional dental chart history rail, template source note.
- Main area: toolbar with active document title, print/download buttons, optional contract editor, preview heading, zoom controls, sheet preview.
- Preview sheet: uses `--patient-document-zoom` to visually scale the printable document.

## Dental Chart History Rail Layout

- Header: `CHART HISTORY`.
- Selected item: rounded card, subtle background, border, date top-left, check icon top-right, summary below date.
- Non-selected items: stacked text blocks, date first line, summary underneath.
- Pagination: centered at bottom with previous button, `current/total`, next button.
- Page size: three records per page.

## Printable Document Dimensions

The capture helper normalizes the cloned printable area to:

- Width: `680px`
- Height: `962px`
- Background: white
- Canvas scale: `3`

The PDF assembly places each captured canvas into:

- A4 portrait
- `210mm x 297mm`

## Header Layout

The configurable document header has three reorderable zones:

- Left Image
- Clinic Info & Logo
- Right Photo

The settings determine visibility, sizes, margins, object fit, crop positioning, clinic text visibility, and photo placeholder behavior.

## Print Form Visual Rules

- Print forms use fixed CSS classes per form type.
- `pdf-document-theme` applies theme variables and modifier classes.
- Print CSS uses body classes to isolate printable content from app chrome.
- Contract pages are explicitly separated by `data-pdf-page`.
