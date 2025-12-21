// ForecastProvider: Open-Meteo daily forecast helpers
import type { Coords, ForecastSeries, GetDailyRange, GetNextDays } from "types";

function parseDaily(json: any): ForecastSeries {
  const dates: string[] = json?.daily?.time ?? [];
  const precip: Array<number | null> = json?.daily?.precipitation_probability_max ?? [];
  const wind: Array<number | null> = json?.daily?.wind_speed_10m_max ?? json?.daily?.windspeed_10m_max ?? [];
  const temp: Array<number | null> = json?.daily?.temperature_2m_min ?? [];
  return { dates, precip, wind, temp };
}

export const getDailyRange: GetDailyRange = async (coords: Coords, startIso: string, endIso: string) => {
  const api = new URL("https://api.open-meteo.com/v1/forecast");

  api.searchParams.set("latitude", String(coords.lat));
  api.searchParams.set("longitude", String(coords.lon));
  api.searchParams.set("daily", "precipitation_probability_max,temperature_2m_min,wind_speed_10m_max");
  api.searchParams.set("timezone", "auto");
  api.searchParams.set("start_date", startIso);
  api.searchParams.set("end_date", endIso);

  const res = await fetch(api.toString());

  if (!res.ok) throw new Error("forecast failed");

  const data = await res.json();

  return parseDaily(data);
};

export const getNextDays: GetNextDays = async (coords: Coords, days: number = 7) => {
  const api = new URL("https://api.open-meteo.com/v1/forecast");

  api.searchParams.set("latitude", String(coords.lat));
  api.searchParams.set("longitude", String(coords.lon));
  api.searchParams.set("daily", "precipitation_probability_max,temperature_2m_min,wind_speed_10m_max");
  api.searchParams.set("timezone", "auto");
  api.searchParams.set("forecast_days", String(days));

  const res = await fetch(api.toString());

  if (!res.ok) throw new Error("forecast failed");

  const data = await res.json();

  return parseDaily(data);
};
