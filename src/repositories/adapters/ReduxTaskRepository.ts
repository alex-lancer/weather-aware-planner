import { store } from "store";
import { addTask, updateTask } from "store/tasksSlice";
import type { Task } from "types";
import type { TaskRepository } from "repositories/TaskRepository";

export class ReduxTaskRepository implements TaskRepository {
  getAll(): Task[] {
    return store.getState().tasks.items as Task[];
  }

  get(id: string): Task | undefined {
    return this.getAll().find((t) => t.id === id);
  }

  add(task: Task): void {
    store.dispatch(addTask(task));
  }

  update(task: Task): void {
    store.dispatch(updateTask(task));
  }
}
