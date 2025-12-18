import type { DailyWeather, Task } from "types";
import { toISO } from './Date';

/**
 * Builds a nested map for the visible week: isoDate -> city -> Task[]
 */
export function groupTasksByDateCity(tasks: Task[], days: DailyWeather[]): Map<string, Map<string, Task[]>> {
  const grouped = new Map<string, Map<string, Task[]>>();
  const visibleIso = new Set(days.map((d) => d.date));

  for (const t of tasks) {
    const iso = toISO(new Date(t.date));

    if (!visibleIso.has(iso)) continue;

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
export function deriveCitiesForVisibleWeek(tasks: Task[], days: DailyWeather[]): string[] {
  const visibleIso = new Set(days.map((d) => d.date));
  const cities = Array.from(new Set(
    tasks
      .filter((t) => visibleIso.has(toISO(new Date(t.date))))
      .map((t) => t.city)
  ));

  return cities.sort((a, b) => a.localeCompare(b));
}
