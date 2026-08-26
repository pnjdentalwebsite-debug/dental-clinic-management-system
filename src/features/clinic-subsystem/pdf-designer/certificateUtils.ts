export function formatDocumentTypeLabel(value: string) {
  return value
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
