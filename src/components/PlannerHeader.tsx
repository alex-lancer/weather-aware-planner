import { Link } from "react-router-dom";
import BaseButton from "../commonComponents/BaseButton";

type Props = {
  city: string;
  coords: { lat: number; lon: number };
  degraded: boolean;
  week: number;
  weekStart: string; // ISO yyyy-mm-dd (Monday)
  weekEnd: string;   // ISO yyyy-mm-dd (Sunday)
};

export default function PlannerHeader({ city, coords, degraded, week, weekStart, weekEnd }: Props) {
  return (
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
  );
}
