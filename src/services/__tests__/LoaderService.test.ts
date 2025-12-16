import { makeLoader } from '../LoaderService';
import type { Task } from '../../types';

// Mock providers
const mockGeocodeCity = jest.fn();
jest.mock('../../providers/NominatimProfider', () => ({
  geocodeCity: (city: any) => mockGeocodeCity(city),
}));

const mockGetDailyRange = jest.fn();
jest.mock('../../providers/ForecastProvider', () => ({
  getDailyRange: (coords: any, startIso: any, endIso: any) => mockGetDailyRange(coords, startIso, endIso),
}));

// Use real computeRisk from HelperService

let fakeTasks: Task[] = [];

function buildRequest(url: string) {
  return new Request(url);
}

function setTasks(tasks: Task[]) {
  fakeTasks = tasks;
}

describe('LoaderService.loader', () => {
  const systemNow = new Date('2025-12-15T10:11:00Z'); // Monday
  const loader = makeLoader({
    tasks: { getAll: () => fakeTasks },
  });

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(systemNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockGeocodeCity.mockReset();
    mockGetDailyRange.mockReset();
  });

  function expectedWeekStartEnd(week = 0) {
    const today = new Date();
    const day = today.getDay(); // local
    const mondayOffset = (day === 0 ? -6 : 1 - day);
    const baseMonday = new Date(today);
    baseMonday.setHours(0, 0, 0, 0);
    baseMonday.setDate(baseMonday.getDate() + mondayOffset + week * 7);
    const baseSunday = new Date(baseMonday);
    baseSunday.setDate(baseMonday.getDate() + 6);
    const start = baseMonday.toISOString().slice(0, 10);
    const end = baseSunday.toISOString().slice(0, 10);
    return { start, end };
  }

  test('computes weekStart/weekEnd for week=0 and maps weather days with risk', async () => {
    // Arrange
    const tasks: Task[] = [
      {
        id: 't-sea-1',
        title: 'A',
        role: 'technician',
        city: 'Seattle',
        durationHours: 2,
        date: new Date('2025-12-15T00:00:00'),
        status: 'ToDo',
      },
      {
        id: 't-den-1',
        title: 'B',
        role: 'technician',
        city: 'Denver',
        durationHours: 3,
        date: new Date('2025-12-16T00:00:00'),
        status: 'ToDo',
      },
    ];
    setTasks(tasks);

    mockGeocodeCity.mockResolvedValue({ lat: 47.6062, lon: -122.3321 });
    mockGetDailyRange.mockImplementation((_coords, startIso: string, _endIso: string) => {
      const start = new Date(startIso + 'T00:00:00');
      const dates: string[] = [];
      const precip: Array<number | null> = [];
      const wind: Array<number | null> = [];
      const temp: Array<number | null> = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
        precip.push(i === 2 ? 50 : 10); // one day with higher rain
        wind.push(i === 4 ? 12 : 5); // one day with higher wind
        temp.push(5); // no freezing
      }
      return { dates, precip, wind, temp };
    });

    // Act
    const res = await loader({ request: buildRequest('http://localhost/?week=0&city=Seattle') });

    // Assert
    const exp = expectedWeekStartEnd(0);
    expect(res.weekStart).toBe(exp.start);
    expect(res.weekEnd).toBe(exp.end);
    expect(res.days).toHaveLength(7);
    // Check a mapped day fields & risk computation (day index 2 has rain>=40 => medium at least)
    const day2 = res.days[2];
    expect(day2.precipProb).toBe(50);
    expect(['medium', 'high']).toContain(day2.risk);
    expect(res.tasks).toEqual(tasks);
    expect(res.degraded).toBe(false);
  });

  test('fallback days when provider fails', async () => {
    setTasks([]);
    mockGeocodeCity.mockResolvedValue({ lat: 47.6062, lon: -122.3321 });
    mockGetDailyRange.mockRejectedValue(new Error('boom'));

    const res = await loader({ request: buildRequest('http://localhost/?week=0') });
    expect(res.days).toHaveLength(7);
    // Compute expected using the same approach as LoaderService fallback
    const startLocal = new Date(res.weekStart + 'T00:00:00');
    const expectedFirst = startLocal.toISOString().slice(0, 10);
    const endLocal = new Date(startLocal);
    endLocal.setDate(startLocal.getDate() + 6);
    const expectedLast = endLocal.toISOString().slice(0, 10);
    expect(res.days[0].date).toBe(expectedFirst);
    expect(res.days[6].date).toBe(expectedLast);
    expect(res.days.every(d => d.precipProb === null && d.windMax === null && d.tempMin === null)).toBe(true);
  });

  test('degraded flag true only for non-default city on geocode failure', async () => {
    setTasks([]);
    mockGeocodeCity.mockResolvedValue(null);
    mockGetDailyRange.mockResolvedValue({ dates: [], precip: [], wind: [], temp: [] });

    const nonDefault = await loader({ request: buildRequest('http://localhost/?city=Warsaw') });
    expect(nonDefault.degraded).toBe(true);

    const def = await loader({ request: buildRequest('http://localhost/?city=Seattle') });
    expect(def.degraded).toBe(false);
  });

  test('builds cityDays only for cities with tasks in visible week', async () => {
    const tasks: Task[] = [
      // In week (Mon 15..Sun 21)
      { id: 'a', title: 'A', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date('2025-12-15T00:00:00'), status: 'ToDo' },
      { id: 'b', title: 'B', role: 'technician', city: 'Denver', durationHours: 1, date: new Date('2025-12-16T00:00:00'), status: 'ToDo' },
      // Outside week
      { id: 'c', title: 'C', role: 'technician', city: 'London', durationHours: 1, date: new Date('2026-01-10T00:00:00'), status: 'ToDo' },
    ];
    setTasks(tasks);

    // Header city geocode OK
    mockGeocodeCity.mockImplementation(async (city: string) => {
      if (city === 'Seattle') return { lat: 47.6, lon: -122.33 };
      if (city === 'Denver') return { lat: 39.74, lon: -104.99 };
      return null; // others
    });
    mockGetDailyRange.mockImplementation((_coords, startIso: string) => {
      // return 7 sequential dates starting at startIso, null metrics
      const start = new Date(startIso + 'T00:00:00');
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      const nulls = Array(7).fill(null);
      return { dates, precip: nulls, wind: nulls, temp: nulls };
    });

    const res = await loader({ request: buildRequest('http://localhost/?city=Seattle') });

    // Only Seattle & Denver should be included
    expect(Object.keys(res.cityDays || {})).toEqual(['Seattle', 'Denver']);
    expect(res.cityDays?.Seattle?.length).toBe(7);
    expect(res.cityDays?.Denver?.length).toBe(7);
    // London is out of visible week
    expect(res.cityDays?.London).toBeUndefined();
  });

  test('supports week offsets (week=1)', async () => {
    setTasks([]);
    mockGeocodeCity.mockResolvedValue({ lat: 47.6062, lon: -122.3321 });
    mockGetDailyRange.mockImplementation((_coords, startIso: string) => ({
      dates: [startIso], precip: [null], wind: [null], temp: [null],
    }));

    const res = await loader({ request: buildRequest('http://localhost/?week=1') });
    const exp = expectedWeekStartEnd(1);
    expect(res.weekStart).toBe(exp.start);
    expect(res.weekEnd).toBe(exp.end);
  });
});
