# Current Features Analysis

## Modify PDF Workspace

- Provides a settings page named `Modify PDF`.
- Lets the clinic configure which forms are exported.
- Lets the clinic switch preview tabs across six document types.
- Lets the clinic configure header order: left image, clinic identity/logo, right photo.
- Lets the clinic configure clinic name, address, contact, badges, images, photo visibility, dentist name/title/license, signature image, and signature placement.
- Lets the clinic configure module visibility for dentist name and signature per document module.
- Lets the clinic reorder and hide Patient Information Form sections.
- Lets the clinic configure dental chart title, legend, findings, recommendations, and footer visibility.
- Lets the clinic configure treatment record title, dentist column, balance column, and row density.
- Lets the clinic configure certificate, consent, and contract titles.
- Lets the clinic adjust theme-like presentation: font size, label size, line spacing, border style, underline style, section separator, overflow behavior, and spacing density.
- Saves settings to localStorage and synchronizes patient documents through a custom browser event.

## Patient Documents & Forms Workspace

- Lives inside the patient individual record Certificates area.
- Shows a left sidebar of printable forms.
- Renders a main printable preview.
- Supports zoom controls: zoom out, reset, zoom in.
- Supports browser Print.
- Supports PDF Download.
- Uses the current Modify PDF settings automatically.
- Syncs settings on custom event, browser focus, and visibility change.
- Selects dental chart history records when viewing Dental Chart Form.
- Includes an editable Contract Form workspace before the printable preview.

## Printable Form Set

- Patient Information Form: patient demographics, clinical questionnaire, allergies, medical conditions, signature blocks.
- Dental Chart Form: dental status chart, tooth markings, legend, x-ray lines, recommendations, remarks, dentist/signature footer.
- Treatment Record: tabular treatment ledger with optional dentist and balance columns.
- Certificate Form: clinic certificate layout with patient identity blanks, writing lines, legal text, dentist/signature block.
- Consent Form: oral surgery consent checklist, medical conditions, allergies, authorization text, signatures.
- Contract Form: multi-page orthodontic treatment contract with package details, terms, ledger rows, and signatures.

## Recently Added / Current Behavior

- Dental Chart Form in the patient Certificates workspace now mirrors saved dental chart records in the sidebar history rail.
- Dental chart history shows three records per page.
- Selected dental chart history item is a rounded highlighted card with date, summary, and right-aligned check icon.
- Non-selected chart history items use stacked date and summary layout.
- Contract form data persists by patient in localStorage.

## Feature Boundaries

- The PDF system currently works client-side only.
- There is no backend PDF rendering service in the inspected code.
- Persistence is mostly localStorage and in-memory patient mock/application state.
- Visual print fidelity depends on CSS and the browser engine.
