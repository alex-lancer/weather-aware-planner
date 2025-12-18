import { toISO } from 'utilities/Date';

describe('utilities/Date.toISO', () => {
  test('formats YYYY-MM-DD with zero padding', () => {
    const d = new Date(2025, 0, 5); // Jan 5, 2025
    expect(toISO(d)).toBe('2025-01-05');
  });

  test('handles end of year and leap day', () => {
    expect(toISO(new Date(2025, 11, 31))).toBe('2025-12-31');
    expect(toISO(new Date(2024, 1, 29))).toBe('2024-02-29'); // leap year
  });
});
