import { groupTasksByDateCity, deriveCitiesForVisibleWeek } from 'utilities/Planner';
import type { Task } from 'types';

describe('utilities/Planner', () => {
  const days = [
    '2025-12-15',
    '2025-12-16',
    '2025-12-17',
  ];

  test('groupTasksByDateCity groups only tasks in visible week', () => {
    const monday = '2025-12-15'; // 15th
    const tuesday = '2025-12-16'; // 16th
    const tasks: Task[] = [
      { id: 'a', title: 'A', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date(monday + 'T00:00:00').toISOString(), status: 'ToDo' },
      { id: 'b', title: 'B', role: 'technician', city: 'Seattle', durationHours: 1, date: new Date(tuesday + 'T00:00:00').toISOString(), status: 'ToDo' },
      { id: 'c', title: 'C', role: 'dispatcher', city: 'Denver', durationHours: 2, date: new Date('2026-01-01T00:00:00').toISOString(), status: 'ToDo' }, // outside
    ];

    const grouped = groupTasksByDateCity(tasks, days);

    expect(grouped.get(monday)?.get('Seattle')?.map(t => t.id)).toEqual(['a']);
    expect(grouped.get(tuesday)?.get('Seattle')?.map(t => t.id)).toEqual(['b']);
    // No entry for outside-week task
    expect(Array.from(grouped.values()).some(map => map.has('Denver'))).toBe(false);
  });

  test('deriveCitiesForVisibleWeek returns unique, sorted cities with tasks in visible week', () => {
    const tasks: Task[] = [
      { id: 'a', title: 'A', role: 'technician', city: 'Seattle', durationHours: 1, date: '2025-12-15T00:00:00.000Z', status: 'ToDo' },
      { id: 'b', title: 'B', role: 'technician', city: 'Denver', durationHours: 1, date: '2025-12-16T00:00:00.000Z', status: 'ToDo' },
      { id: 'c', title: 'C', role: 'technician', city: 'Seattle', durationHours: 1, date: '2025-12-17T00:00:00.000Z', status: 'ToDo' },
      { id: 'd', title: 'D', role: 'technician', city: 'London', durationHours: 1, date: '2026-01-10T00:00:00.000Z', status: 'ToDo' },
    ];
    expect(deriveCitiesForVisibleWeek(tasks, days)).toEqual(['Denver', 'Seattle']);
  });
});
