import { LoaderData, Task, DailyWeather, DEFAULT_CITY, DEFAULT_COORDS, Role } from "types";
import { computeRisk } from "utilities/Risk";
import { geocodeCity } from "providers/NominatimProfider";
import { getDailyRange } from "providers/ForecastProvider";
import { withRetryFn } from "utilities/Retry";
import { cacheWithLocalStorage } from "utilities/LocalCache";
import { taskRepository } from "repositories/instances";
import { defer } from "RouterShim";

export async function plannerLoader({ request }: { request: Request }): Promise<LoaderData> {
  const url = new URL(request.url);
  const role = (url.searchParams.get("role") as Role) || "manager";
  const city = url.searchParams.get("city") || DEFAULT_CITY;
  const weekParam = Number(url.searchParams.get("week") ?? "0");

  const { weekStartIso, weekEndIso, week } = calcBaseDays(weekParam);
  let { coords, degraded } = await tryGeocodeCity(city);

  const days = await fetchDaysForCoords(coords, weekStartIso, weekEndIso);

  const allTasks: Task[] = taskRepository.getAll();
  const citiesInWeek = fetchCitiesInWeek(allTasks, weekStartIso);

  // Defer fetching of other cities' weather
  const cityDaysPromise: Promise<Record<string, DailyWeather[]>> = (async () => {
    const entries = await Promise.all(
      citiesInWeek.map(async (c) => [c, await fetchDaysForCity(c, weekStartIso, weekEndIso)] as const)
    );
    return Object.fromEntries(entries);
  })();

  return defer({
    role,
    city,
    coords,
    days,
    tasks: allTasks,
    degraded,
    week,
    weekStart: weekStartIso,
    weekEnd: weekEndIso,
    cityDays: cityDaysPromise,
  });
}


function fetchCitiesInWeek(tasks: Task[], weekStartIso: string) {
  const isoInWeek = new Set<string>();
  const start = new Date(weekStartIso + "T00:00:00");

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    isoInWeek.add(d.toISOString().slice(0, 10));
  }

  return Array.from(new Set(
    tasks
      .filter((t) => isoInWeek.has(new Date(t.date).toISOString().slice(0, 10)))
      .map((t) => t.city)
  ));
}

const getDailyRangeCached = cacheWithLocalStorage(withRetryFn(getDailyRange));

async function fetchDaysForCoords(
  coords: { lat: number; lon: number },
  weekStartIso: string,
  weekEndIso: string
): Promise<DailyWeather[]> {
  try {
    const { dates, precip, wind, temp } = await getDailyRangeCached(coords, weekStartIso, weekEndIso);

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

async function fetchDaysForCity(
  cityName: string,
  weekStartIso: string,
  weekEndIso: string
): Promise<DailyWeather[]> {
  let coords = DEFAULT_COORDS;
  try {
    const gc = await geocodeCity(cityName);
    if (gc) coords = gc;
  } catch {
    // ignore, will use DEFAULT_COORDS
  }
  return fetchDaysForCoords(coords, weekStartIso, weekEndIso);
}

function calcBaseDays(weekParam: number) {
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

  return { weekStartIso, weekEndIso, week };
}


async function tryGeocodeCity(city: string): Promise<{ coords: { lat: number; lon: number }; degraded: boolean }> {
  let coords = DEFAULT_COORDS;
  let degraded = false;

  const geocodePromise = geocodeCity(city);
  try {
    const c = await Promise.race([
      geocodePromise,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);

    if (c) {
      coords = c;
    } else if (city.toLowerCase() !== DEFAULT_CITY.toLowerCase()) {
      degraded = true;
    }
  } catch {
    if (city.toLowerCase() !== DEFAULT_CITY.toLowerCase()) {
      degraded = true;
    }
  }
  return { coords, degraded };
}
