import { store } from "store";
import type { User } from "types/auth";
import type { AuthRepository } from "repositories/AuthRepository";
import { login, logout } from "store/authSlice";

export class ReduxAuthRepository implements AuthRepository {
  getCurrentUser(): User | null {
    return store.getState().auth.currentUser as User | null;
  }

  login(args: { username: string; password: string }): void {
    store.dispatch(login(args));
  }

  logout(): void {
    store.dispatch(logout());
  }
}
