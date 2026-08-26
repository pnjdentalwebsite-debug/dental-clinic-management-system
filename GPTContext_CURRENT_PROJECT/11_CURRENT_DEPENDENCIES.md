# Current Dependencies

## Runtime Dependencies

| Package | Current Use |
|---|---|
| `react` | Component rendering and state. |
| `react-dom` | App rendering. |
| `lucide-react` | UI icons throughout settings, workspace, and forms. |
| `html2canvas` | Captures printable DOM into canvas for PDF export. |
| `jspdf` | Creates and saves A4 PDF files in the browser. |

## Development Dependencies

| Package | Current Use |
|---|---|
| `vite` | Development server and production build. |
| `typescript` | Static typing. |
| `vitest` | Unit/component tests. |
| `@testing-library/react` | React component test rendering. |
| `@testing-library/jest-dom` | DOM assertions. |
| `@testing-library/user-event` | User interaction tests. |
| `jsdom` | DOM runtime for tests. |
| `playwright` | Browser-level test dependency. |
| `oxlint` | Linting. |

## Package Scripts

- `npm run dev`: start Vite dev server.
- `npm run build`: TypeScript build and Vite production build.
- `npm run lint`: run oxlint.
- `npm run test`: run Vitest.
- `npm run test:run`: run Vitest once.
- `npm run preview`: preview production build.

## Dependency Notes

- `html2canvas` and `jspdf` are dynamically imported only when downloading PDFs.
- Keeping them dynamic avoids loading the PDF engine during normal navigation.
- The PDF output quality is tied to `html2canvas` browser rendering behavior.
