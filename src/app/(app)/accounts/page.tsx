"use client";

import { useState } from "react";
import { Landmark, Pencil, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import { FormField, Select, TextInput } from "@/components/ui/FormField";
import { useAppData } from "@/lib/app-data-context";
import { formatCurrency } from "@/lib/format";
import {
  ACCOUNT_TYPE_LABELS,
  type Account,
  type AccountType,
} from "@/lib/types";

const ACCOUNT_TYPES = Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[];

type AccountFormValues = {
  name: string;
  type: AccountType;
  balance: string;
};

const emptyForm: AccountFormValues = {
  name: "",
  type: "checking",
  balance: "",
};

export default function AccountsPage() {
  const { data, accountsLoading, addAccount, updateAccount, deleteAccount } =
    useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AccountFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  }

  function openEditModal(account: Account) {
    setEditingId(account.id);
    setForm({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      type: form.type,
      balance: Number(form.balance) || 0,
    };
    if (!payload.name) return;

    setSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await updateAccount(editingId, payload);
      } else {
        await addAccount(payload);
      }
      setModalOpen(false);
    } catch {
      setFormError("Couldn't save this account. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This also removes its transactions.`)) {
      return;
    }
    try {
      await deleteAccount(id);
    } catch {
      window.alert("Couldn't delete this account. Please try again.");
    }
  }

  const net = data.accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="flex-1 p-8">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Accounts"
          description="Track your accounts."
        />
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      <div className="mt-6 sm:w-64">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-500">Net</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">
            {formatCurrency(net)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        {accountsLoading ? (
          <p className="text-sm text-slate-400">Loading accounts…</p>
        ) : data.accounts.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            description="Add your first account to start tracking your money."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.accounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {account.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {ACCOUNT_TYPE_LABELS[account.type]}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">
                      {formatCurrency(account.balance)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconButton
                          icon={Pencil}
                          label="Edit account"
                          onClick={() => openEditModal(account)}
                        />
                        <IconButton
                          icon={Trash2}
                          label="Delete account"
                          tone="danger"
                          onClick={() => handleDelete(account.id, account.name)}
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
        title={editingId ? "Edit Account" : "Add Account"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Name">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Everyday Checking"
            />
          </FormField>
          <FormField label="Type">
            <Select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as AccountType })
              }
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {ACCOUNT_TYPE_LABELS[type]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Balance">
            <TextInput
              required
              type="number"
              step="0.01"
              min="0"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              placeholder="0.00"
            />
          </FormField>
          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Add Account"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
