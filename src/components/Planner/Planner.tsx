import { useLoaderData, useNavigation } from "react-router-dom";
import { LoaderData, Task, DailyWeather } from "types";
import TaskCard from "components/TaskCard";
import PlannerHeader from "./PlannerHeader";
import PlannerFooter from "./PlannerFooter";
import PlannerCityTabs from "./PlannerCityTabs";

export default function Planner() {
  const { city, coords, days, tasks, degraded, week, weekStart, weekEnd, cityDays } = useLoaderData<LoaderData>();
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
      <PlannerHeader
        city={city}
        coords={coords}
        degraded={degraded}
        week={week}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />

      {/* Full-bleed content area */}
      <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-x-auto">
        <div className="px-4 sm:px-6 space-y-6">
          {/* Mobile & Tablet (<= lg-1): tabs grouped by city, stacked one column */}
          <div className="block lg:hidden">
            <PlannerCityTabs
              cities={cities}
              days={days}
              grouped={grouped}
              week={week}
              isSubmitting={isSubmitting}
              cityDays={cityDays}
            />
          </div>

          {/* Desktop (lg+): rows per city with 7 cards */}
          <div className="hidden lg:block">
            {cities.length === 0 ? (
              <p className="text-sm text-gray-500">No tasks in this week</p>
            ) : (
              cities.map((c) => (
                <div key={c} className="">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{c}</div>
                  <section className="grid grid-cols-7 gap-3 min-w-[980px]">
                    {(cityDays?.[c] ?? days).map((d: DailyWeather) => {
                      const dayCityTasks = grouped.get(d.date)?.get(c) ?? [];
                      return (
                        <TaskCard
                          key={d.date + '::' + c}
                          day={d}
                          tasks={dayCityTasks}
                          week={week}
                          isSubmitting={isSubmitting}
                          city={c}
                        />
                      );
                    })}
                  </section>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <PlannerFooter />
    </main>
  );
}
