"use client";

import { useState } from "react";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/ui/ProgressBar";
import { FormField, TextInput } from "@/components/ui/FormField";
import { useAppData } from "@/lib/app-data-context";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Goal } from "@/lib/types";

type GoalFormValues = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
};

const emptyForm: GoalFormValues = {
  name: "",
  targetAmount: "",
  currentAmount: "0",
  targetDate: "",
};

export default function GoalsPage() {
  const { data, addGoal, updateGoal, deleteGoal, contributeToGoal } = useAppData();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GoalFormValues>(emptyForm);
  const [contribution, setContribution] = useState<Record<string, string>>({});

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(goal: Goal) {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      targetAmount: String(goal.targetAmount),
      currentAmount: String(goal.currentAmount),
      targetDate: goal.targetDate,
    });
    setModalOpen(true);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload = {
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount) || 0,
      currentAmount: Number(form.currentAmount) || 0,
      targetDate: form.targetDate,
    };
    if (!payload.name) return;

    if (editingId) {
      updateGoal(editingId, payload);
    } else {
      addGoal(payload);
    }
    setModalOpen(false);
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`Delete goal "${name}"?`)) {
      deleteGoal(id);
    }
  }

  function handleContribute(id: string) {
    const value = Number(contribution[id]) || 0;
    if (value === 0) return;
    contributeToGoal(id, value);
    setContribution((prev) => ({ ...prev, [id]: "" }));
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex items-start justify-between">
        <PageHeader
          title="Goals"
          description="Track progress toward your savings goals."
        />
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      <div className="mt-6">
        {data.goals.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description="Add a savings goal to start tracking progress toward it."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.goals.map((goal) => {
              const percent =
                goal.targetAmount > 0
                  ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
                  : 0;
              return (
                <div
                  key={goal.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{goal.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Target {formatDate(goal.targetDate)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <IconButton
                        icon={Pencil}
                        label="Edit goal"
                        onClick={() => openEditModal(goal)}
                      />
                      <IconButton
                        icon={Trash2}
                        label="Delete goal"
                        tone="danger"
                        onClick={() => handleDelete(goal.id, goal.name)}
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-2xl font-semibold text-slate-900">
                    {formatCurrency(goal.currentAmount)}
                    <span className="text-sm font-normal text-slate-400">
                      {" "}
                      / {formatCurrency(goal.targetAmount)}
                    </span>
                  </p>
                  <div className="mt-2">
                    <ProgressBar
                      value={goal.currentAmount}
                      max={goal.targetAmount}
                      colorClassName="bg-violet-600"
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {percent.toFixed(0)}% complete
                  </p>

                  <div className="mt-4 flex gap-2">
                    <TextInput
                      className="!mt-0"
                      type="number"
                      step="0.01"
                      placeholder="Add funds"
                      value={contribution[goal.id] ?? ""}
                      onChange={(e) =>
                        setContribution((prev) => ({
                          ...prev,
                          [goal.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="secondary"
                      onClick={() => handleContribute(goal.id)}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Goal" : "Add Goal"}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Goal name">
            <TextInput
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Vacation"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Target amount">
              <TextInput
                required
                type="number"
                step="0.01"
                min="0"
                value={form.targetAmount}
                onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                placeholder="0.00"
              />
            </FormField>
            <FormField label="Current amount">
              <TextInput
                type="number"
                step="0.01"
                min="0"
                value={form.currentAmount}
                onChange={(e) => setForm({ ...form, currentAmount: e.target.value })}
                placeholder="0.00"
              />
            </FormField>
          </div>
          <FormField label="Target date">
            <TextInput
              required
              type="date"
              value={form.targetDate}
              onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{editingId ? "Save Changes" : "Add Goal"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
