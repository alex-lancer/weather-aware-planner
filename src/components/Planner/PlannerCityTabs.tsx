import React, { useEffect, useRef, useState, KeyboardEvent } from 'react';
import type { DailyWeather, Task } from 'types';
import TaskCard from 'components/Task/TaskCard';

type Props = {
  cities: string[];
  days: string[];
  grouped: Map<string, Map<string, Task[]>>; // iso -> city -> tasks
  week: number;
  isSubmitting: boolean;
  cityDays?: Record<string, DailyWeather[]>;
};

export default function PlannerCityTabs({ cities, days, grouped, week, isSubmitting, cityDays }: Props) {
  const [active, setActive] = useState<string>(cities[0] ?? '');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!active || !cities.includes(active)) {
      setActive(cities[0] ?? '');
    }
  }, [cities, active]);

  if (cities.length === 0) {
    return <p className="text-sm text-gray-500">No tasks in this week</p>;
  }

  const onTabsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = cities.indexOf(active);

    if (idx < 0) return;
    e.preventDefault();

    if (e.key === 'ArrowRight') {
      const next = (idx + 1) % cities.length;

      setActive(cities[next]);
      tabRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      const prev = (idx - 1 + cities.length) % cities.length;

      setActive(cities[prev]);
      tabRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      setActive(cities[0]);
      tabRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      setActive(cities[cities.length - 1]);
      tabRefs.current[cities.length - 1]?.focus();
    }
  };

  return (
    <div className="space-y-3">
      {/* Tabs header */}
      <div
        className="flex gap-2 overflow-x-auto"
        role="tablist"
        aria-label="Cities"
        onKeyDown={onTabsKeyDown}
      >
        {cities.map((c) => {
          const isActive = c === active;
          const tabId = `tab-${c}`;
          const panelId = `tabpanel-${c}`;
          return (
            <button
              key={c}
              type="button"
              id={tabId}
              onClick={() => setActive(c)}
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId}
              className={[
                'px-3 py-1.5 rounded-full text-sm whitespace-nowrap border',
                isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50',
              ].join(' ')}
              ref={(el) => {
                const i = cities.indexOf(c);
                tabRefs.current[i] = el;
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      {/* Active city content: stack cards in one column for tablet/mobile view */}
      {active && (
        <section
          className="grid grid-cols-1 gap-3"
          role="tabpanel"
          id={`tabpanel-${active}`}
          aria-labelledby={`tab-${active}`}
        >
          {(cityDays?.[active])?.map((d) => {
            const day = (d as DailyWeather).date;
            const dayCityTasks = grouped.get(day)?.get(active) ?? [];

            return (
              <TaskCard
                key={day + '::' + active}
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
