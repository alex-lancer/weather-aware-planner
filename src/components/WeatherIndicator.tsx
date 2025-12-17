import type { DailyWeather } from "types";

type WeatherIndicatorProps = {
  day: Pick<DailyWeather, "precipProb" | "windMax" | "tempMin">;
  className?: string;
};

export default function WeatherIndicator({ day, className }: WeatherIndicatorProps) {
  return (
    <div className={("flex gap-3 text-xs text-gray-700 dark:text-gray-300 mb-3 " + (className ?? "")).trim()}>
      <span aria-label={`Precipitation probability: ${day.precipProb != null ? day.precipProb + '%' : 'no data'}`}>
        <span aria-hidden="true">☔ </span>
        {day.precipProb != null ? `${day.precipProb}%` : "–"}
      </span>
      <span aria-label={`Wind max: ${day.windMax != null ? day.windMax + ' meters per second' : 'no data'}`}>
        <span aria-hidden="true">💨 </span>
        {day.windMax != null ? `${day.windMax} m/s` : "–"}
      </span>
      <span aria-label={`Minimum temperature: ${day.tempMin != null ? day.tempMin + ' degrees Celsius' : 'no data'}`}>
        <span aria-hidden="true">🥶 </span>
        {day.tempMin != null ? `${day.tempMin}°C` : "–"}
      </span>
    </div>
  );
}
