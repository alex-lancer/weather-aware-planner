// ForecastProvider: Open-Meteo daily forecast helpers

export type Coords = { lat: number; lon: number };

type Series = {
  dates: string[];
  precip: Array<number | null>;
  wind: Array<number | null>;
  temp: Array<number | null>;
};

function parseDaily(json: any): Series {
  const dates: string[] = json?.daily?.time ?? [];
  const precip: Array<number | null> = json?.daily?.precipitation_probability_max ?? [];
  const wind: Array<number | null> = json?.daily?.wind_speed_10m_max ?? json?.daily?.windspeed_10m_max ?? [];
  const temp: Array<number | null> = json?.daily?.temperature_2m_min ?? [];
  return { dates, precip, wind, temp };
}

export async function getDailyRange(coords: Coords, startIso: string, endIso: string): Promise<Series> {
  const api = new URL("https://api.open-meteo.com/v1/forecast");
  api.searchParams.set("latitude", String(coords.lat));
  api.searchParams.set("longitude", String(coords.lon));
  api.searchParams.set("daily", "precipitation_probability_max,temperature_2m_min,wind_speed_10m_max");
  api.searchParams.set("timezone", "auto");
  api.searchParams.set("start_date", startIso);
  api.searchParams.set("end_date", endIso);
  try {
    const res = await fetch(api.toString());
    if (!res.ok) throw new Error("forecast failed");
    const data = await res.json();
    return parseDaily(data);
  } catch {
    return { dates: [], precip: [], wind: [], temp: [] };
  }
}

export async function getNextDays(coords: Coords, days: number = 7): Promise<Series> {
  const api = new URL("https://api.open-meteo.com/v1/forecast");
  api.searchParams.set("latitude", String(coords.lat));
  api.searchParams.set("longitude", String(coords.lon));
  api.searchParams.set("daily", "precipitation_probability_max,temperature_2m_min,wind_speed_10m_max");
  api.searchParams.set("timezone", "auto");
  api.searchParams.set("forecast_days", String(days));
  try {
    const res = await fetch(api.toString());
    if (!res.ok) throw new Error("forecast failed");
    const data = await res.json();
    return parseDaily(data);
  } catch {
    return { dates: [], precip: [], wind: [], temp: [] };
  }
}
