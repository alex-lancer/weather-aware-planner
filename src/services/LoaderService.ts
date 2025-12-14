import { LoaderData, Task, DailyWeather, DEFAULT_CITY, DEFAULT_COORDS, Role } from "../types";
import { computeRisk } from "./HelperService";
import { geocodeCity } from "../providers/NominatimProfider";
import { getDailyRange } from "../providers/ForecastProvider";
import { store } from "../store";

export async function loader({ request }: { request: Request }): Promise<LoaderData> {
  const url = new URL(request.url);
  const role = (url.searchParams.get("role") as Role) || "manager";
  const city = url.searchParams.get("city") || DEFAULT_CITY;
  const weekParam = Number(url.searchParams.get("week") ?? "0");
  const week = Number.isFinite(weekParam) ? Math.trunc(weekParam) : 0;

  // Compute Monday (weekStart) and Sunday (weekEnd) for the requested week offset
  const today = new Date();
  const day = today.getDay(); // 0..6, 0 = Sun
  const mondayOffset = (day === 0 ? -6 : 1 - day); // days to go back to Monday of current week
  const baseMonday = new Date(today);
  baseMonday.setHours(0, 0, 0, 0);
  baseMonday.setDate(baseMonday.getDate() + mondayOffset + week * 7);
  const baseSunday = new Date(baseMonday);
  baseSunday.setDate(baseMonday.getDate() + 6);
  const weekStartIso = baseMonday.toISOString().slice(0, 10);
  const weekEndIso = baseSunday.toISOString().slice(0, 10);

  let coords = DEFAULT_COORDS;
  let degraded = false;
  // Try to geocode the city quickly; fall back gracefully
  const geocodePromise = geocodeCity(city);
  try {
    const c = await Promise.race([
      geocodePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    if (c) coords = c;
    else if (city.toLowerCase() !== DEFAULT_CITY.toLowerCase()) degraded = true;
  } catch {
    if (city.toLowerCase() !== DEFAULT_CITY.toLowerCase()) degraded = true;
  }

  let days: DailyWeather[] = [];
  try {
    const series = await getDailyRange(coords, weekStartIso, weekEndIso);
    const { dates, precip, wind, temp } = series;
    days = dates.map((dt, i) => {
      const d = {
        date: dt,
        precipProb: precip[i] ?? null,
        windMax: wind[i] ?? null,
        tempMin: temp[i] ?? null,
      };
      return { ...d, risk: computeRisk({ precip: d.precipProb, wind: d.windMax, temp: d.tempMin }) };
    });
  } catch {
    degraded = true;
    // Create placeholder 7 days for selected week with null metrics
    const start = new Date(weekStartIso + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const nd = new Date(start);
      nd.setDate(start.getDate() + i);
      days.push({
        date: nd.toISOString().slice(0, 10),
        precipProb: null,
        windMax: null,
        tempMin: null,
        risk: "low",
      });
    }
  }

  // Load all tasks regardless of city/role
  const all = store.getState().tasks.items as Task[];
  const visible: Task[] = all;

  // Determine cities that have tasks within the visible week
  const isoInWeek = new Set<string>();
  {
    const start = new Date(weekStartIso + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      isoInWeek.add(d.toISOString().slice(0, 10));
    }
  }
  const citiesInWeek = Array.from(new Set(
    visible
      .filter((t) => isoInWeek.has(new Date(t.date).toISOString().slice(0, 10)))
      .map((t) => t.city)
  ));

  // Helper to fetch days for a specific city
  async function fetchDaysForCity(cityName: string): Promise<DailyWeather[]> {
    let ccoords = DEFAULT_COORDS;
    try {
      const gc = await geocodeCity(cityName);
      if (gc) ccoords = gc;
    } catch {}
    try {
      const { dates, precip, wind, temp } = await getDailyRange(ccoords, weekStartIso, weekEndIso);
      return dates.map((dt: string, i: number) => {
        const d = {
          date: dt,
          precipProb: precip[i] ?? null,
          windMax: wind[i] ?? null,
          tempMin: temp[i] ?? null,
        };
        return { ...d, risk: computeRisk({ precip: d.precipProb, wind: d.windMax, temp: d.tempMin }) };
      });
    } catch {
      // Fallback placeholders
      const out: DailyWeather[] = [];
      const start = new Date(weekStartIso + "T00:00:00");
      for (let i = 0; i < 7; i++) {
        const nd = new Date(start);
        nd.setDate(start.getDate() + i);
        out.push({
          date: nd.toISOString().slice(0, 10),
          precipProb: null,
          windMax: null,
          tempMin: null,
          risk: "low",
        });
      }
      return out;
    }
  }

  // Build per-city weather map
  const entries = await Promise.all(
    citiesInWeek.map(async (c) => [c, await fetchDaysForCity(c)] as const)
  );
  const cityDays: Record<string, DailyWeather[]> = Object.fromEntries(entries);

  return { role, city, coords, days, tasks: visible, degraded, week, weekStart: weekStartIso, weekEnd: weekEndIso, cityDays };
}


