export type AccountType =
  | "checking"
  | "savings"
  | "credit_card"
  | "loan"
  | "investment"
  | "other_asset"
  | "other_liability";

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit Card",
  loan: "Loan",
  investment: "Investment",
  other_asset: "Other Asset",
  other_liability: "Other Liability",
};

export const LIABILITY_TYPES: AccountType[] = [
  "credit_card",
  "loan",
  "other_liability",
];

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  /** Always stored as a positive number, regardless of asset/liability. */
  balance: number;
};

export type Transaction = {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  description: string;
  category: string;
  accountId: string;
  /** Positive = income/credit, negative = expense. */
  amount: number;
};

export type BillFrequency = "monthly" | "weekly" | "yearly";

export type Bill = {
  id: string;
  name: string;
  /** Percent of each paycheck (0-100) reserved for this bill. */
  percent: number;
  dueDay: number; // day of month, 1-31
  frequency: BillFrequency;
  isPaid: boolean;
  autopay: boolean;
};

export type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO date, optional (empty string when unset)
  /** Account where this goal's funded amount is held. */
  linkedAccountId: string;
};

export type PaycheckCategoryType = "regular" | "spending_budget" | "goal";

export const PAYCHECK_CATEGORY_TYPE_LABELS: Record<PaycheckCategoryType, string> = {
  regular: "Regular",
  spending_budget: "Spending Budget",
  goal: "Goal",
};

export type PaycheckCategory = {
  id: string;
  name: string;
  /** Percent of paycheck (0-100) allocated to this category. */
  percent: number;
  categoryType: PaycheckCategoryType;
  /** Required when categoryType is "goal"; the goal this category funds. */
  linkedGoalId?: string;
};

export type PaycheckConfig = {
  amount: number;
  nextDate: string; // ISO date
  categories: PaycheckCategory[];
};

export type AppData = {
  accounts: Account[];
  transactions: Transaction[];
  bills: Bill[];
  goals: Goal[];
  paycheck: PaycheckConfig;
};
