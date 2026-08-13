import { Transaction } from "@/lib/types";

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Total spent (positive number) in a category for a given month, defaulting to the current month. */
export function getCategorySpending(
  transactions: Transaction[],
  category: string,
  monthKey: string = currentMonthKey(),
) {
  return transactions
    .filter(
      (t) =>
        t.category === category &&
        t.date.startsWith(monthKey) &&
        t.amount < 0,
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}
