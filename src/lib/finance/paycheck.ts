import type { PaycheckCategoryType, PaycheckConfig } from "@/lib/types";

/** Dollar amount that a percent-of-paycheck represents for the given paycheck. */
export function amountForPercent(percent: number, paycheckAmount: number) {
  return (percent / 100) * paycheckAmount;
}

export type PaycheckAllocationLine = {
  categoryId: string;
  name: string;
  percent: number;
  amount: number;
  categoryType: PaycheckCategoryType;
  linkedGoalId?: string;
};

export type PaycheckAllocation = {
  paycheckAmount: number;
  lines: PaycheckAllocationLine[];
  totalPercent: number;
  allocatedAmount: number;
  unallocatedPercent: number;
  unallocatedAmount: number;
};

/** Breaks a paycheck down into its category amounts, plus allocation totals. */
export function calculatePaycheckAllocation(
  paycheck: PaycheckConfig,
): PaycheckAllocation {
  const lines = paycheck.categories.map((category) => ({
    categoryId: category.id,
    name: category.name,
    percent: category.percent,
    amount: amountForPercent(category.percent, paycheck.amount),
    categoryType: category.categoryType,
    linkedGoalId: category.linkedGoalId,
  }));

  const totalPercent = lines.reduce((sum, l) => sum + l.percent, 0);
  const allocatedAmount = lines.reduce((sum, l) => sum + l.amount, 0);

  return {
    paycheckAmount: paycheck.amount,
    lines,
    totalPercent,
    allocatedAmount,
    unallocatedPercent: 100 - totalPercent,
    unallocatedAmount: paycheck.amount - allocatedAmount,
  };
}

/** Dollar contribution each linked goal receives from this paycheck, summed across categories. */
export function getGoalContributionsFromPaycheck(
  paycheck: PaycheckConfig,
): Map<string, number> {
  const contributions = new Map<string, number>();
  for (const line of calculatePaycheckAllocation(paycheck).lines) {
    if (line.categoryType !== "goal" || !line.linkedGoalId) continue;
    contributions.set(
      line.linkedGoalId,
      (contributions.get(line.linkedGoalId) ?? 0) + line.amount,
    );
  }
  return contributions;
}
