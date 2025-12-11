import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuthState, User } from '../types/auth';

export const AUTH_STORAGE_KEY = 'waw.auth.v1';

function seedUsers(): User[] {
  const roles: Array<User['role']> = ['manager', 'dispatcher', 'technician'];
  const users: User[] = [];
  for (const role of roles) {
    for (let i = 1; i <= 3; i++) {
      users.push({
        id: `${role[0]}${i}`,
        name: `${role.charAt(0).toUpperCase() + role.slice(1)} ${i}`,
        username: `${role}${i}`,
        password: 'pass123', // demo password for all
        role,
      });
    }
  }
  return users;
}

function loadInitial(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {}
  return { currentUser: null, users: seedUsers() };
}

const initialState: AuthState = loadInitial();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state: AuthState, action: PayloadAction<{ username: string; password: string }>) {
      const { username, password } = action.payload;
      const user = state.users.find(u => u.username === username && u.password === password) || null;
      state.currentUser = user;
      try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state)); } catch {}
    },
    logout(state: AuthState) {
      state.currentUser = null;
      try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state)); } catch {}
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
