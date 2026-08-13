"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import { FormField, Select, TextInput } from "@/components/ui/FormField";
import { useAppData } from "@/lib/app-data-context";
import { amountForPercent, getUnpaidBillsTotal } from "@/lib/finance";
import { formatCurrency } from "@/lib/format";
import type { Bill, BillFrequency } from "@/lib/types";
import { cn } from "@/lib/utils";

type BillFormValues = {
  name: string;
  percent: string;
  dueDay: string;
  frequency: BillFrequency;
  autopay: boolean;
};

const emptyForm: BillFormValues = {
  name: "",
  percent: "",
  dueDay: "1",
  frequency: "monthly",
  autopay: false,
};

export default function BillsPage() {
  const { data, addBill, updateBill, deleteBill } = useAppData();
  const paycheckAmount = data.paycheck.amount;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BillFormValues>(emptyForm);

  const sortedBills = useMemo(
    () => [...data.bills].sort((a, b) => a.dueDay - b.dueDay),
    [data.bills],
  );

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(bill: Bill) {
    setEditingId(bill.id);
    setForm({
      name: bill.name,
      percent: String(bill.percent),
      dueDay: String(bill.dueDay),
      frequency: bill.frequency,
      autopay: bill.autopay,
    });
    setModalOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      percent: Number(form.percent) || 0,
      dueDay: Math.min(31, Math.max(1, Number(form.dueDay) || 1)),
      frequency: form.frequency,
      autopay: form.autopay,
      isPaid: editingId
        ? (data.bills.find((b) => b.id === editingId)?.isPaid ?? false)
        : false,
    };
    if (!payload.name) return;

    if (editingId) {
      updateBill(editingId, payload);
    } else {
      addBill(payload);
    }
    setModalOpen(false);
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete bill "${name}"?`)) {
      deleteBill(id);
    }
  }

  const totalPercent = data.bills.reduce((sum, b) => sum + b.percent, 0);

  return (
    <div className="flex-1 p-8">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Bills"
          description="Set a % of your paycheck for each bill — see exactly how much to move and where."
        />
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Bill
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:w-64">
          <p className="text-sm font-medium text-slate-500">Reserved for bills</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(getUnpaidBillsTotal(data.bills, paycheckAmount))}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Unpaid bills this cycle</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:w-64">
          <p className="text-sm font-medium text-slate-500">Total reserved</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(amountForPercent(totalPercent, paycheckAmount))}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {totalPercent.toFixed(1)}% of paycheck, all bills
          </p>
        </div>
      </div>

      <div className="mt-6">
        {sortedBills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No bills yet"
            description="Add a recurring bill to start tracking it."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Bill</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3 text-right">% of Paycheck</th>
                  <th className="px-4 py-3 text-right">Move</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedBills.map((bill) => (
                  <tr key={bill.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {bill.name}
                      {bill.autopay && (
                        <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                          Autopay
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">Day {bill.dueDay}</td>
                    <td className="px-4 py-3 capitalize text-slate-500">
                      {bill.frequency}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {bill.percent}%
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(amountForPercent(bill.percent, paycheckAmount))}
                      <span className="block text-xs font-normal text-slate-400">
                        to {bill.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Payment status for ${bill.name}`}
                        value={bill.isPaid ? "paid" : "unpaid"}
                        onChange={(e) =>
                          updateBill(bill.id, {
                            name: bill.name,
                            percent: bill.percent,
                            dueDay: bill.dueDay,
                            frequency: bill.frequency,
                            autopay: bill.autopay,
                            isPaid: e.target.value === "paid",
                          })
                        }
                        className={cn(
                          "cursor-pointer appearance-none rounded-full border-0 px-2.5 py-1 pr-6 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-offset-1",
                          bill.isPaid
                            ? "bg-emerald-50 text-emerald-700 focus:ring-emerald-400"
                            : "bg-amber-50 text-amber-700 focus:ring-amber-400",
                        )}
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          icon={Pencil}
                          label="Edit bill"
                          onClick={() => openEditModal(bill)}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete bill"
                          tone="danger"
                          onClick={() => handleDelete(bill.id, bill.name)}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Bill" : "Add Bill"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Bill name">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Electric Bill"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="% of paycheck">
              <TextInput
                required
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.percent}
                onChange={(e) => setForm({ ...form, percent: e.target.value })}
                placeholder="0.0"
              />
            </FormField>
            <FormField label="Due day of month">
              <TextInput
                required
                type="number"
                min="1"
                max="31"
                value={form.dueDay}
                onChange={(e) => setForm({ ...form, dueDay: e.target.value })}
              />
            </FormField>
          </div>
          <p className="text-sm text-slate-500">
            = {formatCurrency(amountForPercent(Number(form.percent) || 0, paycheckAmount))}{" "}
            of your {formatCurrency(paycheckAmount)} paycheck
          </p>
          <FormField label="Frequency">
            <Select
              value={form.frequency}
              onChange={(e) =>
                setForm({ ...form, frequency: e.target.value as BillFrequency })
              }
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </FormField>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.autopay}
              onChange={(e) => setForm({ ...form, autopay: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Autopay
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingId ? "Save Changes" : "Add Bill"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
