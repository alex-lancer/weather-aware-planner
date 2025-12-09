import { Form, useLoaderData, useNavigation } from "react-router-dom";
import { LoaderData, Task, DailyWeather, DEFAULT_CITY, DEFAULT_COORDS, Role } from "../types";
import DayName from "./DayName";
import RiskBadge from "./RiskBadge";
import BaseSelect from "../commonComponents/BaseSelect";
import BaseButton from "../commonComponents/BaseButton";
import CityAutocomplete from "../commonComponents/CityAutocomplete";

export default function Planner() {
  const { role, city, coords, days, tasks, degraded } = useLoaderData<LoaderData>();
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting" || nav.state === "loading";

  // Group tasks by weekday index
  const grouped = new Map<number, Task[]>();
  for (const t of tasks) {
    grouped.set(t.weekday, [...(grouped.get(t.weekday) ?? []), t]);
  }

  return (
    <main className="pt-6 pb-20 px-4 max-w-3xl mx-auto">
      <header className="flex flex-col gap-3 mb-4">
        <h1 className="text-xl font-semibold">Weather-aware Planner</h1>
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
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {days.map((d) => {
          const dayIdx = new Date(d.date + "T00:00:00").getDay();
          const dayTasks = grouped.get(dayIdx) ?? [];
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
                    <li key={t.id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{t.title}</span>
                      <span className="text-xs text-gray-500">{t.durationHours}h</span>
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
