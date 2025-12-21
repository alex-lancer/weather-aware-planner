export type DailyWeather = {
  date: string; // ISO date
  precipProb: number | null; // %
  windMax: number | null; // m/s
  tempMin: number | null; // C
  risk: "low" | "medium" | "high";
};

export type ForecastSeries = {
  dates: string[];
  precip: Array<number | null>;
  wind: Array<number | null>;
  temp: Array<number | null>;
};

export type Coords = { lat: number; lon: number };

export type GetDailyRange = (
  coords: Coords,
  startIso: string,
  endIso: string
) => Promise<ForecastSeries>;

export type GetNextDays = (
  coords: Coords,
  days?: number
) => Promise<ForecastSeries>;
