import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SummaryCardProps = {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  accent?: "indigo" | "emerald" | "amber" | "sky" | "violet";
};

const accentStyles: Record<NonNullable<SummaryCardProps["accent"]>, string> =
  {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
    violet: "bg-violet-50 text-violet-600",
  };

export default function SummaryCard({
  label,
  value,
  subtext,
  icon: Icon,
  accent = "indigo",
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {value}
          </p>
          {subtext && (
            <p className="mt-1 text-xs text-slate-400">{subtext}</p>
          )}
        </div>
        <div className={cn("rounded-lg p-2.5", accentStyles[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
