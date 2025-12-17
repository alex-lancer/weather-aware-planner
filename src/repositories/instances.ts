import { ReduxTaskRepository } from "./adapters/ReduxTaskRepository";
import { ReduxAuthRepository } from "./adapters/ReduxAuthRepository";

// Singleton repository instances to be reused across the app
export const taskRepository = new ReduxTaskRepository();
export const authRepository = new ReduxAuthRepository();
