import { afterEach, describe, expect, it, vi } from 'vitest';
import { capturePrintableDocument } from './capturePrintableDocument';

describe('capturePrintableDocument', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.replaceChildren();
  });

  it('captures an unscaled clone instead of the zoomed preview element', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    const preview = document.createElement('div');
    const printable = document.createElement('article');

    preview.className = 'pdf-document-theme';
    preview.style.transform = 'scale(0.82)';
    printable.dataset.pdfPrintRoot = 'patient';
    preview.appendChild(printable);
    document.body.appendChild(preview);

    const canvas = document.createElement('canvas');
    const html2canvas = vi.fn(async (target: HTMLElement) => {
      expect(target).not.toBe(printable);
      expect(target.isConnected).toBe(true);
      expect(target.closest<HTMLElement>('.pdf-document-theme')?.style.transform).toBe('none');
      return canvas;
    });

    const result = await capturePrintableDocument(
      printable,
      html2canvas as unknown as typeof import('html2canvas').default
    );

    expect(result).toBe(canvas);
    expect(html2canvas).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true
      })
    );
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
  });

  it('captures only the targeted contract page when the printable document is paged', async () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });

    const preview = document.createElement('div');
    const contract = document.createElement('article');
    const pageOne = document.createElement('section');
    const pageTwo = document.createElement('section');

    preview.className = 'pdf-document-theme';
    contract.dataset.pdfPrintRoot = 'contract-form';
    contract.className = 'contract-print-form';
    pageOne.setAttribute('data-pdf-page', 'contract-page-1');
    pageTwo.setAttribute('data-pdf-page', 'contract-page-2');
    pageOne.textContent = 'Page One';
    pageTwo.textContent = 'Page Two';
    contract.append(pageOne, pageTwo);
    preview.appendChild(contract);
    document.body.appendChild(preview);

    const canvas = document.createElement('canvas');
    const html2canvas = vi.fn(async (target: HTMLElement) => {
      expect(target.textContent).toContain('Page Two');
      expect(target.textContent).not.toContain('Page One');
      expect(target.closest('.contract-print-form')).not.toBeNull();
      expect(target.closest('.pdf-document-theme')?.querySelectorAll('[data-pdf-page]')).toHaveLength(1);
      return canvas;
    });

    const result = await capturePrintableDocument(
      pageTwo,
      html2canvas as unknown as typeof import('html2canvas').default
    );

    expect(result).toBe(canvas);
  });
});
