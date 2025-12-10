import DayName from "./DayName";
import RiskBadge from "./RiskBadge";
import WeatherIndicator from "./WeatherIndicator";
import TaskListItem from "./TaskListItem";
import type { DailyWeather, Task } from "../types";

type TaskCardProps = {
  day: DailyWeather;
  tasks: Task[];
  week: number;
  isSubmitting: boolean;
  city: string; // used only for key context in parent; can be useful for future features
};

export default function TaskCard({ day, tasks, week, isSubmitting }: TaskCardProps) {
  return (
    <div className="rounded-2xl border p-3 dark:border-neutral-700">
      <div className="flex items-center justify-between gap-2 mb-2">
        <DayName iso={day.date} />
        <RiskBadge risk={day.risk} />
      </div>
      <WeatherIndicator day={day} />
      {tasks.length === 0 ? (
        <p className="text-sm text-gray-500">No tasks</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <TaskListItem key={t.id} task={t} week={week} isSubmitting={isSubmitting} />
          ))}
        </ul>
      )}
    </div>
  );
}
