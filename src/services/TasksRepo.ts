import seed from '../data/tasks.json';
import type { Task } from '../types';
import { STORAGE_KEY } from '../store/tasksSlice';

function readAll(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch {}
  return seed as Task[];
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
