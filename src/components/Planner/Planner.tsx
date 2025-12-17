import { useLoaderData, useNavigation, Await } from "react-router-dom";
import { Suspense } from "react";
import { LoaderData, DailyWeather } from "types";
import TaskCard from "components/TaskCard";
import PlannerHeader from "./PlannerHeader";
import PlannerFooter from "./PlannerFooter";
import PlannerCityTabs from "./PlannerCityTabs";
import { deriveCitiesForVisibleWeek, groupTasksByDateCity } from "services/PlannerService";
import PlannerSkeleton from "./PlannerSkeleton";

export default function Planner() {
  const data = useLoaderData() as any as LoaderData & { cityDays: any };
  const { city, coords, days, tasks, degraded, week, weekStart, weekEnd } = data as LoaderData;
  const cityDaysDeferred = (data as any).cityDays as Promise<Record<string, DailyWeather[]>> | Record<string, DailyWeather[]>;
  const nav = useNavigation();
  const isSubmitting = nav.state === "submitting" || nav.state === "loading";

  // Build nested map for visible week: isoDate -> city -> Task[]
  const grouped = groupTasksByDateCity(tasks, days);

  // Derive sorted list of cities that have tasks in the visible week
  const cities = deriveCitiesForVisibleWeek(tasks, days);
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
      <Suspense fallback={<PlannerSkeleton />}>
        <Await resolve={cityDaysDeferred}>
          {(cityDays: Record<string, DailyWeather[]>) => (
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
          )}
        </Await>
      </Suspense>

      <PlannerFooter />
    </main>
  );
}
