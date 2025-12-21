import seed from 'data/tasks.json';
import type { Task } from 'types';
import { STORAGE_KEY } from 'store/tasksSlice';

//This module is a simple in-memory store for tasks.
//It's used for demo purposes only.
//In a real app, you would use a database or a REST API.
//This module is not meant to be used in production.
function reviveAndMigrate(items: any[]): Task[] {
  const today = new Date();
  function nextDateForWeekday(weekday: number): Date {
    const d = new Date(today);
    const diff = (weekday - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return (items || []).map((it: any) => {
    let date: Date | null = null;
    if (it.date) {
      date = new Date(typeof it.date === 'string' ? it.date : it.date);
    } else if (typeof it.weekday === 'number') {
      date = nextDateForWeekday(it.weekday);
    }
    if (!date || Number.isNaN(date.getTime())) date = new Date();
    const t: Task = {
      id: String(it.id || ''),
      title: String(it.title || ''),
      description: it.description ? String(it.description) : undefined,
      role: it.role,
      city: String(it.city || ''),
      durationHours: Number(it.durationHours || 1),
      date: date.toISOString(),
      status: (it.status === 'InProgress' || it.status === 'Done') ? it.status : 'ToDo',
      notes: it.notes ? String(it.notes) : undefined,
    };
    return t;
  });
}

function readAll(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return reviveAndMigrate(JSON.parse(raw));
  } catch {}
  return reviveAndMigrate(seed as any[]);
}

function writeAll(tasks: Task[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

function genId(): string {
  return 't' + Math.random().toString(36).slice(2, 9);
}

export const TasksRepo = {
  list(): Task[] {
    return readAll();
  },
  get(id: string): Task | undefined {
    return readAll().find((t) => t.id === id);
  },
  create(task: Omit<Task, 'id'>): Task {
    const all = readAll();
    const created: Task = { ...task, id: genId() };
    all.push(created);
    writeAll(all);
    return created;
  },
  update(task: Task): Task {
    const all = readAll();
    const idx = all.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      all[idx] = task;
      writeAll(all);
      return task;
    }
    // if not found, create it
    all.push(task);
    writeAll(all);
    return task;
  },
};
