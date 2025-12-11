import type { Role } from './index';

export type User = {
  id: string;
  name: string;
  username: string;
  password: string; // plaintext for demo only
  role: Role;
};

export type AuthState = {
  currentUser: User | null;
  users: User[];
};

export const AUTH_STORAGE_KEY = 'waw.auth.v1';
