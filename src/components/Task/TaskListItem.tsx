import { Link, Form } from "react-router-dom";
import BaseButton from "commonComponents/BaseButton";
import type { Task } from "types";
import { useAppSelector } from "store";

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
      <div className="min-w-0 flex-1 flex items-center gap-2">
        {/* Status badge */}
        <span
          className={[
            'inline-block px-2 py-0.5 rounded-full text-[10px] leading-4 border',
            task.status === 'Done' ? 'bg-green-50 text-green-700 border-green-200' :
            task.status === 'InProgress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            'bg-gray-50 text-gray-700 border-gray-200'
          ].join(' ')}
          title={`Status: ${task.status}`}
        >
          {task.status === 'ToDo' ? 'To Do' : task.status === 'InProgress' ? 'In Progress' : 'Done'}
        </span>
        <Link to={`/dashboard/task/${task.id}`} className="truncate text-blue-700 hover:underline">
          {task.title}
        </Link>
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">{task.durationHours}h</span>
      {canReschedule && (
        <Form method="post" action={`/dashboard/task/${task.id}/reschedule`} className="ml-2">
          <input type="hidden" name="week" value={String(week)} />
          <BaseButton type="submit" size="sm" variant="secondary" disabled={isSubmitting}>
            {isSubmitting ? "…" : "R"}
          </BaseButton>
        </Form>
      )}
    </li>
  );
}
