"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import { FormField, Select, TextInput } from "@/components/ui/FormField";
import { useAppData } from "@/lib/app-data-context";
import { calculatePaycheckAllocation } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import {
  PAYCHECK_CATEGORY_TYPE_LABELS,
  type PaycheckCategory,
  type PaycheckCategoryType,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORY_TYPES = Object.keys(
  PAYCHECK_CATEGORY_TYPE_LABELS,
) as PaycheckCategoryType[];

type CategoryFormValues = {
  name: string;
  percent: string;
  categoryType: PaycheckCategoryType;
  linkedGoalId: string;
};

const emptyForm: CategoryFormValues = {
  name: "",
  percent: "",
  categoryType: "regular",
  linkedGoalId: "",
};

function formatPercent(value: number) {
  return `${Number(value.toFixed(1))}%`;
}

export default function PaycheckPage() {
  const {
    data,
    updatePaycheckAmount,
    addPaycheckCategory,
    updatePaycheckCategory,
    deletePaycheckCategory,
    applyPaycheck,
  } = useAppData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(emptyForm);
  const [amountInput, setAmountInput] = useState(String(data.paycheck.amount));
  const [appliedMessage, setAppliedMessage] = useState("");

  const categories = data.paycheck.categories;
  const goals = data.goals;
  const paycheckAmount = data.paycheck.amount;

  const allocation = calculatePaycheckAllocation(data.paycheck);
  const totalPercent = allocation.totalPercent;
  const unallocatedPercent = Number(allocation.unallocatedPercent.toFixed(1));
  const allocatedTotal = allocation.allocatedAmount;
  const unallocatedAmount = allocation.unallocatedAmount;

  function handleAmountChange(value: string) {
    setAmountInput(value);
    updatePaycheckAmount(Number(value) || 0);
  }

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(category: PaycheckCategory) {
    setEditingId(category.id);
    setForm({
      name: category.name,
      percent: String(category.percent),
      categoryType: category.categoryType,
      linkedGoalId: category.linkedGoalId ?? "",
    });
    setModalOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const isGoal = form.categoryType === "goal";
    if (isGoal && !form.linkedGoalId) return;

    const payload = {
      name: form.name.trim(),
      percent: Number(form.percent) || 0,
      categoryType: form.categoryType,
      linkedGoalId: isGoal ? form.linkedGoalId : undefined,
    };
    if (!payload.name) return;

    if (editingId) {
      updatePaycheckCategory(editingId, payload);
    } else {
      addPaycheckCategory(payload);
    }
    setModalOpen(false);
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete category "${name}"?`)) {
      deletePaycheckCategory(id);
    }
  }

  function handleApplyPaycheck() {
    applyPaycheck();
    setAppliedMessage(
      `Applied ${formatCurrency(paycheckAmount)} paycheck — goal-linked categories were funded.`,
    );
  }

  function goalName(id: string | undefined) {
    return goals.find((g) => g.id === id)?.name ?? "—";
  }

  return (
    <div className="flex-1 p-8">
      <PageHeader
        title="Paycheck"
        description="Enter a paycheck amount and automatically divide it into categories based on percentages you set."
      />

      {/* Section 1: Paycheck Categories */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-slate-500">Paycheck Categories</p>
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>

        <div className="mt-4">
          {categories.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="No categories yet"
              description="Add a category to start allocating your paycheck."
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Category Name</th>
                    <th className="px-4 py-3 text-right">Percentage</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {category.name}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatPercent(category.percent)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium",
                            category.categoryType === "goal"
                              ? "bg-violet-50 text-violet-700"
                              : category.categoryType === "spending_budget"
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {PAYCHECK_CATEGORY_TYPE_LABELS[category.categoryType]}
                          {category.categoryType === "goal"
                            ? ` — ${goalName(category.linkedGoalId)}`
                            : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <IconButton
                            icon={Pencil}
                            label="Edit category"
                            onClick={() => openEditModal(category)}
                          />
                          <IconButton
                            icon={Trash2}
                            label="Delete category"
                            tone="danger"
                            onClick={() => handleDelete(category.id, category.name)}
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

        <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
          {unallocatedPercent === 0 ? (
            <p className="font-medium text-emerald-600">
              Total Allocation: {formatPercent(totalPercent)}
            </p>
          ) : unallocatedPercent > 0 ? (
            <p className="font-medium text-amber-600">
              Total Allocation: {formatPercent(totalPercent)} —{" "}
              {formatPercent(unallocatedPercent)} Unallocated
            </p>
          ) : (
            <p className="font-medium text-red-600">
              Total Allocation: {formatPercent(totalPercent)} —{" "}
              {formatPercent(Math.abs(unallocatedPercent))} Overallocated
            </p>
          )}
        </div>
      </div>

      {/* Section 2: New Paycheck */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">New Paycheck</p>

        <div className="mt-4 max-w-xs">
          <FormField label="Paycheck Amount">
            <TextInput
              type="number"
              step="0.01"
              min="0"
              value={amountInput}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
            />
          </FormField>
        </div>

        <div className="mt-5">
          {categories.length === 0 ? (
            <p className="text-sm text-slate-400">
              Add a category above to see the breakdown here.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">%</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3">Goal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocation.lines.map((line) => (
                    <tr key={line.categoryId}>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {line.name}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-500">
                        {formatPercent(line.percent)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(line.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {line.categoryType === "goal"
                          ? goalName(line.linkedGoalId)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <Button
            type="button"
            onClick={handleApplyPaycheck}
            disabled={categories.length === 0 || paycheckAmount <= 0}
          >
            Apply Paycheck
          </Button>
          {appliedMessage && (
            <p className="text-sm text-emerald-600">{appliedMessage}</p>
          )}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium text-slate-400">Total Paycheck</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatCurrency(paycheckAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Allocated</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {formatCurrency(allocatedTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">
              {unallocatedAmount < 0 ? "Overallocated" : "Unallocated"}
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-semibold",
                unallocatedAmount < 0 ? "text-red-600" : "text-slate-900",
              )}
            >
              {formatCurrency(Math.abs(unallocatedAmount))}
            </p>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Category" : "Add Category"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Category Name">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Bills"
            />
          </FormField>
          <FormField label="% of Paycheck">
            <TextInput
              required
              type="number"
              step="0.1"
              min="0"
              value={form.percent}
              onChange={(e) => setForm({ ...form, percent: e.target.value })}
              placeholder="0.0"
            />
          </FormField>
          <FormField label="Category Type">
            <Select
              value={form.categoryType}
              onChange={(e) =>
                setForm({
                  ...form,
                  categoryType: e.target.value as PaycheckCategoryType,
                  linkedGoalId:
                    e.target.value === "goal" ? form.linkedGoalId : "",
                })
              }
            >
              {CATEGORY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PAYCHECK_CATEGORY_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </FormField>
          {form.categoryType === "goal" && (
            <FormField label="Linked Goal">
              <Select
                required
                value={form.linkedGoalId}
                onChange={(e) =>
                  setForm({ ...form, linkedGoalId: e.target.value })
                }
              >
                <option value="" disabled>
                  Select a goal
                </option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name}
                  </option>
                ))}
              </Select>
            </FormField>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingId ? "Save Changes" : "Add Category"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
