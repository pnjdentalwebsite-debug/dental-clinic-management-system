# 11 Row Column Structure

## Patient Form Rows

Main grid row classes:

- `.patient-print-form__row--name`: `36px 1.15fr 1.15fr 0.8fr`
- `.patient-print-form__row--three`: `1.12fr 1.12fr 0.82fr`
- `.patient-print-form__row--minor`: `62px 1fr`
- `.patient-print-form__row--medical`: `1fr 1fr`
- `.patient-print-form__row--medical-address`: `1.45fr 0.55fr`

Question rows:

- grid columns: `minmax(0, 1fr) 30px 30px`
- columns represent question, yes, no

Allergy checklist:

- `repeat(3, minmax(0, 1fr))`

Medical conditions:

- 12 auto rows
- column flow
- auto columns

## Dental Chart Rows

Chart body:

- column 1: `58px` row label
- column 2: tooth arch
- row gap: `15px`

Rows:

1. Temporary upper row
2. Permanent upper row
3. Permanent lower row
4. Temporary lower row

Arch halves:

- permanent: `repeat(8, minmax(0, 1fr))`
- pediatric: `repeat(5, minmax(0, 1fr))`

Legend:

- `44px 1.05fr 1.28fr 0.82fr 1.05fr`

Recommendations:

- `1fr 1.05fr`

Remarks:

- `58px minmax(0, 1fr)`

## Treatment Record Rows

Table rows:

- 1 header row
- 32 body rows

Body row height:

- compact: `11.5px`
- comfortable: `13.5px`
- relaxed: `15.5px`

Columns:

- Date `13.5%`
- Tooth `9%`
- Procedure `22%`
- Dentist `15.5%` optional
- Amount Charged `13.33%`
- Amount Paid `13.33%`
- Balance `13.33%` optional

## Certificate Form Rows

Certificate is paragraph-oriented, not table-based.

Flow:

1. Header row
2. Contact row
3. Rule row
4. Title row
5. Date row
6. Intro paragraph
7. Certification paragraph
8. Diagnosis writing lines
9. Recommendation label
10. Recommendation writing lines
11. Legal paragraph
12. Courtesy paragraphs
13. Dentist signature row

## Consent Form Rows

Flow:

1. Header
2. Title
3. Identity four-column row
4. Medical heading
5. Medical box two-column row
6. Authorization paragraphs
7. Risks ordered list
8. Consent checkbox row
9. Centered statements
10. Signature grid

## Contract Form Rows

Page 1:

- Header
- Title
- Identity grid
- Inclusion section
- Non-inclusion section

Page 2:

- Continuation block
- Non-inclusion continuation
- Package fee terms
- Terms page one

Page 3:

- Terms page two
- Acknowledgement paragraph
- Signature grid

Page 4:

- Package identity grid
- Package line blocks
- Down payment terms
- Balance terms
- Ledger table
