# Current PDF Generation Logic

## Download Algorithm

1. Find printable roots.
2. Dynamically import `html2canvas` and `jsPDF`.
3. Create a new A4 portrait PDF.
4. Convert printable roots into printable pages.
5. Capture each page as a canvas.
6. Add a new PDF page after the first page.
7. Insert the canvas PNG at `0, 0, 210, 297`.
8. Save the PDF.

## Capture Algorithm

`capturePrintableDocument` performs the most important fidelity work:

- Finds the nearest `.pdf-document-theme`.
- Clones the printable element or theme wrapper.
- Appends clone to an offscreen fixed host.
- Forces host and clone to `680px x 962px`.
- Waits for `document.fonts.ready`.
- Waits for two animation frames.
- Captures the target with `html2canvas`.
- Removes the temporary host.

## Why Clone Offscreen

The clone isolates capture from preview zoom, scroll position, transforms, app layout constraints, and visible UI. This helps the canvas match the intended A4 print layout instead of the scaled preview.

## Page Detection

`getPrintablePages` checks for `[data-pdf-page]` inside the selected print root.

- If found: return every page element.
- If not found: return the root print element itself.

## Print Algorithm

The print path is CSS-driven:

- Master print adds `pdf-designer-printing-multiple`.
- Patient print adds `pdf-designer-printing`.
- `window.print()` opens browser printing.
- CSS hides non-print UI and expands printable elements.
- Cleanup runs on `afterprint` and fallback timeout.

## Important Risks

- Very large images may stress localStorage or canvas memory.
- Browser print scaling can differ by browser.
- html2canvas cannot perfectly reproduce all CSS features.
- If a form exceeds `680px x 962px` without `data-pdf-page`, content may be clipped during download.
- Cross-origin images need CORS support or data URLs.
