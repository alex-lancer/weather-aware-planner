import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import seed from '../data/tasks.json';
import type { Task } from '../types';

export interface TasksState {
  items: Task[];
}

export const STORAGE_KEY = 'waw.tasks.v1';

function loadInitial(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch {}
  return seed as Task[];
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
