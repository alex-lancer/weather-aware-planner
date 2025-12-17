import { deriveCitiesForVisibleWeek, groupTasksByDateCity, toISO } from '../PlannerService';
import type { DailyWeather, Task } from '../../types';

describe('PlannerService', () => {
  function makeDay(date: string): DailyWeather {
    return { date, precipProb: null, windMax: null, tempMin: null, risk: 'low' };
  }

  test('toISO formats dates as YYYY-MM-DD', () => {
    const d = new Date('2025-12-05T10:20:30Z');
    expect(toISO(d)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('groupTasksByDateCity groups only tasks within visible days by iso and city', () => {
    const days = [
      makeDay('2025-12-15'),
      makeDay('2025-12-16'),
      makeDay('2025-12-17'),
    ];
    const tasks: Task[] = [
      { id: 'a', title: 'A', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date('2025-12-15T00:00:00'), status: 'ToDo' },
      { id: 'b', title: 'B', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date('2025-12-15T12:00:00'), status: 'ToDo' },
      { id: 'c', title: 'C', role: 'technician', city: 'Denver', durationHours: 1, date: new Date('2025-12-16T00:00:00'), status: 'ToDo' },
      // outside visible days
      { id: 'x', title: 'X', role: 'technician', city: 'London', durationHours: 1, date: new Date('2025-12-20T00:00:00'), status: 'ToDo' },
    ];

    const grouped = groupTasksByDateCity(tasks, days);
    expect(grouped.size).toBe(2); // 15th and 16th
    const d15 = grouped.get('2025-12-15');
    expect(d15?.get('Seattle')?.length).toBe(2);
    const d16 = grouped.get('2025-12-16');
    expect(d16?.get('Denver')?.length).toBe(1);
    expect(grouped.get('2025-12-20')).toBeUndefined();
  });

  test('deriveCitiesForVisibleWeek returns sorted unique cities with tasks in visible days', () => {
    const days = [makeDay('2025-12-15'), makeDay('2025-12-16')];
    const tasks: Task[] = [
      { id: 'a', title: 'A', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date('2025-12-15T00:00:00'), status: 'ToDo' },
      { id: 'b', title: 'B', role: 'technician', city: 'Denver', durationHours: 1, date: new Date('2025-12-16T00:00:00'), status: 'ToDo' },
      { id: 'c', title: 'C', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date('2025-12-16T00:00:00'), status: 'ToDo' },
      // outside visible days
      { id: 'x', title: 'X', role: 'technician', city: 'Boston', durationHours: 1, date: new Date('2025-12-20T00:00:00'), status: 'ToDo' },
    ];

    const cities = deriveCitiesForVisibleWeek(tasks, days);
    expect(cities).toEqual(['Denver', 'Seattle']);
  });
});
