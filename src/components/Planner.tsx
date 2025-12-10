import { Link, useLoaderData, useNavigation } from "react-router-dom";
import { LoaderData, Task } from "../types";
import DayName from "./DayName";
import RiskBadge from "./RiskBadge";
import BaseButton from "../commonComponents/BaseButton";

export default function Planner() {
  const { city, coords, days, tasks, degraded, week, weekStart, weekEnd } = useLoaderData<LoaderData>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting" || nav.state === "loading";

  // Build nested map for visible week: isoDate -> city -> Task[]
  const grouped = new Map<string, Map<string, Task[]>>();
  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const visibleIso = new Set(days.map((d) => d.date));
  for (const t of tasks) {
    const iso = toISO(new Date(t.date));
    if (!visibleIso.has(iso)) continue;
    const byCity = grouped.get(iso) ?? new Map<string, Task[]>();
    const arr = byCity.get(t.city) ?? [];
    byCity.set(t.city, [...arr, t]);
    grouped.set(iso, byCity);
  }

  // Derive sorted list of cities that have tasks in the visible week
  const cities = Array.from(
    new Set(
      tasks
        .filter((t) => visibleIso.has(toISO(new Date(t.date))))
        .map((t) => t.city)
    )
  ).sort((a, b) => a.localeCompare(b));
  return (
    <main className="pt-6 pb-20 px-4 max-w-3xl mx-auto">
      <header className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Weather-aware Planner</h1>
          <Link to="/dashboard/task">
            <BaseButton variant="primary">Create new task</BaseButton>
          </Link>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {degraded ? (
            <p>Using fallback data due to slow network or API limits. Try again later.</p>
          ) : (
            <p>
              Showing 7-day outlook for {city} ({coords.lat.toFixed(2)}, {coords.lon.toFixed(2)}).
            </p>
          )}
        </div>
        {/* Week navigation toolbar */}
        <div className="flex items-center justify-between gap-3 mt-2">
          <Link to={`/?week=${week - 1}`}>
            <BaseButton variant="secondary">← Prev week</BaseButton>
          </Link>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            {new Date(weekStart + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {' – '}
            {new Date(weekEnd + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <Link to={`/?week=${week + 1}`}>
            <BaseButton variant="secondary">Next week →</BaseButton>
          </Link>
        </div>
      </header>

      {/* Full-bleed section with one row per city, each row has 7 day cards */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-x-auto">
        <div className="px-4 sm:px-6 space-y-6">
          {cities.length === 0 ? (
            <p className="text-sm text-gray-500">No tasks in this week</p>
          ) : (
            cities.map((c) => (
              <div key={c} className="">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{c}</div>
                <section className="grid grid-cols-7 gap-3 min-w-[980px]">
                  {days.map((d) => {
                    const dayCityTasks = grouped.get(d.date)?.get(c) ?? [];
                    return (
                      <div key={d.date + '::' + c} className="rounded-2xl border p-3 dark:border-neutral-700">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <DayName iso={d.date} />
                          <RiskBadge risk={d.risk} />
                        </div>
                        <div className="flex gap-3 text-xs text-gray-700 dark:text-gray-300 mb-3">
                          <span>
                            ☔ {d.precipProb != null ? `${d.precipProb}%` : "–"}
                          </span>
                          <span>
                            💨 {d.windMax != null ? `${d.windMax} m/s` : "–"}
                          </span>
                          <span>
                            🥶 {d.tempMin != null ? `${d.tempMin}°C` : "–"}
                          </span>
                        </div>
                        {dayCityTasks.length === 0 ? (
                          <p className="text-sm text-gray-500">No tasks</p>
                        ) : (
                          <ul className="space-y-2">
                            {dayCityTasks.map((t) => (
                              <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                                <div className="min-w-0 flex-1">
                                  <Link to={`/dashboard/task/${t.id}`} className="truncate text-blue-700 hover:underline">
                                    {t.title}
                                  </Link>
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{t.durationHours}h</span>
                                <form method="post" action={`/dashboard/task/${t.id}/reschedule`} className="ml-2">
                                  <input type="hidden" name="week" value={String(week)} />
                                  <BaseButton type="submit" size="sm" variant="secondary" disabled={isSubmitting}>
                                    {isSubmitting ? '…' : 'R'}
                                  </BaseButton>
                                </form>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </section>
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="mt-6 text-xs text-gray-500">
        Risk is based on rain probability ≥ 40%, wind ≥ 10 m/s, and temp ≤ 0°C.
      </footer>
    </main>
  );
}
