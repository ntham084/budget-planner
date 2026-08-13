import { Account, Bill, LIABILITY_TYPES, Transaction } from "@/lib/types";

export function isLiability(type: Account["type"]) {
  return LIABILITY_TYPES.includes(type);
}

export function totalAssets(accounts: Account[]) {
  return accounts
    .filter((a) => !isLiability(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
}

export function totalLiabilities(accounts: Account[]) {
  return accounts
    .filter((a) => isLiability(a.type))
    .reduce((sum, a) => sum + a.balance, 0);
}

export function netWorth(accounts: Account[]) {
  return totalAssets(accounts) - totalLiabilities(accounts);
}

export function totalCash(accounts: Account[]) {
  return accounts
    .filter((a) => a.type === "checking" || a.type === "savings")
    .reduce((sum, a) => sum + a.balance, 0);
}

/** Dollar amount that a percent-of-paycheck represents for the given paycheck. */
export function amountForPercent(percent: number, paycheckAmount: number) {
  return (percent / 100) * paycheckAmount;
}

export function reservedForBills(bills: Bill[], paycheckAmount: number) {
  return bills
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + amountForPercent(b.percent, paycheckAmount), 0);
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function spentInCategory(
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
