import { computeRisk } from 'utilities/Risk';

describe('utilities/Risk.computeRisk', () => {
  test('returns low when no risk factors present', () => {
    expect(computeRisk({ precip: null, wind: null, temp: null })).toBe('low');
    expect(computeRisk({ precip: 10, wind: 5, temp: 10 })).toBe('low');
  });

  test('returns medium when exactly one factor is risky', () => {
    expect(computeRisk({ precip: 45, wind: 5, temp: 10 })).toBe('medium'); // rain
    expect(computeRisk({ precip: 10, wind: 12, temp: 10 })).toBe('medium'); // wind
    expect(computeRisk({ precip: 10, wind: 5, temp: 0 })).toBe('medium'); // cold at threshold
  });

  test('returns high when at least two factors are risky', () => {
    expect(computeRisk({ precip: 50, wind: 12, temp: 10 })).toBe('high');
    expect(computeRisk({ precip: 50, wind: 5, temp: -2 })).toBe('high');
    expect(computeRisk({ precip: 10, wind: 12, temp: -3 })).toBe('high');
  });
});
