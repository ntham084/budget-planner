import { TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/format";

type NetWorthHeroCardProps = {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
};

export default function NetWorthHeroCard({
  netWorth,
  totalAssets,
  totalLiabilities,
}: NetWorthHeroCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 to-white p-8 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Net Worth</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-slate-900">
            {formatCurrency(netWorth)}
          </p>
          <p className="mt-2 text-sm text-slate-400">Assets minus liabilities</p>
        </div>
        <div className="rounded-xl bg-violet-100 p-3.5 text-violet-600">
          <TrendingUp className="h-7 w-7" />
        </div>
      </div>

      <div className="mt-6 flex gap-8 border-t border-slate-200/70 pt-4">
        <div>
          <p className="text-xs font-medium text-slate-400">Total Assets</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">
            {formatCurrency(totalAssets)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-400">Total Liabilities</p>
          <p className="mt-1 text-lg font-semibold text-red-600">
            {formatCurrency(totalLiabilities)}
          </p>
        </div>
      </div>
    </div>
  );
}
