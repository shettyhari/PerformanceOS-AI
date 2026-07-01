import { create } from "zustand";

export type DatePreset = "7d" | "14d" | "30d" | "90d" | "custom";

interface DateRangeState {
  preset: DatePreset;
  from: Date;
  to: Date;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (from: Date, to: Date) => void;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const useDateRange = create<DateRangeState>((set) => ({
  preset: "30d",
  from: daysAgo(30),
  to: new Date(),
  setPreset: (preset) => {
    const days = preset === "7d" ? 7 : preset === "14d" ? 14 : preset === "90d" ? 90 : 30;
    set({ preset, from: daysAgo(days), to: new Date() });
  },
  setCustomRange: (from, to) => set({ preset: "custom", from, to }),
}));
