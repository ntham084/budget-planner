"use client";

import { createContext, useContext, useMemo } from "react";
import { generateId } from "@/lib/id";
import { seedData } from "@/lib/seed-data";
import type {
  Account,
  AppData,
  Bill,
  Goal,
  PaycheckCategory,
  Transaction,
} from "@/lib/types";
import { useLocalStorageState } from "@/lib/use-local-storage-state";

const STORAGE_KEY = "budget-planner:data:v5";

type AppDataContextValue = {
  data: AppData;

  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (id: string, account: Omit<Account, "id">) => void;
  deleteAccount: (id: string) => void;

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
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useLocalStorageState<AppData>(STORAGE_KEY, seedData);

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,

      addAccount: (account) =>
        setData((prev) => ({
          ...prev,
          accounts: [...prev.accounts, { ...account, id: generateId() }],
        })),
      updateAccount: (id, account) =>
        setData((prev) => ({
          ...prev,
          accounts: prev.accounts.map((a) =>
            a.id === id ? { ...account, id } : a,
          ),
        })),
      deleteAccount: (id) =>
        setData((prev) => ({
          ...prev,
          accounts: prev.accounts.filter((a) => a.id !== id),
          transactions: prev.transactions.filter((t) => t.accountId !== id),
        })),

      addTransaction: (transaction) =>
        setData((prev) => ({
          ...prev,
          transactions: [
            { ...transaction, id: generateId() },
            ...prev.transactions,
          ],
          accounts: prev.accounts.map((a) =>
            a.id === transaction.accountId
              ? { ...a, balance: a.balance + transaction.amount }
              : a,
          ),
        })),
      updateTransaction: (id, transaction) =>
        setData((prev) => {
          const existing = prev.transactions.find((t) => t.id === id);
          if (!existing) return prev;

          const accounts = prev.accounts.map((a) => {
            let balance = a.balance;
            if (a.id === existing.accountId) balance -= existing.amount;
            if (a.id === transaction.accountId) balance += transaction.amount;
            return { ...a, balance };
          });

          return {
            ...prev,
            accounts,
            transactions: prev.transactions.map((t) =>
              t.id === id ? { ...transaction, id } : t,
            ),
          };
        }),
      deleteTransaction: (id) =>
        setData((prev) => {
          const existing = prev.transactions.find((t) => t.id === id);
          if (!existing) return prev;
          return {
            ...prev,
            transactions: prev.transactions.filter((t) => t.id !== id),
            accounts: prev.accounts.map((a) =>
              a.id === existing.accountId
                ? { ...a, balance: a.balance - existing.amount }
                : a,
            ),
          };
        }),

      addBill: (bill) =>
        setData((prev) => ({
          ...prev,
          bills: [...prev.bills, { ...bill, id: generateId() }],
        })),
      updateBill: (id, bill) =>
        setData((prev) => ({
          ...prev,
          bills: prev.bills.map((b) => (b.id === id ? { ...bill, id } : b)),
        })),
      deleteBill: (id) =>
        setData((prev) => ({
          ...prev,
          bills: prev.bills.filter((b) => b.id !== id),
        })),
      toggleBillPaid: (id) =>
        setData((prev) => ({
          ...prev,
          bills: prev.bills.map((b) =>
            b.id === id ? { ...b, isPaid: !b.isPaid } : b,
          ),
        })),

      addGoal: (goal) =>
        setData((prev) => ({
          ...prev,
          goals: [...prev.goals, { ...goal, id: generateId() }],
        })),
      updateGoal: (id, goal) =>
        setData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) => (g.id === id ? { ...goal, id } : g)),
        })),
      deleteGoal: (id) =>
        setData((prev) => ({
          ...prev,
          goals: prev.goals.filter((g) => g.id !== id),
        })),
      contributeToGoal: (id, amount) =>
        setData((prev) => ({
          ...prev,
          goals: prev.goals.map((g) =>
            g.id === id
              ? { ...g, currentAmount: g.currentAmount + amount }
              : g,
          ),
        })),

      updatePaycheckAmount: (amount) =>
        setData((prev) => ({
          ...prev,
          paycheck: { ...prev.paycheck, amount },
        })),
      addPaycheckCategory: (category) =>
        setData((prev) => ({
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
        setData((prev) => ({
          ...prev,
          paycheck: {
            ...prev.paycheck,
            categories: prev.paycheck.categories.map((c) =>
              c.id === id ? { ...category, id } : c,
            ),
          },
        })),
      deletePaycheckCategory: (id) =>
        setData((prev) => ({
          ...prev,
          paycheck: {
            ...prev.paycheck,
            categories: prev.paycheck.categories.filter((c) => c.id !== id),
          },
        })),
    }),
    [data, setData],
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
