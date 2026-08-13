import type { AppData, Transaction } from "@/lib/types";

/**
 * One representative transaction per spending category per month, for a full
 * year of mock history. Amounts vary month to month so the Transactions page's
 * yearly chart has something to compare. Category names match the active
 * spending categories tracked from the Paycheck page (see seedData.paycheck
 * below) so Budget's spent-vs-budgeted math lines up with real transactions.
 */
type CategoryKey =
  | "housing"
  | "groceries"
  | "gas"
  | "restaurants"
  | "shopping"
  | "subscriptions"
  | "healthFitness"
  | "other";

const CATEGORY_TRANSACTION_INFO: Record<
  CategoryKey,
  { category: string; description: string; day: number; accountId: string }
> = {
  housing: { category: "Housing", description: "Rent", day: 1, accountId: "acc-checking" },
  gas: { category: "Gas", description: "Gas Station", day: 5, accountId: "acc-checking" },
  subscriptions: { category: "Subscriptions", description: "Streaming & Subscriptions", day: 8, accountId: "acc-checking" },
  groceries: { category: "Groceries", description: "Grocery Store", day: 10, accountId: "acc-checking" },
  restaurants: { category: "Restaurants", description: "Restaurant", day: 14, accountId: "acc-credit" },
  shopping: { category: "Shopping", description: "Online Shopping", day: 18, accountId: "acc-credit" },
  healthFitness: { category: "Health & Fitness", description: "Gym Membership", day: 22, accountId: "acc-checking" },
  other: { category: "Other", description: "Miscellaneous", day: 25, accountId: "acc-credit" },
};

const ZERO_SPEND: Record<CategoryKey, number> = {
  housing: 0,
  groceries: 0,
  gas: 0,
  restaurants: 0,
  shopping: 0,
  subscriptions: 0,
  healthFitness: 0,
  other: 0,
};

// Mock monthly spend per category, Jan-Dec 2026. Every month defaults to $0
// for now except August — fill in the rest as real history becomes available.
const MONTHLY_SPEND: { month: number; key: string; spend: Record<CategoryKey, number> }[] = [
  { month: 1, key: "jan", spend: ZERO_SPEND },
  { month: 2, key: "feb", spend: ZERO_SPEND },
  { month: 3, key: "mar", spend: ZERO_SPEND },
  { month: 4, key: "apr", spend: ZERO_SPEND },
  { month: 5, key: "may", spend: ZERO_SPEND },
  { month: 6, key: "jun", spend: ZERO_SPEND },
  { month: 7, key: "jul", spend: ZERO_SPEND },
  { month: 8, key: "aug", spend: { housing: 1450, groceries: 84, gas: 42, restaurants: 60, shopping: 95, subscriptions: 42, healthFitness: 40, other: 45 } },
  { month: 9, key: "sep", spend: ZERO_SPEND },
  { month: 10, key: "oct", spend: ZERO_SPEND },
  { month: 11, key: "nov", spend: ZERO_SPEND },
  { month: 12, key: "dec", spend: ZERO_SPEND },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Skip zero-amount categories so months with no data don't get $0.00 rows.
const yearTransactions: Transaction[] = MONTHLY_SPEND.flatMap(({ month, key, spend }) =>
  (Object.keys(spend) as CategoryKey[])
    .filter((catKey) => spend[catKey] > 0)
    .map((catKey) => {
      const info = CATEGORY_TRANSACTION_INFO[catKey];
      return {
        id: `txn-2026-${key}-${catKey}`,
        date: `2026-${pad2(month)}-${pad2(info.day)}`,
        description: info.description,
        category: info.category,
        accountId: info.accountId,
        amount: -spend[catKey],
      };
    }),
);

/**
 * Initial data the app starts with. Once the user makes changes, the
 * localStorage-persisted copy takes over (see app-data-context.tsx).
 */
export const seedData: AppData = {
  accounts: [
    { id: "acc-checking", name: "Everyday Checking", type: "checking", balance: 3420.53 },
    { id: "acc-savings", name: "Emergency Fund", type: "savings", balance: 5000.0 },
    { id: "acc-credit", name: "Visa Rewards", type: "credit_card", balance: 850.0 },
    { id: "acc-loan", name: "Car Loan", type: "loan", balance: 12400.0 },
    { id: "acc-invest", name: "Brokerage", type: "investment", balance: 18500.0 },
  ],

  transactions: yearTransactions,

  bills: [
    { id: "bill-rent", name: "Rent", percent: 59.2, dueDay: 1, frequency: "monthly", isPaid: true, autopay: false },
    { id: "bill-electric", name: "Electric Bill", percent: 3.9, dueDay: 15, frequency: "monthly", isPaid: false, autopay: false },
    { id: "bill-internet", name: "Internet", percent: 2.7, dueDay: 18, frequency: "monthly", isPaid: false, autopay: true },
    { id: "bill-car", name: "Car Loan Payment", percent: 13.1, dueDay: 20, frequency: "monthly", isPaid: false, autopay: true },
    { id: "bill-phone", name: "Phone Bill", percent: 2.2, dueDay: 22, frequency: "monthly", isPaid: false, autopay: true },
  ],

  goals: [
    { id: "goal-emergency", name: "Emergency Fund Top-Up", targetAmount: 10000, currentAmount: 5000, targetDate: "2026-12-31" },
    { id: "goal-car", name: "New Car Fund", targetAmount: 8000, currentAmount: 2100, targetDate: "2027-06-01" },
    { id: "goal-vacation", name: "Vacation", targetAmount: 3000, currentAmount: 1200, targetDate: "2026-11-01" },
  ],

  paycheck: {
    amount: 3000.0,
    nextDate: "2026-08-15",
    categories: [
      { id: "pc-bills", name: "Bills", percent: 45, isSpendingBudget: false },
      { id: "pc-savings", name: "Savings", percent: 15, isSpendingBudget: false },
      { id: "pc-investments", name: "Investments", percent: 10, isSpendingBudget: false },
      { id: "pc-groceries", name: "Groceries", percent: 10, isSpendingBudget: true },
      { id: "pc-restaurants", name: "Restaurants", percent: 5, isSpendingBudget: true },
      { id: "pc-gas", name: "Gas", percent: 5, isSpendingBudget: true },
      { id: "pc-shopping", name: "Shopping", percent: 5, isSpendingBudget: true },
    ],
  },
};
