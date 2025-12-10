import { LoaderData, Task, DailyWeather, DEFAULT_CITY, DEFAULT_COORDS, Role } from "../types";
import { computeRisk, geocodeCity } from "./HelperService";
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
console.log("city", city);
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

  // Fetch Open-Meteo daily forecast for the selected Monday–Sunday range
  const api = new URL("https://api.open-meteo.com/v1/forecast");
  api.searchParams.set("latitude", String(coords.lat));
  api.searchParams.set("longitude", String(coords.lon));
  api.searchParams.set(
    "daily",
    "precipitation_probability_max,temperature_2m_min,wind_speed_10m_max"
  );
  api.searchParams.set("timezone", "auto");
  api.searchParams.set("start_date", weekStartIso);
  api.searchParams.set("end_date", weekEndIso);

  let days: DailyWeather[] = [];
  try {
    const res = await fetch(api.toString());
    if (!res.ok) throw new Error("weather failed");
    const data = (await res.json()) as any;
    const dates: string[] = data.daily?.time ?? [];
    const precip: Array<number | null> = data.daily?.precipitation_probability_max ?? [];
    const wind: Array<number | null> = data.daily?.wind_speed_10m_max ?? data.daily?.windspeed_10m_max ?? [];
    const temp: Array<number | null> = data.daily?.temperature_2m_min ?? [];
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

  // Filter tasks by role and city from Redux store
  const all = store.getState().tasks.items as Task[];
  const allTasks = all.filter((t) => t.city.toLowerCase() === city.toLowerCase());
  let visible: Task[];
  if (role === "manager") visible = allTasks;
  else if (role === "dispatcher") visible = allTasks.filter((t) => t.role === "dispatcher" || t.role === "technician");
  else visible = allTasks.filter((t) => t.role === "technician");

  return { role, city, coords, days, tasks: visible, degraded, week, weekStart: weekStartIso, weekEnd: weekEndIso };
}


