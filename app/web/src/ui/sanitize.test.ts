import { describe, expect, it } from 'vitest';

import { sanitizeNumber, sanitizePhone } from './sanitize';

describe('sanitizePhone', () => {
  it('strips everything but digits and +', () => {
    expect(sanitizePhone('+52 (442) 123-4567')).toBe('+524421234567');
    expect(sanitizePhone('a1b2c3')).toBe('123');
  });

  it('keeps a + only at the start', () => {
    expect(sanitizePhone('12+3+')).toBe('123');
    expect(sanitizePhone('++52')).toBe('+52');
  });
});

describe('sanitizeNumber', () => {
  it('keeps whole numbers only by default', () => {
    expect(sanitizeNumber('1a2.5', 0)).toBe('12');
    expect(sanitizeNumber('-5', 0)).toBe('5');
  });

  it('reads thousands separators as grouping', () => {
    expect(sanitizeNumber('1,250', 0)).toBe('1250');
    expect(sanitizeNumber('1,250,000.5', 2)).toBe('1250000.5');
  });

  it('keeps one point and limits the decimals', () => {
    expect(sanitizeNumber('12.345', 2)).toBe('12.34');
    expect(sanitizeNumber('1.2.3', 2)).toBe('1.23');
    expect(sanitizeNumber('12,5', 1)).toBe('12.5');
    expect(sanitizeNumber('12.', 1)).toBe('12.');
  });
});
