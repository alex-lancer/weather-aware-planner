import { Role } from "./role";
import { DailyWeather, Coords } from "./weather";
import { Task } from "./task";

export type LoaderData = {
  role: Role;
  city: string;
  coords: Coords;
  days: DailyWeather[];
  tasks: Task[];
  degraded: boolean;
  week: number; // relative week offset from current week (0=current)
  weekStart: string; // ISO date (Monday)
  weekEnd: string; // ISO date (Sunday)
  cityDays?: Record<string, DailyWeather[]>;
};
