"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { generateId } from "@/lib/id";
import { emptyLocalData } from "@/lib/seed-data";
import { getGoalContributionsFromPaycheck } from "@/lib/finance";
import { createClient } from "@/lib/supabase/client";
import type {
  Account,
  AppData,
  Bill,
  Goal,
  PaycheckCategory,
  Transaction,
} from "@/lib/types";
import { useLocalStorageState } from "@/lib/use-local-storage-state";

const STORAGE_KEY = "budget-planner:local-data:v7";

const ACCOUNT_COLUMNS = "id,name,type,balance";

type AppDataContextValue = {
  data: AppData;
  accountsLoading: boolean;

  addAccount: (account: Omit<Account, "id">) => Promise<void>;
  updateAccount: (id: string, account: Omit<Account, "id">) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  addTransaction: (transaction: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;

  addBill: (bill: Omit<Bill, "id">) => void;
  updateBill: (id: string, bill: Omit<Bill, "id">) => void;
  deleteBill: (id: string) => void;
  toggleBillPaid: (id: string) => void;

  addGoal: (goal: Omit<Goal, "id">) => void;
  updateGoal: (id: string, goal: Omit<Goal, "id">) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (id: string, amount: number) => void;

  updatePaycheckAmount: (amount: number) => void;
  addPaycheckCategory: (category: Omit<PaycheckCategory, "id">) => void;
  updatePaycheckCategory: (id: string, category: Omit<PaycheckCategory, "id">) => void;
  deletePaycheckCategory: (id: string) => void;
  applyPaycheck: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  const [localData, setLocalData] = useLocalStorageState<Omit<AppData, "accounts">>(
    STORAGE_KEY,
    emptyLocalData,
  );
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from("accounts")
      .select(ACCOUNT_COLUMNS)
      .order("name")
      .then(({ data: rows, error }) => {
        if (cancelled) return;
        if (error) {
          console.error("Failed to load accounts", error);
          return;
        }
        setAccounts(rows ?? []);
        setAccountsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const data: AppData = useMemo(
    () => ({ ...localData, accounts }),
    [localData, accounts],
  );

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      accountsLoading,

      addAccount: async (account) => {
        const { data: row, error } = await supabase
          .from("accounts")
          .insert(account)
          .select(ACCOUNT_COLUMNS)
          .single();
        if (error) throw error;
        setAccounts((prev) => [...prev, row]);
      },
      updateAccount: async (id, account) => {
        const { data: row, error } = await supabase
          .from("accounts")
          .update(account)
          .eq("id", id)
          .select(ACCOUNT_COLUMNS)
          .single();
        if (error) throw error;
        setAccounts((prev) => prev.map((a) => (a.id === id ? row : a)));
      },
      deleteAccount: async (id) => {
        const { error } = await supabase.from("accounts").delete().eq("id", id);
        if (error) throw error;
        setAccounts((prev) => prev.filter((a) => a.id !== id));
        setLocalData((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.accountId !== id),
        }));
      },

      addTransaction: (transaction) =>
        setLocalData((prev) => ({
          ...prev,
          transactions: [
            { ...transaction, id: generateId() },
            ...prev.transactions,
          ],
        })),
      updateTransaction: (id, transaction) =>
        setLocalData((prev) => ({
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === id ? { ...transaction, id } : t,
          ),
        })),
      deleteTransaction: (id) =>
        setLocalData((prev) => ({
          ...prev,
          transactions: prev.transactions.filter((t) => t.id !== id),
        })),

      addBill: (bill) =>
        setLocalData((prev) => ({
          ...prev,
          bills: [...prev.bills, { ...bill, id: generateId() }],
        })),
      updateBill: (id, bill) =>
        setLocalData((prev) => ({
          ...prev,
          bills: prev.bills.map((b) => (b.id === id ? { ...bill, id } : b)),
        })),
      deleteBill: (id) =>
        setLocalData((prev) => ({
          ...prev,
          bills: prev.bills.filter((b) => b.id !== id),
        })),
      toggleBillPaid: (id) =>
        setLocalData((prev) => ({
          ...prev,
          bills: prev.bills.map((b) =>
            b.id === id ? { ...b, isPaid: !b.isPaid } : b,
          ),
        })),

      addGoal: (goal) =>
        setLocalData((prev) => ({
          ...prev,
          goals: [...prev.goals, { ...goal, id: generateId() }],
        })),
      updateGoal: (id, goal) =>
        setLocalData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === id ? { ...goal, id } : g)),
        })),
      deleteGoal: (id) =>
        setLocalData((prev) => ({
          ...prev,
          goals: prev.goals.filter((g) => g.id !== id),
          paycheck: {
            ...prev.paycheck,
            categories: prev.paycheck.categories.map((c) =>
              c.linkedGoalId === id
                ? { ...c, categoryType: "regular", linkedGoalId: undefined }
                : c,
            ),
          },
        })),
      contributeToGoal: (id, amount) =>
        setLocalData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: Math.max(0, g.currentAmount + amount) }
              : g,
          ),
        })),

      updatePaycheckAmount: (amount) =>
        setLocalData((prev) => ({
          ...prev,
          paycheck: { ...prev.paycheck, amount },
        })),
      addPaycheckCategory: (category) =>
        setLocalData((prev) => ({
          ...prev,
          paycheck: {
            ...prev.paycheck,
            categories: [
              ...prev.paycheck.categories,
              { ...category, id: generateId() },
            ],
          },
        })),
      updatePaycheckCategory: (id, category) =>
        setLocalData((prev) => ({
          ...prev,
          paycheck: {
            ...prev.paycheck,
            categories: prev.paycheck.categories.map((c) =>
              c.id === id ? { ...category, id } : c,
            ),
          },
        })),
      deletePaycheckCategory: (id) =>
        setLocalData((prev) => ({
          ...prev,
          paycheck: {
            ...prev.paycheck,
            categories: prev.paycheck.categories.filter((c) => c.id !== id),
          },
        })),

      applyPaycheck: () =>
        setLocalData((prev) => {
          const contributionsByGoalId = getGoalContributionsFromPaycheck(prev.paycheck);

          return {
            ...prev,
            goals: prev.goals.map((g) => {
              const contribution = contributionsByGoalId.get(g.id);
              if (!contribution) return g;
              return { ...g, currentAmount: Math.max(0, g.currentAmount + contribution) };
            }),
          };
        }),
    }),
    [data, accountsLoading, supabase, setLocalData],
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
