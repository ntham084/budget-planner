import type { Bill } from "@/lib/types";
import { amountForPercent } from "@/lib/finance/paycheck";

/** Total dollar amount reserved for unpaid bills, based on the current paycheck. */
export function getUnpaidBillsTotal(bills: Bill[], paycheckAmount: number) {
  return bills
    .filter((b) => !b.isPaid)
    .reduce((sum, b) => sum + amountForPercent(b.percent, paycheckAmount), 0);
}

/** Unpaid bills, soonest due first. Pass `limit` to cap how many are returned. */
export function getUpcomingBills(bills: Bill[], limit?: number) {
  const upcoming = bills
    .filter((b) => !b.isPaid)
    .slice()
    .sort((a, b) => a.dueDay - b.dueDay);
  return limit != null ? upcoming.slice(0, limit) : upcoming;
}
