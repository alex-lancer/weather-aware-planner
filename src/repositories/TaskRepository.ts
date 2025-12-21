import type { Task } from "types";

export interface TaskRepository {
  getAll(): Task[];
  get(id: string): Task | undefined;
  add(task: Task): void;
  update(task: Task): void;
}
