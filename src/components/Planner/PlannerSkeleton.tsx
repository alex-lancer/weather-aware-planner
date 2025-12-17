import React from "react";

export default function PlannerSkeleton() {
  // Skeleton UI matching Planner layout
  return (
    <div
      className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen overflow-x-auto"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="px-4 sm:px-6 space-y-6 animate-pulse">
        {/* Mobile/Tablet: Tabs area */}
        <div className="block lg:hidden">
          <div className="flex gap-2 overflow-x-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 rounded-md bg-gray-200 dark:bg-gray-700"
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
            ))}
          </div>
        </div>

        {/* Desktop: 7-day grid rows */}
        <div className="hidden lg:block">
          {Array.from({ length: 2 }).map((_, row) => (
            <div key={row} className="mb-6">
              <div className="h-4 w-28 mb-2 rounded bg-gray-200 dark:bg-gray-700" />
              <section className="grid grid-cols-7 gap-3 min-w-[980px]">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-40 rounded-lg bg-gray-200 dark:bg-gray-700"
                  />
                ))}
              </section>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
