import { Link } from "react-router-dom";
import BaseButton from "../commonComponents/BaseButton";
import type { Task } from "../types";
import { useAppSelector } from "../store";

type TaskListItemProps = {
  task: Task;
  week: number;
  isSubmitting: boolean;
  className?: string;
};

export default function TaskListItem({ task, week, isSubmitting, className }: TaskListItemProps) {
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const canReschedule = currentUser && (currentUser.role === 'manager' || currentUser.role === 'dispatcher');
  return (
    <li className={("flex items-center justify-between gap-2 text-sm " + (className ?? "")).trim()}>
      <div className="min-w-0 flex-1">
        <Link to={`/dashboard/task/${task.id}`} className="truncate text-blue-700 hover:underline">
          {task.title}
        </Link>
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{task.durationHours}h</span>
      {canReschedule && (
        <form method="post" action={`/dashboard/task/${task.id}/reschedule`} className="ml-2">
          <input type="hidden" name="week" value={String(week)} />
          <BaseButton type="submit" size="sm" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? "…" : "R"}
          </BaseButton>
        </form>
      )}
    </li>
  );
}
