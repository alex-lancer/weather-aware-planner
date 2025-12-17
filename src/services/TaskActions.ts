import type { ActionFunctionArgs, LoaderFunctionArgs } from 'react-router-dom';
import { redirect } from '../RouterShim';
import type { Task, Role, Status } from '../types';
import { computeRisk } from './HelperService';
import { geocodeCity } from '../providers/NominatimProfider';
import { getNextDays } from '../providers/ForecastProvider';
import { DEFAULT_COORDS } from '../types';
import { authRepository, taskRepository } from '../repositories/instances';

function parseTask(form: FormData, existingId?: string): Task {
  const id = (form.get('id') as string) || existingId || '';
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim() || undefined;
  const notes = String(form.get('notes') || '').trim() || undefined;
  const role = (form.get('role') as Role) || 'technician';
  const dateStr = String(form.get('date') || '').trim();
  const durationHours = Number(form.get('durationHours'));
  const city = String(form.get('city') || '').trim();
  const statusIn = String(form.get('status') || '').trim() as Status;
  const status: Status = (statusIn === 'ToDo' || statusIn === 'InProgress' || statusIn === 'Done') ? statusIn : 'ToDo';
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
    status,
    notes,
  };
}

export async function newTaskAction({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const t = parseTask(fd);
  // create new id
  const createdId = (globalThis as any).crypto?.randomUUID?.() ?? ('t' + Math.random().toString(36).slice(2, 9));
  const created: Task = { ...t, id: createdId };
  taskRepository.add(created);
  return redirect('/');
}

export async function editTaskAction({ request }: ActionFunctionArgs) {
  const fd = await request.formData();
  const id = String(fd.get('id') || '');

  if (!id) throw new Error('Missing id');

  const allTasks = taskRepository.getAll();
  const existing = allTasks.find((x: Task) => x.id === id);

  if (!existing) {
    throw new Response('Not found', { status: 404 });
  }

  const t = parseTask(fd, id);
  const currentUser = authRepository.getCurrentUser();
  let updated: Task;
  if (currentUser?.role === 'technician') {
    updated = { ...existing, status: t.status, notes: t.notes };
  } else {
    updated = { ...t, id };
  }

  taskRepository.update(updated);

  return redirect('/');
}

export async function taskLoader({ params }: LoaderFunctionArgs) {
  const id = params.id as string;
  const allTasks = taskRepository.getAll();
  const task = allTasks.find((x: Task) => x.id === id);
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
  const fd = await request.formData();

  if (!id) throw new Error('Missing id');

  const currentUser = authRepository.getCurrentUser();
  if (!currentUser) {
    return redirectToLogin(fd);
  }

  const allTasks = taskRepository.getAll();
  const existing = allTasks.find((x: Task) => x.id === id);
  if (!existing) throw new Response('Not found', { status: 404 });

  if (!canRescheduleTask(currentUser)) {
    return redirectToDashboard(fd);
  }

  const { role, city, weekNum } = fetchDataFromForm(fd, existing);
  const coords = (await geocodeCity(city)) || DEFAULT_COORDS;

  // Fetch 7-day forecast (starting today) via provider
  const { risks, dates } = await getNextDaysRisks(coords);
  const newDate = chooseBestDate(risks, dates);
  if (newDate) {
    const updated: Task = { ...existing, date: newDate };
    taskRepository.update(updated);
  }

  return returnToDashboard(city, role, weekNum);
}

async function redirectToLogin(fdTmp: FormData) {
  const roleTmp = (fdTmp.get('role') as Role) || 'manager';
  const cityTmp = String(fdTmp.get('city') || '').trim();
  const weekParamTmp = String(fdTmp.get('week') ?? '').trim();
  const paramsOutTmp = new URLSearchParams();
  if (cityTmp) paramsOutTmp.set('city', cityTmp);
  if (roleTmp) paramsOutTmp.set('role', roleTmp);
  if (weekParamTmp !== '') paramsOutTmp.set('week', weekParamTmp);
  const from = '/?' + paramsOutTmp.toString();
  return redirect('/login?from=' + encodeURIComponent(from));
}

function canRescheduleTask(currentUser: { role: string } | null | undefined) {
  return !!(currentUser && (currentUser.role === 'manager' || currentUser.role === 'dispatcher'));
}

function redirectToDashboard(formData: FormData) {
  const weekParamTmp = String(formData.get('week') ?? '').trim();
  const paramsOutTmp = new URLSearchParams();
  if (weekParamTmp !== '') paramsOutTmp.set('week', weekParamTmp);
  return redirect('/' + (paramsOutTmp.toString() ? ('?' + paramsOutTmp.toString()) : ''));
}

function fetchDataFromForm(formData: FormData, existing: Task) {
  const role = (formData.get('role') as Role) || 'manager';
  const cityFromForm = String(formData.get('city') || '').trim();
  const city = cityFromForm || existing.city;
  const weekParam = String(formData.get('week') ?? '').trim();
  const weekNum = weekParam !== '' && !Number.isNaN(Number(weekParam)) ? Math.trunc(Number(weekParam)) : undefined;

  return { role, city, weekNum };
}

async function getNextDaysRisks(coords: any) {
  let dates: string[] = [];
  let precip: Array<number | null> = [];
  let wind: Array<number | null> = [];
  let temp: Array<number | null> = [];
  try {
    const series = await getNextDays(coords, 7);
    dates = series.dates;
    precip = series.precip;
    wind = series.wind;
    temp = series.temp;
  } catch {}

  // Decide next acceptable day (skip today: start from index 1)
  const risks = dates.map((dt: string, i: number) =>
    computeRisk({
      precip: precip[i] ?? null,
      wind: wind[i] ?? null,
      temp: temp[i] ?? null,
    })
  );

  return {
    risks, dates
  }
}

function chooseBestDate(risks: string[], dates: string[]) {
  let chosenIdx = -1;
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
    return new Date(dates[chosenIdx] + 'T00:00:00');
  }
}

function returnToDashboard(city: string, role: string, weekNum?: number) {
  const paramsOut = new URLSearchParams();
  if (city) paramsOut.set('city', city);
  if (role) paramsOut.set('role', role);
  if (weekNum !== undefined) paramsOut.set('week', String(weekNum));
  return redirect('/?' + paramsOut.toString());
}
