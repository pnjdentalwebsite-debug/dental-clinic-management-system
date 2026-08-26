# 13 Font Style Analysis

## Base Font

All print forms use:

`Arial, Helvetica, sans-serif`

The shared header clinic name uses:

`"Arial Narrow", Arial, sans-serif`

## Module Font Sizes

| Module | Root Font Size | Line Height |
|---|---:|---:|
| Patient Form | `7.6px` | `1.16` |
| Dental Chart | `7.15px` | `1.16` |
| Treatment Record | `7.2px` | `1.16` |
| Certificate Form | `12px` | `1.48` |
| Consent Form | `7.95px` | `1.24` |
| Contract Form | body sections mostly `10.6px` | `1.45` |

## Theme Scaling

`getDocumentThemePresentation` emits CSS variables:

- `--pdf-font-scale`
- `--pdf-label-scale`
- `--pdf-line-height`

Font scale:

- Small: `0.9`
- Medium: `1`
- Large: `1.1`

Label scale:

- Small: `0.9`
- Medium: `1`
- Large: `1.1`

Line spacing:

- Compact: `1.15`
- Normal: `1.35`
- Relaxed: `1.55`

## Header Typography

Clinic name:

- color: `#45c2c7`
- font size: `15px`
- line height: `1`
- weight: `600`
- letter spacing: `0.3em`
- uppercase

Clinic address:

- font size: `6.2px`
- weight: `700`
- uppercase

Contact:

- font size: `5.8px`

## Patient Form Typography

Section h2:

- font size: `8.6px`
- weight: `800`
- uppercase

Field captions:

- font size: `5.3px`
- italic

Badge:

- font size: `8.2px`
- weight: `700`
- uppercase
- white text on black

## Dental Chart Typography

Chart head side labels:

- font size: `5.7px`
- uppercase
- letter spacing: `0.08em`

Chart title:

- font size: `7.2px`
- uppercase
- letter spacing: `0.12em`

Legend heading:

- font size: `6.6px`
- weight: `800`

Tooth number:

- font size: `6px`

## Treatment Record Typography

Title:

- font size: `16.5px`
- weight: `800`
- uppercase
- letter spacing: `0.08em`

Table header:

- font size: `6.6px`
- weight: `800`

## Certificate Typography

Title:

- color: `#7b4b36`
- font size: `17px`
- letter spacing: `0.035em`
- centered

Body:

- font size: `12px`
- line height: `1.48`

Certification paragraph:

- line height: `1.92`

## Consent Typography

Title:

- font size: `17.8px`
- weight: `900`
- centered

Section title:

- font size: `11.2px`
- weight: `900`

Medical h3:

- font size: `7.2px`

## Contract Typography

Titles:

- font size: `19px`
- weight: `700`
- letter spacing: `0.08em`

Body copy and roman list:

- font size: `10.6px`
- line height: `1.45`

Ledger:

- font size: `10px`
- header font size: `10.4px`
