"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import { FormField, TextInput } from "@/components/ui/FormField";
import { useAppData } from "@/lib/app-data-context";
import { amountForPercent } from "@/lib/selectors";
import { formatCurrency } from "@/lib/format";
import type { PaycheckCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

type CategoryFormValues = {
  name: string;
  percent: string;
  isSpendingBudget: boolean;
};

const emptyForm: CategoryFormValues = { name: "", percent: "", isSpendingBudget: false };

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
  } = useAppData();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(emptyForm);
  const [amountInput, setAmountInput] = useState(String(data.paycheck.amount));

  const categories = data.paycheck.categories;
  const totalPercent = categories.reduce((sum, c) => sum + c.percent, 0);
  const unallocatedPercent = Number((100 - totalPercent).toFixed(1));

  const paycheckAmount = Number(amountInput) || 0;
  const allocatedTotal = amountForPercent(totalPercent, paycheckAmount);
  const unallocatedAmount = paycheckAmount - allocatedTotal;

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
      isSpendingBudget: category.isSpendingBudget,
    });
    setModalOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      percent: Number(form.percent) || 0,
      isSpendingBudget: form.isSpendingBudget,
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
                    <th className="px-4 py-3">Spending Budget</th>
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
                            category.isSpendingBudget
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-slate-100 text-slate-500",
                          )}
                        >
                          {category.isSpendingBudget ? "Yes" : "No"}
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
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(amountForPercent(category.percent, paycheckAmount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.isSpendingBudget}
              onChange={(e) =>
                setForm({ ...form, isSpendingBudget: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Track this as a spending budget
          </label>
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
