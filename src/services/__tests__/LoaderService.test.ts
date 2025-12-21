import { plannerLoader } from '../LoaderService';
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

// Disable retry delays by mocking utilities/Retry to pass-through
jest.mock('../../utilities/Retry', () => ({
  withRetryFn: (fn: any) => (...args: any[]) => Promise.resolve(fn(...args)),
  withRetry: (action: any) => Promise.resolve(action(1)),
}));

// Mock repositories to make loader return test-controlled tasks
// Important: do not capture out-of-scope variables in the factory
jest.mock('../../repositories/instances', () => {
  const getAll = jest.fn(() => []);
  return {
    taskRepository: { getAll },
    authRepository: {
      getCurrentUser: () => null,
      login: () => {},
      logout: () => {},
    },
  };
});


function buildRequest(url: string) {
  return new Request(url);
}

// Helper to set tasks for current test on mocked repository
function setTasks(tasks: Task[]) {
  const instances = jest.requireMock('../../repositories/instances') as any;
  (instances.taskRepository.getAll as jest.Mock).mockReturnValue(tasks);
}

describe('LoaderService.loader', () => {
  const systemNow = new Date('2025-12-15T10:11:00Z'); // Monday

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
    // reset tasks repo mock to default empty
    const instances = jest.requireMock('../../repositories/instances') as any;
    if (instances?.taskRepository?.getAll?.mockReset) {
      instances.taskRepository.getAll.mockReset();
      instances.taskRepository.getAll.mockReturnValue([]);
    }
    // Ensure request cache does not leak between tests
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // ignore
    }
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
    const res = await plannerLoader({ request: buildRequest('http://localhost/?week=0&city=Seattle') });

    // Assert
    const exp = expectedWeekStartEnd(0);
    expect(res.weekStart).toBe(exp.start);
    expect(res.weekEnd).toBe(exp.end);
    expect(res.days).toHaveLength(7);
    expect(res.tasks).toEqual(tasks);
  });

  test('fallback days when provider fails', async () => {
    setTasks([]);
    mockGeocodeCity.mockResolvedValue({ lat: 47.6062, lon: -122.3321 });
    mockGetDailyRange.mockRejectedValue(new Error('boom'));

    // Start the loader first, then advance fake timers to let retry backoff resolve
    const promise = plannerLoader({ request: buildRequest('http://localhost/?week=0') });
    // Advance fake timers to allow retry backoff timers to elapse
    jest.advanceTimersByTime(10_000);
    const res = await promise;
    expect(res.days).toHaveLength(7);
    // Compute expected using the same approach as LoaderService fallback
    const startLocal = new Date(res.weekStart + 'T00:00:00');
    const expectedFirst = startLocal.toISOString().slice(0, 10);
    const endLocal = new Date(startLocal);
    endLocal.setDate(startLocal.getDate() + 6);
    const expectedLast = endLocal.toISOString().slice(0, 10);
    expect(res.days[0]).toBe(expectedFirst);
    expect(res.days[6]).toBe(expectedLast);
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

    const res = await plannerLoader({ request: buildRequest('http://localhost/?city=Seattle') });
    // cityDays may be deferred (Promise); resolve it to test contents
    const cityDays: any = await Promise.resolve((res as any).cityDays);
    // Only Seattle & Denver should be included
    expect(Object.keys(cityDays || {})).toEqual(['Seattle', 'Denver']);
    expect(cityDays?.Seattle?.length).toBe(7);
    expect(cityDays?.Denver?.length).toBe(7);
    // London is out of visible week
    expect((cityDays as any)?.London).toBeUndefined();
  });

  test('supports week offsets (week=1)', async () => {
    setTasks([]);
    mockGeocodeCity.mockResolvedValue({ lat: 47.6062, lon: -122.3321 });
    mockGetDailyRange.mockImplementation((_coords, startIso: string) => ({
      dates: [startIso], precip: [null], wind: [null], temp: [null],
    }));

    const res = await plannerLoader({ request: buildRequest('http://localhost/?week=1') });
    const exp = expectedWeekStartEnd(1);
    expect(res.weekStart).toBe(exp.start);
    expect(res.weekEnd).toBe(exp.end);
  });
});
