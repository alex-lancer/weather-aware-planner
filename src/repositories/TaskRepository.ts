import type { Task } from "../types";

export interface TaskRepository {
  getAll(): Task[];
  add(task: Task): void;
  update(task: Task): void;
}
