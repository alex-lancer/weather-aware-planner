import type { User } from "types/auth";

export interface AuthRepository {
  getCurrentUser(): User | null;
  login(args: { username: string; password: string }): void;
  logout(): void;
}
