import { store } from "../../store";
import { updateTask } from "../../store/tasksSlice";
import type { Task } from "../../types";
import type { TaskRepository } from "../TaskRepository";

export class ReduxTaskRepository implements TaskRepository {
  getAll(): Task[] {
    return store.getState().tasks.items as Task[];
  }

  update(task: Task): void {
    store.dispatch(updateTask(task));
  }
}
