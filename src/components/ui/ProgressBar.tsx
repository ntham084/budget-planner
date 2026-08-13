import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max: number;
  colorClassName?: string;
};

export default function ProgressBar({
  value,
  max,
  colorClassName = "bg-indigo-600",
}: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const isOver = max > 0 && value > max;

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn("h-full rounded-full", isOver ? "bg-red-500" : colorClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
