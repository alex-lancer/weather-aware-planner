import { groupTasksByDateCity, deriveCitiesForVisibleWeek } from 'utilities/Planner';
import type { DailyWeather, Task } from 'types';

function makeDays(startIso: string): DailyWeather[] {
  const start = new Date(startIso + 'T00:00:00');
  const out: DailyWeather[] = [] as any;
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push({
      date: d.toISOString().slice(0, 10),
      precipProb: null,
      windMax: null,
      tempMin: null,
      risk: 'low',
    });
  }
  return out;
}

describe('utilities/Planner', () => {
  const weekDays = makeDays('2025-12-15'); // Monday

  test('groupTasksByDateCity groups only tasks in visible week', () => {
    const monday = weekDays[0].date; // 15th
    const tuesday = weekDays[1].date; // 16th
    const tasks: Task[] = [
      { id: 'a', title: 'A', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date(monday + 'T00:00:00'), status: 'ToDo' },
      { id: 'b', title: 'B', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date(tuesday + 'T00:00:00'), status: 'ToDo' },
      { id: 'c', title: 'C', role: 'dispatcher', city: 'Denver', durationHours: 2, date: new Date('2026-01-01T00:00:00'), status: 'ToDo' }, // outside
    ];

    const grouped = groupTasksByDateCity(tasks, weekDays);

    expect(grouped.get(monday)?.get('Seattle')?.map(t => t.id)).toEqual(['a']);
    expect(grouped.get(tuesday)?.get('Seattle')?.map(t => t.id)).toEqual(['b']);
    // No entry for outside-week task
    expect(Array.from(grouped.values()).some(map => map.has('Denver'))).toBe(false);
  });

  test('deriveCitiesForVisibleWeek returns unique, sorted cities with tasks in visible week', () => {
    const tasks: Task[] = [
      { id: 'a', title: 'A', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date('2025-12-15T00:00:00'), status: 'ToDo' },
      { id: 'b', title: 'B', role: 'technician', city: 'Denver', durationHours: 1, date: new Date('2025-12-16T00:00:00'), status: 'ToDo' },
      { id: 'c', title: 'C', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date('2025-12-17T00:00:00'), status: 'ToDo' },
      { id: 'd', title: 'D', role: 'technician', city: 'London', durationHours: 1, date: new Date('2026-01-10T00:00:00'), status: 'ToDo' },
    ];
    expect(deriveCitiesForVisibleWeek(tasks, weekDays)).toEqual(['Denver', 'Seattle']);
  });
});
