import type { Task } from "../types";

export interface TaskRepository {
  getAll(): Task[];
  update(task: Task): void;
}
