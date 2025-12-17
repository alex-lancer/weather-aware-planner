import { DailyWeather } from "types";

export default function RiskBadge({ risk }: { risk: DailyWeather["risk"] }) {
  const map = {
    low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    high: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  } as const;
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[risk]}`}
      aria-label={`Risk level: ${risk}`}
    >
      {risk}
    </span>
  );
}
