"use client";

import { Landmark, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAppData } from "@/lib/app-data-context";
import {
  getNetWorth,
  getTotalAssets,
  getTotalLiabilities,
  isLiability,
} from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPE_LABELS } from "@/lib/types";

export default function NetWorthPage() {
  const { data } = useAppData();
  const assets = data.accounts.filter((a) => !isLiability(a.type));
  const liabilities = data.accounts.filter((a) => isLiability(a.type));
  const assetsTotal = getTotalAssets(data.accounts);
  const liabilitiesTotal = getTotalLiabilities(data.accounts);

  return (
    <div className="flex-1 p-8">
      <PageHeader
        title="Net Worth"
        description="See how your assets and liabilities trend over time."
      />

      {data.accounts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={TrendingUp}
            title="No accounts yet"
            description="Add accounts to see your net worth breakdown."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Total Assets</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-600">
                {formatCurrency(assetsTotal)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Total Liabilities</p>
              <p className="mt-2 text-2xl font-semibold text-red-600">
                {formatCurrency(liabilitiesTotal)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-500">Net Worth</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(getNetWorth(data.accounts))}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-500">
                <Landmark className="h-4 w-4" />
                <span className="text-sm font-medium">Assets</span>
              </div>
              {assets.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">No asset accounts yet.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {assets
                    .slice()
                    .sort((a, b) => b.balance - a.balance)
                    .map((account) => (
                      <div key={account.id}>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700">
                            {account.name}{" "}
                            <span className="text-slate-400">
                              ({ACCOUNT_TYPE_LABELS[account.type]})
                            </span>
                          </span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar
                            value={account.balance}
                            max={assetsTotal}
                            colorClassName="bg-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-slate-500">
                <Landmark className="h-4 w-4" />
                <span className="text-sm font-medium">Liabilities</span>
              </div>
              {liabilities.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  No liability accounts yet.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {liabilities
                    .slice()
                    .sort((a, b) => b.balance - a.balance)
                    .map((account) => (
                      <div key={account.id}>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-700">
                            {account.name}{" "}
                            <span className="text-slate-400">
                              ({ACCOUNT_TYPE_LABELS[account.type]})
                            </span>
                          </span>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar
                            value={account.balance}
                            max={liabilitiesTotal}
                            colorClassName="bg-red-500"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
