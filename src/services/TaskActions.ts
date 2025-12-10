import { ActionFunctionArgs, LoaderFunctionArgs, redirect } from 'react-router-dom';
import type { Task, Role } from '../types';
import { store } from '../store';
import { addTask, updateTask } from '../store/tasksSlice';

function parseTask(form: FormData, existingId?: string): Task {
  const id = (form.get('id') as string) || existingId || '';
  const title = String(form.get('title') || '').trim();
  const description = String(form.get('description') || '').trim() || undefined;
  const role = (form.get('role') as Role) || 'technician';
  const weekday = Number(form.get('weekday'));
  const durationHours = Number(form.get('durationHours'));
  const city = String(form.get('city') || '').trim();
  if (!title || !city || Number.isNaN(weekday) || Number.isNaN(durationHours)) {
    throw new Error('Invalid form data');
  }
  return {
    id: id || 'tmp',
    title,
    description,
    role,
    weekday,
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
