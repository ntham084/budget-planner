import type { AppData } from "@/lib/types";
import { getTotalCash } from "@/lib/finance/accounts";
import { getUnpaidBillsTotal } from "@/lib/finance/bills";

export type AffordabilityResult = {
  canAfford: boolean;
  purchaseAmount: number;
  availableToSpend: number;
  remainingUnpaidBills: number;
  projectedRemaining: number;
};

/**
 * Whether a purchase fits within cash on hand after unpaid bills are set
 * aside. Purely arithmetic over existing app data — no AI involved.
 */
export function checkAffordability(
  data: AppData,
  purchaseAmount: number,
): AffordabilityResult {
  const cash = getTotalCash(data.accounts);
  const remainingUnpaidBills = getUnpaidBillsTotal(data.bills, data.paycheck.amount);
  const availableToSpend = cash - remainingUnpaidBills;
  const projectedRemaining = availableToSpend - purchaseAmount;

  return {
    canAfford: projectedRemaining >= 0,
    purchaseAmount,
    availableToSpend,
    remainingUnpaidBills,
    projectedRemaining,
  };
}
