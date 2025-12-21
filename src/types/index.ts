export type Role = "manager" | "technician" | "dispatcher";

export type DailyWeather = {
  date: string; // ISO date
  precipProb: number | null; // %
  windMax: number | null; // m/s
  tempMin: number | null; // C
  risk: "low" | "medium" | "high";
};

export type Status = "ToDo" | "InProgress" | "Done";

export type Task = {
  id: string;
  title: string;
  description?: string;
  date: Date;
  role: Role;
  city: string;
  durationHours: number;
  status: Status;
  notes?: string;
};

export type LoaderData = {
  role: Role;
  city: string;
  coords: { lat: number; lon: number };
  days: DailyWeather[];
  tasks: Task[];
  degraded: boolean;
  week: number; // relative week offset from current week (0=current)
  weekStart: string; // ISO date (Monday)
  weekEnd: string; // ISO date (Sunday)
  // Per-city weather for the visible week (Mon–Sun)
  cityDays?: Record<string, DailyWeather[]>;
};

export const DEFAULT_CITY = "Seattle";
export const DEFAULT_COORDS = { lat: 47.6062, lon: -122.3321 };

// Forecast typing: helpers from providers/ForecastProvider
export type Coords = { lat: number; lon: number };

export type ForecastSeries = {
  dates: string[];
  precip: Array<number | null>;
  wind: Array<number | null>;
  temp: Array<number | null>;
};

export type GetDailyRange = (
  coords: Coords,
  startIso: string,
  endIso: string
) => Promise<ForecastSeries>;

export type GetNextDays = (
  coords: Coords,
  days?: number
) => Promise<ForecastSeries>;

// Geocoding typing: helpers from providers/NominatimProfider
export type GeocodeResult = Coords | null;

export type GeocodeCity = (city: string) => Promise<GeocodeResult>;

export type SearchCities = (query: string) => Promise<string[]>;
