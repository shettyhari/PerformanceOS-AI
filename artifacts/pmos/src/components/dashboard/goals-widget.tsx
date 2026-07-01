import React, { useState } from "react";
import { Target, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useGoals, Goal } from "@/store/goals";
import { motion, AnimatePresence } from "framer-motion";

const METRIC_LABELS: Record<Goal["metric"], string> = {
  roas: "ROAS",
  spend: "Spend ($)",
  revenue: "Revenue ($)",
  conversions: "Conversions",
};

const METRIC_FORMAT: Record<Goal["metric"], (v: number) => string> = {
  roas: (v) => `${v.toFixed(2)}x`,
  spend: (v) => `$${v.toLocaleString()}`,
  revenue: (v) => `$${v.toLocaleString()}`,
  conversions: (v) => v.toLocaleString(),
};

function GoalBar({ goal, onRemove }: { goal: Goal; onRemove: () => void }) {
  const pct = goal.current != null ? Math.min((goal.current / goal.target) * 100, 100) : 0;
  const over = goal.current != null && goal.current >= goal.target;
  const color = over ? "bg-emerald-500" : pct > 60 ? "bg-purple-500" : pct > 30 ? "bg-yellow-500" : "bg-neutral-600";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-white">{goal.label}</p>
          <p className="text-[10px] text-neutral-500 font-light">
            {goal.current != null ? METRIC_FORMAT[goal.metric](goal.current) : "—"} / {METRIC_FORMAT[goal.metric](goal.target)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${over ? "text-emerald-400" : "text-neutral-300"}`}>{Math.round(pct)}%</span>
          <button onClick={onRemove} className="p-1 rounded-[6px] hover:bg-white/[0.04] text-neutral-600 hover:text-red-400 transition cursor-pointer">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.04]">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function GoalsWidget({ analyticsData }: { analyticsData?: any }) {
  const { goals, addGoal, removeGoal, updateGoal } = useGoals();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ label: string; metric: Goal["metric"]; target: string }>({
    label: "",
    metric: "roas",
    target: "",
  });

  const platforms: any[] = analyticsData?.platformsSummary ?? [];
  const totalSpend = platforms.reduce((s: number, p: any) => s + (p.spend ?? 0), 0);
  const totalRevenue = platforms.reduce((s: number, p: any) => s + (p.revenue ?? 0), 0);
  const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const totalConversions = (analyticsData?.campaigns ?? []).reduce((s: number, c: any) => s + (c.conversions ?? 0), 0);

  const currentValues: Record<Goal["metric"], number> = {
    roas: blendedRoas,
    spend: totalSpend,
    revenue: totalRevenue,
    conversions: totalConversions,
  };

  const goalsWithCurrent = goals.map((g) => ({ ...g, current: currentValues[g.metric] }));

  const handleAdd = () => {
    if (!form.label || !form.target) return;
    addGoal({ label: form.label, metric: form.metric, target: Number(form.target) });
    setForm({ label: "", metric: "roas", target: "" });
    setShowAdd(false);
  };

  return (
    <div className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Performance Goals</h3>
        </div>
        <button
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-[10px] text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Add Goal
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-[14px] bg-white/[0.02] border border-white/5 p-4 space-y-3 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Goal label (e.g. Q3 ROAS Target)"
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              className="w-full px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none placeholder:text-neutral-600"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={form.metric}
                onChange={(e) => setForm((p) => ({ ...p, metric: e.target.value as Goal["metric"] }))}
                className="px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-neutral-300 outline-none"
              >
                {(Object.entries(METRIC_LABELS) as [Goal["metric"], string][]).map(([k, v]) => (
                  <option key={k} value={k} className="bg-neutral-900">{v}</option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Target value"
                value={form.target}
                onChange={(e) => setForm((p) => ({ ...p, target: e.target.value }))}
                className="px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none placeholder:text-neutral-600"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="flex-1 py-2 rounded-[10px] bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition cursor-pointer flex items-center justify-center gap-1">
                <Check className="w-3 h-3" /> Save Goal
              </button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-[10px] bg-white/[0.03] border border-white/5 text-xs text-neutral-400 hover:text-white transition cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-5 divide-y divide-white/[0.03]">
        {goalsWithCurrent.map((g, i) => (
          <div key={g.id} className={i > 0 ? "pt-4" : ""}>
            <GoalBar goal={g} onRemove={() => removeGoal(g.id)} />
          </div>
        ))}
        {goals.length === 0 && (
          <p className="text-xs text-neutral-500 font-light text-center py-4">No goals set — click Add Goal to get started.</p>
        )}
      </div>
    </div>
  );
}
