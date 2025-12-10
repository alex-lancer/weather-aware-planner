export type Role = "manager" | "technician" | "dispatcher";

export type DailyWeather = {
  date: string; // ISO date
  precipProb: number | null; // %
  windMax: number | null; // m/s
  tempMin: number | null; // C
  risk: "low" | "medium" | "high";
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  weekday: number; // JS getDay() 0..6 (0=Sun)
  role: Role;
  city: string;
  durationHours: number;
};

export type LoaderData = {
  role: Role;
  city: string;
  coords: { lat: number; lon: number };
  days: DailyWeather[];
  tasks: Task[];
  degraded: boolean;
};

export const DEFAULT_CITY = "Seattle";
export const DEFAULT_COORDS = { lat: 47.6062, lon: -122.3321 };
