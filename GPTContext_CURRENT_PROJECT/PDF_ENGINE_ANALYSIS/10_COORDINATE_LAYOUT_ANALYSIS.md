# 10 Coordinate Layout Analysis

## Coordinate Model

The project does not use absolute PDF coordinates. Coordinates are CSS layout positions within a 680px by 962px document box.

Approximate coordinate interpretation:

- X starts at left edge of the printable root.
- Y starts at top edge of the printable root.
- Padding defines the inner content origin.
- CSS grids/flexbox determine actual element positions.

## Common Header Coordinates

For most forms with `22px 26px 18px` padding:

- page origin: `0,0`
- content origin: `x=26`, `y=22`
- content width: `628px`

For Dental Chart:

- content origin: `x=34`, `y=18`
- content width: `612px`

## Configurable Header Layout

Class: `.configurable-document-header`

- min-height: `78px`
- compact min-height: `64px`
- display: flex
- justify-content: space-between
- gap: `14px`

Left image:

- width and height from `leftImageSize`, minimum `28px`
- circular border if `showLeftImageOutline`

Clinic identity:

- flex: `1`
- centered
- clinic name uses Arial Narrow/Arial, `15px`, letter spacing `0.3em`

Right photo:

- width: `66px`
- height: `82px`
- compact: `56px x 70px`

## Module Layout Coordinates

### Patient Form

- Header starts at `x=26`, `y=22`.
- Badge follows header and is centered.
- Sections stack vertically with small gaps.
- Footer is pushed to bottom by `margin-top: auto`.

### Dental Chart

- Header starts at `x=34`, `y=18`.
- Patient meta starts after header and uses full content width.
- Dental chart block has `26px` top padding and `44px` bottom padding.
- Chart body first column is `58px` for row labels.
- Tooth chart area is the remaining content width.
- Vertical center line is computed with CSS: `left: calc(58px + (100% - 58px) / 2)`.

### Treatment Record

- Header starts at `x=26`, `y=22`.
- Title follows header with margin `5px 0 13px`.
- Table consumes full content width.
- Footer pushed to bottom using `margin-top: auto`.

### Certificate Form

- Header compact starts at `x=26`, `y=22`.
- Contact section follows.
- 2px black rule follows contact.
- Title has large vertical margins.
- Body flexes to fill remaining height.

### Consent Form

- Header compact starts at `x=26`, `y=22`.
- Title has top border and centered text.
- Identity grid uses four columns.
- Medical box follows with two-column grid.
- Signatures are bottom-aligned with `margin-top: auto`.

### Contract Form

- Each page starts at `x=0`, `y=0` inside a page section.
- Page content starts at `x=26`, `y=24`.
- Pages are stacked in DOM but exported individually through `data-pdf-page`.

## Layer Order

All elements are normal document flow except:

- Dental chart center line uses pseudo-element behind arch content with `z-index: 0`.
- Tooth row labels and arch content use `z-index: 1`.
- Capture host is offscreen and `aria-hidden`.

## Modification Rule

To match a reference PDF, translate target coordinates into CSS:

- page margin -> root padding
- fixed X columns -> grid-template-columns
- row Y spacing -> margin/gap/padding
- table coordinates -> table column widths and cell padding
- page breaks -> `data-pdf-page` boundaries
