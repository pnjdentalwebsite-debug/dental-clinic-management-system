export function getPrintablePages(printRoot: HTMLElement) {
  const pages = Array.from(
    printRoot.querySelectorAll<HTMLElement>('[data-pdf-page]')
  );

  return pages.length > 0 ? pages : [printRoot];
}
