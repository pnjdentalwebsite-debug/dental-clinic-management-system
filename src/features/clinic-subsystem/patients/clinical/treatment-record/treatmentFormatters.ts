export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date));
}

export function formatTooth(toothNumber: string) {
  return toothNumber.trim().toLowerCase() === 'general' ? 'General' : `Tooth #${toothNumber}`;
}
