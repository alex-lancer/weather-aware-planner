import { ReduxTaskRepository } from "./adapters/ReduxTaskRepository";
import { ReduxAuthRepository } from "./adapters/ReduxAuthRepository";
import type { TaskRepository } from "./TaskRepository";
import type { AuthRepository } from "./AuthRepository";

// Singleton repository instances to be reused across the app
export const taskRepository: TaskRepository = new ReduxTaskRepository();
export const authRepository: AuthRepository = new ReduxAuthRepository();
