import type { AppData } from "@/lib/types";

/**
 * Starting state for a brand-new user, for the domains not yet migrated to
 * Supabase (everything except accounts — see app-data-context.tsx). This is
 * deliberately empty, not demo data: a new user should see "No X yet." on
 * every page, not pre-populated fake bills/goals/transactions.
 */
export const emptyLocalData: Omit<AppData, "accounts"> = {
  transactions: [],
  bills: [],
  goals: [],
  paycheck: {
    amount: 0,
    nextDate: "",
    categories: [],
  },
};
