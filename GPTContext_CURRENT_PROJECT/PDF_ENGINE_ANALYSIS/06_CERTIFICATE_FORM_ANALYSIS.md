# 06 Certificate Form Analysis

## Module Name

Certificate Form

## Component

`CertificatePrintForm`

## File Location

`src/features/clinic-subsystem/pdf-designer/CertificatePrintForm.tsx`

## Printable Root

`data-pdf-print-root="certificate-form"`

## Props

- `headerSettings`
- `title`
- `intro`
- `dentistName`
- `dentistTitle`
- `dentistLicense`
- `signatureImageData`
- `signatureSize`
- `signaturePlacement`
- `patientName`
- `patientAge`
- `issueDate`
- `clinicName`

## Child Functions

- `InlineValue`: renders underlined inline patient values.
- `WritingLines`: renders repeated blank writing lines.

## Structure

```text
CertificatePrintForm
|
|-- ConfigurableDocumentHeader compact
|-- Contact section
|-- Horizontal rule
|-- Certificate title
|-- Body
|   |-- Date row
|   |-- Intro paragraph
|   |-- Certification paragraph
|   |-- Diagnosis writing lines
|   |-- Recommendation writing lines
|   |-- Legal-purpose paragraph
|   |-- Courtesy paragraphs
|   `-- Dentist signature block
```

## CSS Page Configuration

Class: `.certificate-print-form`

- width: `680px`
- height: `962px`
- padding: `22px 26px 18px`
- overflow: `hidden`
- font family: `Arial, Helvetica, sans-serif`
- font size: `12px`
- line height: `1.48`
- display: flex column

## Header And Contact

The clinic header is `ConfigurableDocumentHeader` in compact mode.

Contact section:

- class: `.certificate-print-form__contact`
- uses two columns for location/contact and office hours.

Horizontal rule:

- class: `.certificate-print-form__rule`
- height: `2px`
- background: `#111111`

## Title

Class: `.certificate-print-form h1`

- margin: `30px 0 32px`
- color: `#7b4b36`
- font size: `17px`
- line height: `1`
- letter spacing: `0.035em`
- text align: center

## Body Text

Body:

- class: `.certificate-print-form__body`
- flex: `1`
- padding: `0 4px`
- flex column

Date field:

- strong has `min-width: 150px`
- underline border bottom

Certification paragraph:

- line-height: `1.92`

Inline values:

- min width: `60px`
- wide min width: `280px`
- border bottom: `1px solid #111111`

Writing lines:

- gap: `11px`
- last line has 2px bottom border

## Dentist Signature

Class: `.certificate-print-form__dentist`

- width: `265px`
- margin-top: `32px`
- display: grid
- text alignment controlled inline from `signaturePlacement`
- signature image width from `signatureSize`

## Modification Hotspots

- Certificate text: JSX paragraphs in `CertificatePrintForm.tsx`
- Diagnosis/recommendation area: `WritingLines count={4}`
- Title styling: `.certificate-print-form h1`
- Inline blanks: `.certificate-print-form__inline`
- Signature block: `.certificate-print-form__dentist`
