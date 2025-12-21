export default function DayName({ iso }: { iso: string }) {
  const d = new Date(iso + "T00:00:00");
  return (
    <span className="text-sm font-medium">
      {d.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}
    </span>
  );
}
