import { store } from "../../store";
import type { User } from "../../types/auth";
import type { AuthRepository } from "../AuthRepository";

export class ReduxAuthRepository implements AuthRepository {
  getCurrentUser(): User | null {
    return store.getState().auth.currentUser as User | null;
  }
}
