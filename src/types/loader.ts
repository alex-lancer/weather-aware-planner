import { DailyWeather } from "./weather";
import { Task } from "./task";

export type LoaderData = {
  days: string[];
  tasks: Task[];
  week: number; // relative week offset from current week (0=current)
  weekStart: string; // ISO date (Monday)
  weekEnd: string; // ISO date (Sunday)
  cityDays?: Record<string, DailyWeather[]>;
};
