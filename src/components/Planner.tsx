import { Form, Link, useLoaderData, useNavigation } from "react-router-dom";
import { LoaderData, Task } from "../types";
import DayName from "./DayName";
import RiskBadge from "./RiskBadge";
import BaseSelect from "../commonComponents/BaseSelect";
import BaseButton from "../commonComponents/BaseButton";
import CityAutocomplete from "../commonComponents/CityAutocomplete";

export default function Planner() {
  const { role, city, coords, days, tasks, degraded, week, weekStart, weekEnd } = useLoaderData<LoaderData>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting" || nav.state === "loading";

  const grouped = new Map<string, Task[]>();
  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  for (const t of tasks) {
    const key = toISO(new Date(t.date));
    grouped.set(key, [...(grouped.get(key) ?? []), t]);
  }
console.log("DEBUG", tasks, grouped);
  return (
    <main className="pt-6 pb-20 px-4 max-w-3xl mx-auto">
      <header className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Weather-aware Planner</h1>
          <Link to="/dashboard/task">
            <BaseButton variant="primary">Create new task</BaseButton>
          </Link>
        </div>
        <Form method="get" className="flex gap-2 items-center">
          <CityAutocomplete name="city" defaultValue={city} />
          <BaseSelect
            name="role"
            defaultValue={role}
          >
            <option value="manager">Manager</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="technician">Technician</option>
          </BaseSelect>
          <input type="hidden" name="week" value={String(week)} />
          <BaseButton
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Loading…" : "Apply"}
          </BaseButton>
        </Form>
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
          <Link to={`/?city=${encodeURIComponent(city)}&role=${encodeURIComponent(role)}&week=${week - 1}`}>
            <BaseButton variant="secondary">← Prev week</BaseButton>
          </Link>
          <div className="text-sm text-gray-700 dark:text-gray-200">
            {new Date(weekStart + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {' – '}
            {new Date(weekEnd + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <Link to={`/?city=${encodeURIComponent(city)}&role=${encodeURIComponent(role)}&week=${week + 1}`}>
            <BaseButton variant="secondary">Next week →</BaseButton>
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {days.map((d) => {
          const dayTasks = grouped.get(d.date) ?? [];
          return (
            <div key={d.date} className="rounded-2xl border p-3 dark:border-neutral-700">
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
              {dayTasks.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks</p>
              ) : (
                <ul className="space-y-2">
                  {dayTasks.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <Link to={`/dashboard/task/${t.id}`} className="truncate text-blue-700 hover:underline">
                          {t.title}
                        </Link>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{t.durationHours}h</span>
                      <Form method="post" action={`/dashboard/task/${t.id}/reschedule`} className="ml-2">
                        <input type="hidden" name="city" value={city} />
                        <input type="hidden" name="role" value={role} />
                        <input type="hidden" name="week" value={String(week)} />
                        <BaseButton type="submit" size="sm" variant="secondary" disabled={isSubmitting}>
                          {isSubmitting ? '…' : 'Reschedule'}
                        </BaseButton>
                      </Form>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </section>

      <footer className="mt-6 text-xs text-gray-500">
        Risk is based on rain probability ≥ 40%, wind ≥ 10 m/s, and temp ≤ 0°C.
      </footer>
    </main>
  );
}
