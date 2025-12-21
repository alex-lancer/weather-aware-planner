import type { Task } from "types";
import { toISO } from './Date';

/**
 * Builds a nested map for the visible week: isoDate -> city -> Task[]
 */
export function groupTasksByDateCity(tasks: Task[], days: string[]): Map<string, Map<string, Task[]>> {
  const grouped = new Map<string, Map<string, Task[]>>();

  for (const t of tasks) {
    const iso = toISO(new Date(t.date));

    if (!days.includes(iso)) continue;

    const byCity = grouped.get(iso) ?? new Map<string, Task[]>();
    const arr = byCity.get(t.city) ?? [];

    byCity.set(t.city, [...arr, t]);
    grouped.set(iso, byCity);
  }

  return grouped;
}

/**
 * Derives a sorted list (asc) of unique cities that have tasks in the visible week.
 */
export function deriveCitiesForVisibleWeek(tasks: Task[], days: string[]): string[] {
  const cities = Array.from(new Set(
    tasks
      .filter((t) => days.includes(toISO(new Date(t.date))))
      .map((t) => t.city)
  ));

  return cities.sort((a, b) => a.localeCompare(b));
}
