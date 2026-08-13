"use client";

import { Wallet, ShieldCheck, CircleDollarSign, CalendarClock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import NetWorthHeroCard from "@/components/NetWorthHeroCard";
import { useAppData } from "@/lib/app-data-context";
import {
  getNetWorth,
  getTotalAssets,
  getTotalCash,
  getTotalLiabilities,
  getUnpaidBillsTotal,
} from "@/lib/finance";
import { formatCurrency, formatDate } from "@/lib/format";

export default function DashboardPage() {
  const { data } = useAppData();

  const cash = getTotalCash(data.accounts);
  const reserved = getUnpaidBillsTotal(data.bills, data.paycheck.amount);
  const availableToSpend = cash - reserved;

  return (
    <div className="flex-1 p-8">
      <PageHeader
        title="Dashboard"
        description="A quick snapshot of where your money stands."
      />

      <div className="mt-6">
        <NetWorthHeroCard
          netWorth={getNetWorth(data.accounts)}
          totalAssets={getTotalAssets(data.accounts)}
          totalLiabilities={getTotalLiabilities(data.accounts)}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total Cash"
          value={formatCurrency(cash)}
          subtext="Across checking and savings"
          icon={Wallet}
          accent="indigo"
        />
        <SummaryCard
          label="Bills to Pay"
          value={formatCurrency(reserved)}
          subtext="Unpaid bills this cycle"
          icon={ShieldCheck}
          accent="amber"
        />
        <SummaryCard
          label="Available to Spend"
          value={formatCurrency(availableToSpend)}
          subtext="Cash after reserved bills"
          icon={CircleDollarSign}
          accent="emerald"
        />
        <SummaryCard
          label="Next Paycheck"
          value={formatCurrency(data.paycheck.amount)}
          subtext={`Arriving ${formatDate(data.paycheck.nextDate)}`}
          icon={CalendarClock}
          accent="sky"
        />
      </div>
    </div>
  );
}
