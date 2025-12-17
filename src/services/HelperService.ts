import { LoaderData, Task, DailyWeather, DEFAULT_CITY, DEFAULT_COORDS, Role } from "types";
import tasks from "data/tasks.json";

export function withTimeout<T>(p: Promise<T>, ms: number, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      if (controller) controller.abort();
      reject(new Error("timeout"));
    }, ms);
    const controller = signal ? undefined : new AbortController();
    const s = signal ?? controller?.signal;
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

export function computeRisk(d: { precip: number | null; wind: number | null; temp: number | null }):
  | "low"
  | "medium"
  | "high" {
  const rainRisk = d.precip != null && d.precip >= 40; // %
  const windRisk = d.wind != null && d.wind >= 10; // m/s ~ 22 mph
  const coldRisk = d.temp != null && d.temp <= 0; // C
  const score = [rainRisk, windRisk, coldRisk].filter(Boolean).length;
  return score >= 2 ? "high" : score === 1 ? "medium" : "low";
}

