"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import { FormField, Select, TextInput } from "@/components/ui/FormField";
import { useAppData } from "@/lib/app-data-context";
import { currentMonthKey } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

type TransactionType = "expense" | "income";

type TransactionFormValues = {
  date: string;
  description: string;
  category: string;
  accountId: string;
  type: TransactionType;
  amount: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(defaultAccountId: string): TransactionFormValues {
  return {
    date: today(),
    description: "",
    category: "",
    accountId: defaultAccountId,
    type: "expense",
    amount: "",
  };
}

// Fixed categorical order — kept stable across every month's bar so a color
// always means the same category (dataviz color-formula: fixed hue anchors).
const CHART_CATEGORIES = [
  "Housing",
  "Groceries",
  "Transportation",
  "Restaurants",
  "Shopping",
  "Subscriptions",
  "Health & Fitness",
  "Other",
] as const;

type ChartCategory = (typeof CHART_CATEGORIES)[number];

// Validated categorical palette (8 fixed hue slots, light-mode steps) — see
// the dataviz skill's reference palette. Assigned in the same fixed order
// as CHART_CATEGORIES so no color is ever reassigned to a different category.
const CATEGORY_COLORS: Record<ChartCategory, string> = {
  Housing: "#2a78d6",
  Groceries: "#eb6834",
  Transportation: "#1baf7a",
  Restaurants: "#eda100",
  Shopping: "#e87ba4",
  Subscriptions: "#008300",
  "Health & Fitness": "#4a3aa7",
  Other: "#e34948",
};

const CHART_HEIGHT = 220;

// A few transaction/spending-budget category names read under a broader
// chart bucket; anything unrecognized folds into "Other".
function toChartCategory(category: string): ChartCategory {
  const normalized = category.trim().toLowerCase();
  if (normalized === "dining") return "Restaurants";
  if (normalized === "gas") return "Transportation";
  const match = CHART_CATEGORIES.find((c) => c.toLowerCase() === normalized);
  return match ?? "Other";
}

function formatWholeCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Month-select options: January through the current month, most recent first. */
function getMonthOptions() {
  const now = new Date();
  const year = now.getFullYear();
  const options: { key: string; label: string }[] = [];
  for (let m = now.getMonth(); m >= 0; m--) {
    options.push({
      key: `${year}-${String(m + 1).padStart(2, "0")}`,
      label: new Date(year, m, 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    });
  }
  return options;
}

/** Jan-Dec of the given year, for the yearly comparison chart. */
function getYearMonths(year: number) {
  return Array.from({ length: 12 }, (_, m) => ({
    key: `${year}-${String(m + 1).padStart(2, "0")}`,
    shortLabel: new Date(year, m, 1).toLocaleDateString("en-US", { month: "short" }),
  }));
}

export default function TransactionsPage() {
  const { data, addTransaction, updateTransaction, deleteTransaction } =
    useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionFormValues>(emptyForm(""));
  const [monthFilter, setMonthFilter] = useState(() => currentMonthKey());
  const [accountFilter, setAccountFilter] = useState("all");
  const [search, setSearch] = useState("");

  const monthOptions = useMemo(() => getMonthOptions(), []);
  const chartYear = new Date().getFullYear();

  const accountsById = useMemo(
    () => new Map(data.accounts.map((a) => [a.id, a])),
    [data.accounts],
  );

  const yearChartData = useMemo(() => {
    const months = getYearMonths(chartYear);
    return months.map(({ key, shortLabel }) => {
      const totals = Object.fromEntries(
        CHART_CATEGORIES.map((c) => [c, 0]),
      ) as Record<ChartCategory, number>;

      data.transactions
        .filter((t) => t.date.startsWith(key) && t.amount < 0)
        .forEach((t) => {
          totals[toChartCategory(t.category)] += Math.abs(t.amount);
        });

      const total = CHART_CATEGORIES.reduce((sum, c) => sum + totals[c], 0);
      return { key, shortLabel, totals, total };
    });
  }, [data.transactions, chartYear]);

  const chartMax = Math.max(1, ...yearChartData.map((m) => m.total));

  const filtered = useMemo(() => {
    return data.transactions
      .filter((t) => t.date.startsWith(monthFilter))
      .filter((t) => accountFilter === "all" || t.accountId === accountFilter)
      .filter((t) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, monthFilter, accountFilter, search]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm(data.accounts[0]?.id ?? ""));
    setModalOpen(true);
  }

  function openEditModal(transaction: Transaction) {
    setEditingId(transaction.id);
    setForm({
      date: transaction.date,
      description: transaction.description,
      category: transaction.category,
      accountId: transaction.accountId,
      type: transaction.amount < 0 ? "expense" : "income",
      amount: String(Math.abs(transaction.amount)),
    });
    setModalOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.accountId) return;

    const magnitude = Math.abs(Number(form.amount)) || 0;
    const payload = {
      date: form.date,
      description: form.description.trim(),
      category: form.category.trim() || "Uncategorized",
      accountId: form.accountId,
      amount: form.type === "expense" ? -magnitude : magnitude,
    };
    if (!payload.description) return;

    if (editingId) {
      updateTransaction(editingId, payload);
    } else {
      addTransaction(payload);
    }
    setModalOpen(false);
  }

  function handleDelete(id: string, description: string) {
    if (window.confirm(`Delete transaction "${description}"?`)) {
      deleteTransaction(id);
    }
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Transactions"
          description="Review your spending history by month and compare across the year."
        />
        <Button onClick={openAddModal} disabled={data.accounts.length === 0}>
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {data.accounts.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ArrowLeftRight}
            title="No accounts to record transactions against"
            description="Add an account first, then come back to log transactions."
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Month</span>
            <Select
              className="!mt-0 w-48"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            >
              {monthOptions.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Select
              className="!mt-0 w-48"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
            >
              <option value="all">All accounts</option>
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
            <TextInput
              className="!mt-0 w-64"
              placeholder="Search description or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-4">
            {filtered.length === 0 ? (
              <EmptyState
                icon={ArrowLeftRight}
                title="No transactions found"
                description="Try a different month or filter, or add a new transaction."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((t) => (
                      <tr key={t.id}>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                          {t.date}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {t.description}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {t.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {accountsById.get(t.accountId)?.name ?? "—"}
                        </td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-medium",
                            t.amount < 0 ? "text-slate-900" : "text-emerald-600",
                          )}
                        >
                          {t.amount < 0 ? "-" : "+"}
                          {formatCurrency(Math.abs(t.amount))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <IconButton
                              icon={Pencil}
                              label="Edit transaction"
                              onClick={() => openEditModal(t)}
                            />
                            <IconButton
                              icon={Trash2}
                              label="Delete transaction"
                              tone="danger"
                              onClick={() => handleDelete(t.id, t.description)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">
              Yearly Spending by Month
            </p>
            <p className="text-xs text-slate-400">{chartYear}</p>

            <div className="mt-6 overflow-x-auto">
              <div className="flex min-w-[640px] items-end gap-2 sm:gap-3">
                {yearChartData.map((month) => (
                  <div key={month.key} className="flex flex-1 flex-col items-center">
                    <p className="mb-1 text-[11px] font-medium text-slate-500">
                      {month.total > 0 ? formatWholeCurrency(month.total) : ""}
                    </p>
                    <div
                      className="mx-auto flex w-full max-w-[24px] flex-col-reverse gap-[2px]"
                      style={{ height: CHART_HEIGHT }}
                    >
                      {CHART_CATEGORIES.map((category, i) => {
                        const value = month.totals[category];
                        const heightPx =
                          month.total > 0 ? (value / chartMax) * CHART_HEIGHT : 0;
                        const isLast = i === CHART_CATEGORIES.length - 1;
                        return (
                          <div
                            key={category}
                            tabIndex={0}
                            className={cn(
                              "group/segment relative w-full outline-none transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-slate-500 focus-visible:brightness-110",
                              isLast && "rounded-t",
                            )}
                            style={{
                              height: heightPx,
                              backgroundColor: CATEGORY_COLORS[category],
                            }}
                          >
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover/segment:opacity-100 group-focus/segment:opacity-100">
                              {category}: {formatCurrency(value)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">{month.shortLabel}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4">
              {CHART_CATEGORIES.map((category) => (
                <div key={category} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: CATEGORY_COLORS[category] }}
                  />
                  {category}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Transaction" : "Add Transaction"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Description">
            <TextInput
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Grocery Store"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date">
              <TextInput
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </FormField>
            <FormField label="Category">
              <TextInput
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Groceries"
                list="category-suggestions"
              />
            </FormField>
          </div>
          <FormField label="Account">
            <Select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
            >
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Type">
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as TransactionType })
                }
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
            </FormField>
            <FormField label="Amount">
              <TextInput
                required
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingId ? "Save Changes" : "Add Transaction"}
            </Button>
          </div>
        </form>
      </Modal>

      <datalist id="category-suggestions">
        {data.paycheck.categories
          .filter((c) => c.categoryType === "spending_budget")
          .map((c) => (
            <option key={c.id} value={c.name} />
          ))}
      </datalist>
    </div>
  );
}
