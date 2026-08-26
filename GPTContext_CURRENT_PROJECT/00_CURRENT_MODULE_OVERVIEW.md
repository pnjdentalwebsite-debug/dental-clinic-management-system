# Current Module Overview

Generated: 2026-08-09

## Scope

This context package documents the current PDF/document system in the clinic subsystem. It is a reverse-engineered snapshot intended for another AI or developer to understand, modify, rebuild, or extend the current implementation without first rediscovering the codebase.

## Main Purpose

The module provides printable and downloadable clinic documents for patient records. The current implementation uses React components as print templates, CSS for A4 layout, browser print for direct printing, and `html2canvas` plus `jsPDF` for PDF downloads.

## Primary Workspaces

- Master File Directory / Modify PDF: global template and visual settings editor for clinic printable forms.
- Patient Individual Record / Certificates tab: patient-facing Documents & Forms workspace that renders selected forms with live patient data.
- Dental Chart tab: clinical chart records are created here and then surfaced inside the Dental Chart Form history rail in the Certificates workspace.

## Supported Documents

- Patient Information Form
- Dental Chart Form
- Treatment Record
- Certificate Form
- Consent Form
- Contract Form

## Core Engine Summary

- Printable React forms render an element with `data-pdf-print-root`.
- Multi-page documents can render child sections with `data-pdf-page`.
- Print uses browser `window.print()` plus temporary body classes.
- Download uses dynamic imports of `html2canvas` and `jsPDF`.
- Export captures each printable page as a high-resolution canvas and inserts it into an A4 PDF page at `210mm x 297mm`.

## Important Source Areas

- `src/features/clinic-subsystem/pdf-designer/`
- `src/features/clinic-subsystem/patients/clinical/certificates/`
- `src/index.css`

## Important Storage Keys

- `masterFileModifyPdfSettings`: global Modify PDF settings.
- `patientContractForm:<patientId>`: patient-specific contract editor data.

## Current Design Principle

The current system is not a server-side PDF generator. It is a frontend print-rendering system: visual correctness depends heavily on React markup, CSS dimensions, browser rendering, canvas capture, and A4 scaling.
