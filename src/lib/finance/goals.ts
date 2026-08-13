import type { Goal } from "@/lib/types";

export type GoalProgress = {
  currentAmount: number;
  targetAmount: number;
  /** 0-100, capped at 100 even if currentAmount exceeds targetAmount. */
  percent: number;
  remaining: number;
  isComplete: boolean;
};

export function getGoalProgress(goal: Goal): GoalProgress {
  const percent =
    goal.targetAmount > 0
      ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
      : 0;

  return {
    currentAmount: goal.currentAmount,
    targetAmount: goal.targetAmount,
    percent,
    remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
    isComplete: goal.currentAmount >= goal.targetAmount && goal.targetAmount > 0,
  };
}
