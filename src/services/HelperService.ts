import { LoaderData, Task, DailyWeather, DEFAULT_CITY, DEFAULT_COORDS, Role } from "../types";
import tasks from "../data/tasks.json";

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

export async function geocodeCity(city: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", city);
    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "en", "User-Agent": "waw-app/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

/**
 * Search city suggestions using OpenStreetMap Nominatim.
 * Returns up to 5 display names. Lightweight: we only need the string; geocoding happens separately.
 */
export async function searchCities(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "0");
    url.searchParams.set("limit", "5");
    url.searchParams.set("q", query);
    const res = await fetch(url.toString(), {
      headers: { "Accept-Language": "en", "User-Agent": "waw-app/1.0" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ display_name?: string }>;
    const names = data.map((d) => d.display_name).filter((s): s is string => Boolean(s));
    // Deduplicate while preserving order
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const n of names) {
      if (!seen.has(n)) {
        seen.add(n);
        unique.push(n);
      }
    }
    return unique;
  } catch {
    return [];
  }
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

