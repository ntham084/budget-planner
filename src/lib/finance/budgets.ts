import type { PaycheckCategory, Transaction } from "@/lib/types";
import { amountForPercent } from "@/lib/finance/paycheck";
import { currentMonthKey, getCategorySpending } from "@/lib/finance/transactions";

export type BudgetCategorySummary = {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
};

export type BudgetSummary = {
  rows: BudgetCategorySummary[];
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
};

/** Budgeted vs. spent for every "spending_budget" paycheck category, for a given month. */
export function getBudgetSummary(
  paycheckCategories: PaycheckCategory[],
  paycheckAmount: number,
  transactions: Transaction[],
  monthKey: string = currentMonthKey(),
): BudgetSummary {
  const rows = paycheckCategories
    .filter((c) => c.categoryType === "spending_budget")
    .map((category) => {
      const budgeted = amountForPercent(category.percent, paycheckAmount);
      const spent = getCategorySpending(transactions, category.name, monthKey);
      return {
        id: category.id,
        name: category.name,
        budgeted,
        spent,
        remaining: budgeted - spent,
      };
    });

  return {
    rows,
    totalBudgeted: rows.reduce((sum, r) => sum + r.budgeted, 0),
    totalSpent: rows.reduce((sum, r) => sum + r.spent, 0),
    totalRemaining: rows.reduce((sum, r) => sum + r.remaining, 0),
  };
}
