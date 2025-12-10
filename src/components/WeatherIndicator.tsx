import type { DailyWeather } from "../types";

type WeatherIndicatorProps = {
  day: Pick<DailyWeather, "precipProb" | "windMax" | "tempMin">;
  className?: string;
};

export default function WeatherIndicator({ day, className }: WeatherIndicatorProps) {
  return (
    <div className={("flex gap-3 text-xs text-gray-700 dark:text-gray-300 mb-3 " + (className ?? "")).trim()}>
      <span>
        ☔ {day.precipProb != null ? `${day.precipProb}%` : "–"}
      </span>
      <span>
        💨 {day.windMax != null ? `${day.windMax} m/s` : "–"}
      </span>
      <span>
        🥶 {day.tempMin != null ? `${day.tempMin}°C` : "–"}
      </span>
    </div>
  );
}
