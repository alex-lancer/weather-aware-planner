import type { User } from "../types/auth";

export interface AuthRepository {
  getCurrentUser(): User | null;
}
