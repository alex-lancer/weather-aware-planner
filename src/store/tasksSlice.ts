import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import seed from '../data/tasks.json';
import type { Task } from '../types';

export interface TasksState {
  items: Task[];
}

export const STORAGE_KEY = 'waw.tasks.v1';

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
    if (!date || Number.isNaN(date.getTime())) {
      date = new Date();
    }
    const t: Task = {
      id: String(it.id || ''),
      title: String(it.title || ''),
      description: it.description ? String(it.description) : undefined,
      role: it.role,
      city: String(it.city || ''),
      durationHours: Number(it.durationHours || 1),
      date,
    };
    return t;
  });
}

function loadInitial(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return reviveAndMigrate(JSON.parse(raw));
  } catch {}
  return reviveAndMigrate(seed as any[]);
}

const initialState: TasksState = {
  items: loadInitial(),
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask(state: TasksState, action: PayloadAction<Task>) {
      state.items.push(action.payload);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)); } catch {}
    },
    updateTask(state: TasksState, action: PayloadAction<Task>) {
      const idx = state.items.findIndex((t: Task) => t.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items)); } catch {}
      }
    },
  },
});

export const { addTask, updateTask } = tasksSlice.actions;
export default tasksSlice.reducer;
