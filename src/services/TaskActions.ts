import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from 'react-router-dom';
import type { Task, Role } from '../types';
import { store } from '../store';
import { addTask, updateTask } from '../store/tasksSlice';
import { computeRisk, geocodeCity } from './HelperService';
import { DEFAULT_COORDS } from '../types';

function parseTask(form: FormData, existingId?: string): Task {
  const id = (form.get('id') as string) || existingId || '';
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim() || undefined;
  const role = (form.get('role') as Role) || 'technician';
  const dateStr = String(form.get('date') || '').trim();
  const durationHours = Number(form.get('durationHours'));
  const city = String(form.get('city') || '').trim();
  const date = dateStr ? new Date(dateStr + 'T00:00:00') : null;
  if (!title || !city || !date || Number.isNaN(date.getTime()) || Number.isNaN(durationHours)) {
    throw new Error('Invalid form data');
  }
  return {
    id: id || 'tmp',
    title,
    description,
    role,
    date,
    durationHours,
    city,
  };
}

export async function newTaskAction({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const t = parseTask(fd);
  // create new id
  const created: Task = { ...t, id: crypto.randomUUID ? crypto.randomUUID() : 't' + Math.random().toString(36).slice(2, 9) };
  store.dispatch(addTask(created));
  return redirect('/');
}

export async function editTaskAction({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const id = String(fd.get('id') || '');
  if (!id) throw new Error('Missing id');
  const t = parseTask(fd, id);
  const updated: Task = { ...t, id };
  store.dispatch(updateTask(updated));
  return redirect('/');
}

export async function taskLoader({ params }: LoaderFunctionArgs) {
  const id = params.id as string;
  const state = store.getState();
  const task = state.tasks.items.find((x: Task) => x.id === id);
  if (!task) {
    throw new Response('Not found', { status: 404 });
  }
  return task;
}

/**
 * Reschedule a task to the next acceptable-risk day for the given city.
 * Preference order: low risk first, then medium. If none found, keep as-is.
 */
export async function rescheduleTaskAction({ request, params }: ActionFunctionArgs) {
  const id = params.id as string;
  if (!id) throw new Error('Missing id');

  const state = store.getState();
  const existing = state.tasks.items.find((x: Task) => x.id === id);
  if (!existing) throw new Response('Not found', { status: 404 });

  const fd = await request.formData();
  const role = (fd.get('role') as Role) || 'manager';
  const cityFromForm = String(fd.get('city') || '').trim();
  const city = cityFromForm || existing.city;
  const weekParam = String(fd.get('week') ?? '').trim();
  const weekNum = weekParam !== '' && !Number.isNaN(Number(weekParam)) ? Math.trunc(Number(weekParam)) : undefined;

  // Geocode city (fallback to default coords if fails)
  const coords = (await geocodeCity(city)) || DEFAULT_COORDS;

  // Fetch 7-day forecast (starting today)
  const api = new URL('https://api.open-meteo.com/v1/forecast');
  api.searchParams.set('latitude', String(coords.lat));
  api.searchParams.set('longitude', String(coords.lon));
  api.searchParams.set('daily', 'precipitation_probability_max,temperature_2m_min,wind_speed_10m_max');
  api.searchParams.set('timezone', 'auto');
  api.searchParams.set('forecast_days', '7');

  let dates: string[] = [];
  let precip: Array<number | null> = [];
  let wind: Array<number | null> = [];
  let temp: Array<number | null> = [];
  try {
    const res = await fetch(api.toString());
    if (res.ok) {
      const data = (await res.json()) as any;
      dates = data.daily?.time ?? [];
      precip = data.daily?.precipitation_probability_max ?? [];
      wind = data.daily?.wind_speed_10m_max ?? data.daily?.windspeed_10m_max ?? [];
      temp = data.daily?.temperature_2m_min ?? [];
    }
  } catch {}

  // Decide next acceptable day (skip today: start from index 1)
  let chosenIdx = -1;
  const risks = dates.map((dt: string, i: number) =>
    computeRisk({
      precip: precip[i] ?? null,
      wind: wind[i] ?? null,
      temp: temp[i] ?? null,
    })
  );
  // Look for next 'low'
  for (let i = 1; i < risks.length; i++) {
    if (risks[i] === 'low') { chosenIdx = i; break; }
  }
  // If none, look for next 'medium'
  if (chosenIdx === -1) {
    for (let i = 1; i < risks.length; i++) {
      if (risks[i] === 'medium') { chosenIdx = i; break; }
    }
  }

  if (chosenIdx !== -1) {
    const newDate = new Date(dates[chosenIdx] + 'T00:00:00');
    const updated: Task = { ...existing, date: newDate };
    store.dispatch(updateTask(updated));
  }

  const paramsOut = new URLSearchParams();
  if (city) paramsOut.set('city', city);
  if (role) paramsOut.set('role', role);
  if (weekNum !== undefined) paramsOut.set('week', String(weekNum));
  return redirect('/?' + paramsOut.toString());
}
