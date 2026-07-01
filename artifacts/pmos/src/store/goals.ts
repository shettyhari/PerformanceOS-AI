import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Goal {
  id: string;
  label: string;
  metric: "roas" | "spend" | "revenue" | "conversions";
  target: number;
  current?: number;
}

interface GoalsState {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  addGoal: (goal: Omit<Goal, "id">) => void;
  removeGoal: (id: string) => void;
}

const DEFAULT_GOALS: Goal[] = [
  { id: "g1", label: "Blended ROAS Target", metric: "roas", target: 4.0 },
  { id: "g2", label: "Monthly Spend Budget", metric: "spend", target: 50000 },
  { id: "g3", label: "Revenue Goal", metric: "revenue", target: 200000 },
];

export const useGoals = create<GoalsState>()(
  persist(
    (set) => ({
      goals: DEFAULT_GOALS,
      setGoals: (goals) => set({ goals }),
      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),
      addGoal: (goal) =>
        set((s) => ({ goals: [...s.goals, { ...goal, id: crypto.randomUUID() }] })),
      removeGoal: (id) =>
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
    }),
    { name: "pmos-goals" }
  )
);
