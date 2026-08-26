# 04 Dental Chart Analysis

## Module Name

Dental Chart Form

## Component

`DentalChartPrintForm`

## File Location

`src/features/clinic-subsystem/pdf-designer/DentalChartPrintForm.tsx`

## Printable Root

`<article className="dental-chart-print" data-pdf-print-root="dental-chart">`

## Props

- `clinicName`
- `address`
- `contact`
- `chartTitle`
- `showClinicName`
- `showAddress`
- `showContact`
- `showLeftImage`
- `showLeftImageOutline`
- `showRightImage`
- `showLegend`
- `showFindings`
- `showRecommendations`
- `showFooter`
- `showTitle`
- `headerSettings`
- `dentistName`
- `signatureImageData`
- `signatureSize`
- `signaturePlacement`
- `patient`
- `dentalChart`

## Hooks

- `useMemo` for `conditionsById`
- `useMemo` for `teethByNumber`

## Imported Dental Utilities

- `getDentalConditionsById`
- `odontogramSurfacePaths`
- `buildPatientDocumentIdentity`
- `getPatientDocumentDate`

## Tooth Number Arrays

- Pediatric upper: `55 54 53 52 51 61 62 63 64 65`
- Permanent upper: `18 17 16 15 14 13 12 11 21 22 23 24 25 26 27 28`
- Permanent lower: `48 47 46 45 44 43 42 41 31 32 33 34 35 36 37 38`
- Pediatric lower: `85 84 83 82 81 71 72 73 74 75`

## Component Structure

```text
DentalChartPrintForm
|
|-- ConfigurableDocumentHeader
|-- Patient Meta
|-- Dental Status Chart
|   |-- Chart Head
|   |-- Chart Body
|   |   |-- Row label Temporary Teeth
|   |   |-- ToothArch pediatric upper
|   |   |-- Row label Permanent Teeth
|   |   |-- ToothArch permanent upper
|   |   |-- Row label Permanent Teeth
|   |   |-- ToothArch permanent lower
|   |   |-- Row label Temporary Teeth
|   |   `-- ToothArch pediatric lower
|-- Legend
|-- Recommendations
|-- Remarks
`-- Footer
```

## Tooth Rendering Logic

`ToothArch` splits a tooth array into two halves:

- `midpoint = Math.ceil(teeth.length / 2)`
- left half = first half
- right half = second half

Permanent arches render 8 teeth per half. Pediatric arches render 5 teeth per half.

`PrintTooth` renders:

- tooth number
- 2x2 code box
- SVG odontogram
- optional visible tags

## Tooth Surface Logic

`getPrintedSurfaceCondition` checks:

1. Whole tooth condition from `tooth.condition`
2. Surface-specific marking from `tooth.surfaceMarkings`
3. Condition configuration from `conditionsById`

The SVG uses `odontogramSurfacePaths` to draw surface segments. Condition colors and markings come from dental chart config.

## CSS Page Configuration

Class: `.dental-chart-print`

- width: `680px`
- height: `962px`
- padding: `18px 34px 18px`
- overflow: `hidden`
- font family: `Arial, Helvetica, sans-serif`
- font size: `7.15px`
- line height: `1.16`
- display: flex column

## Patient Meta Row

Class: `.dental-chart-print__patient-meta`

- display: grid
- columns: `minmax(0, 1.6fr) minmax(0, 0.58fr) minmax(0, 0.78fr)`
- gap: `14px`
- border-bottom: `2px solid #111111`

## Chart Layout

Class: `.dental-chart-print__chart`

- padding: `26px 0 44px`
- border-bottom: `1px solid #111111`

Chart body:

- display: grid
- columns: `58px minmax(0, 1fr)`
- row gap: `15px`
- column gap: `4px`
- vertical center line via `::after`

Arch:

- grid columns: two halves
- column gap: `24px`
- max width permanent: `560px`
- max width pediatric: `348px`

Tooth code box:

- width: `20px`
- height: `19px`
- 2x2 grid
- border color: `#aebdd1`

Tooth SVG:

- width: `22px`
- height: `22px`
- stroke: `#8294af`
- stroke-width: `1.05`

## Legend And Recommendations

Legend grid:

- columns: `44px 1.05fr 1.28fr 0.82fr 1.05fr`
- gap: `8px`
- padding: `13px 2px 7px`

Recommendations:

- padding: `9px 48px 0`
- grid columns: `1fr 1.05fr`
- gap: `34px`

## Modification Hotspots

- Tooth number order: top constants in `DentalChartPrintForm.tsx`
- Tooth SVG geometry: `odontogramGeometry`
- Tooth condition color/labels: `dentalChartConfig`
- Arch spacing: `.dental-chart-print__arch`
- Chart spacing: `.dental-chart-print__chart`
- Legend table-like grid: `.dental-chart-print__legend`
- Recommendations: `.dental-chart-print__recommendation-grid`
