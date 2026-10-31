// Keeps digits and, when `decimals` allows it, one point. es-MX groups thousands with commas, so
// those go; any other comma is a decimal typed the European way.
export function sanitizeNumber(text: string, decimals: number): string {
  const clean = text
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(/,/g, '.')
    .replace(/[^\d.]/g, '');
  const [whole = '', ...rest] = clean.split('.');
  if (decimals === 0 || !clean.includes('.')) return whole;
  return `${whole}.${rest.join('').slice(0, decimals)}`;
}

// Digits, plus a + only where it means something: at the very start.
export function sanitizePhone(text: string): string {
  const clean = text.replace(/[^\d+]/g, '');
  return (clean.startsWith('+') ? '+' : '') + clean.replace(/\+/g, '');
}
