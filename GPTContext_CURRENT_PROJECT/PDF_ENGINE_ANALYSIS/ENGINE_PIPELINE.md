# PDF Engine Pipeline

## Engine Summary

The current PDF engine is a frontend DOM capture pipeline:

React printable form -> CSS A4 layout -> offscreen cloned DOM -> html2canvas -> jsPDF -> browser file save.

## Capture Details

The capture helper intentionally avoids capturing the visible preview. It clones the printable document into an offscreen fixed host with a normalized size of `680px x 962px`. This prevents preview zoom and app layout from corrupting the downloaded PDF.

## Export Details

`jsPDF` is configured as:

- portrait
- unit `mm`
- A4
- compressed

Each captured canvas is inserted as:

- PNG
- x `0`
- y `0`
- width `210`
- height `297`
- compression `FAST`

## Multi-Page Rules

Any printable root with child `[data-pdf-page]` exports each child as a separate PDF page. If no child pages exist, the root itself is exported.

## Print Rules

Print is not converted through canvas. It relies on CSS media rules and browser print rendering.

Body classes:

- `pdf-designer-printing`
- `pdf-designer-printing-multiple`

## Engine Modification Notes

- Change capture dimensions only if all print CSS is reviewed.
- Change canvas scale carefully; lower scale reduces quality, higher scale increases memory usage.
- Do not remove the two-frame paint wait unless image/font rendering is tested.
- Do not capture the preview wrapper because zoom transforms can affect output.
