type Html2Canvas = typeof import('html2canvas').default;

const PRINTABLE_SELECTOR = '[data-pdf-print-root]';
const CAPTURE_TARGET_ATTRIBUTE = 'data-pdf-capture-target';

export async function capturePrintableDocument(
  printable: HTMLElement,
  html2canvas: Html2Canvas
) {
  const sourceTheme = printable.closest<HTMLElement>('.pdf-document-theme');
  const captureHost = document.createElement('div');
  const captureTargetId = `capture-${Math.random().toString(36).slice(2, 10)}`;
  const isPatientForm = printable.dataset.pdfPrintRoot === 'patient-form';
  const isPagedDocument = printable.hasAttribute('data-pdf-page');
  const captureWidth = isPatientForm ? '210mm' : '680px';
  const captureHeight = isPatientForm ? '297mm' : '962px';
  const captureScale = isPatientForm ? 2 : 3;

  printable.setAttribute(CAPTURE_TARGET_ATTRIBUTE, captureTargetId);
  const captureClone = buildCaptureClone(sourceTheme, printable, isPagedDocument);

  captureHost.setAttribute('aria-hidden', 'true');
  Object.assign(captureHost.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: captureWidth,
    height: captureHeight,
    overflow: 'hidden',
    background: '#ffffff',
    pointerEvents: 'none'
  });

  Object.assign(captureClone.style, {
    width: captureWidth,
    height: captureHeight,
    margin: '0',
    transform: 'none',
    transformOrigin: 'top left'
  });

  captureHost.appendChild(captureClone);
  document.body.appendChild(captureHost);

  try {
    await document.fonts?.ready;
    await nextPaint();

    const captureTarget = sourceTheme
      ? captureClone.querySelector<HTMLElement>(`[${CAPTURE_TARGET_ATTRIBUTE}="${captureTargetId}"]`)
        ?? captureClone.querySelector<HTMLElement>(PRINTABLE_SELECTOR)
      : captureClone;

    if (!captureTarget) {
      throw new Error('Printable document could not be prepared for PDF export.');
    }

    return await html2canvas(captureTarget, {
      backgroundColor: '#ffffff',
      scale: captureScale,
      useCORS: true,
      logging: false
    });
  } finally {
    printable.removeAttribute(CAPTURE_TARGET_ATTRIBUTE);
    captureHost.remove();
  }
}

function buildCaptureClone(
  sourceTheme: HTMLElement | null,
  printable: HTMLElement,
  isPagedDocument: boolean
) {
  if (isPagedDocument) {
    const pageClone = printable.cloneNode(true) as HTMLElement;
    const printRoot = printable.closest<HTMLElement>(PRINTABLE_SELECTOR);
    const printRootClone = printRoot
      ? (printRoot.cloneNode(false) as HTMLElement)
      : document.createElement('div');

    if (!printRoot) {
      printRootClone.setAttribute('data-pdf-print-root', printable.dataset.pdfPrintRoot || 'paged-document');
    }

    printRootClone.appendChild(pageClone);

    if (sourceTheme) {
      const themeClone = sourceTheme.cloneNode(false) as HTMLElement;
      themeClone.appendChild(printRootClone);
      return themeClone;
    }

    return printRootClone;
  }

  return (sourceTheme || printable).cloneNode(true) as HTMLElement;
}

function nextPaint() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
  });
}
