import React from 'react';
import type { DailyWeather, Task } from '../types';
import TaskCard from './TaskCard';

type Props = {
  cities: string[];
  days: DailyWeather[];
  grouped: Map<string, Map<string, Task[]>>; // iso -> city -> tasks
  week: number;
  isSubmitting: boolean;
  cityDays?: Record<string, DailyWeather[]>;
};

export default function PlannerCityTabs({ cities, days, grouped, week, isSubmitting, cityDays }: Props) {
  const [active, setActive] = React.useState<string>(cities[0] ?? '');
  React.useEffect(() => {
    if (!active || !cities.includes(active)) {
      setActive(cities[0] ?? '');
    }
  }, [cities, active]);

  if (cities.length === 0) {
    return <p className="text-sm text-gray-500">No tasks in this week</p>;
  }

  return (
    <div className="space-y-3">
      {/* Tabs header */}
      <div className="flex gap-2 overflow-x-auto">
        {cities.map((c) => {
          const isActive = c === active;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={[
                'px-3 py-1.5 rounded-full text-sm whitespace-nowrap border',
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
              ].join(' ')}
              aria-pressed={isActive}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Active city content: stack cards in one column for tablet/mobile view */}
      {active && (
        <section className="grid grid-cols-1 gap-3">
          {(cityDays?.[active] ?? days).map((d) => {
            const dayCityTasks = grouped.get(d.date)?.get(active) ?? [];
            return (
              <TaskCard
                key={d.date + '::' + active}
                day={d}
                tasks={dayCityTasks}
                week={week}
                isSubmitting={isSubmitting}
                city={active}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}
