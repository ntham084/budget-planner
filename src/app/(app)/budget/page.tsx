"use client";

import { PiggyBank } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { useAppData } from "@/lib/app-data-context";
import { getBudgetSummary } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function BudgetPage() {
  const { data } = useAppData();
  const paycheckAmount = data.paycheck.amount;

  const { rows, totalBudgeted, totalSpent } = getBudgetSummary(
    data.paycheck.categories,
    paycheckAmount,
    data.transactions,
  );

  return (
    <div className="flex-1 p-8">
      <PageHeader
        title="Budget"
        description="Spending categories marked on the Paycheck page, budgeted from your paycheck amount."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">Budgeted</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(totalBudgeted)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">Spent this month</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">Remaining</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(totalBudgeted - totalSpent)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No spending budgets yet"
            description='Mark a category as "Track this as a spending budget" on the Paycheck page to see it here.'
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Budgeted</th>
                  <th className="px-4 py-3 text-right">Spent</th>
                  <th className="px-4 py-3 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatCurrency(row.budgeted)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {formatCurrency(row.spent)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-medium",
                        row.remaining < 0 ? "text-red-600" : "text-slate-900",
                      )}
                    >
                      {row.remaining < 0 ? "-" : ""}
                      {formatCurrency(Math.abs(row.remaining))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
