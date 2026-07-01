import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { useDateRange, DatePreset } from "@/store/dateRange";

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: "Last 7 days", value: "7d" },
  { label: "Last 14 days", value: "14d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
];

export function DateRangePicker() {
  const { preset, from, to, setPreset, setCustomRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const label =
    preset === "custom"
      ? `${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : PRESETS.find((p) => p.value === preset)?.label ?? "Last 30 days";

  const applyCustom = () => {
    if (customFrom && customTo) {
      setCustomRange(new Date(customFrom), new Date(customTo));
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white/[0.02] border border-white/5 hover:border-white/10 hover:text-white transition text-xs text-neutral-400 cursor-pointer"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-[16px] bg-[#0e0e12] border border-white/[0.06] shadow-2xl z-50 p-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => { setPreset(p.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-[10px] text-xs transition cursor-pointer ${preset === p.value ? "bg-purple-600/20 text-purple-300" : "text-neutral-400 hover:bg-white/[0.04] hover:text-white"}`}
            >
              {p.label}
            </button>
          ))}
          <div className="border-t border-white/[0.04] mt-2 pt-2 space-y-2 px-1">
            <p className="text-[10px] text-neutral-500 font-medium px-2">Custom range</p>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full px-2 py-1.5 rounded-[8px] bg-white/[0.03] border border-white/5 text-xs text-white outline-none"
            />
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full px-2 py-1.5 rounded-[8px] bg-white/[0.03] border border-white/5 text-xs text-white outline-none"
            />
            <button
              onClick={applyCustom}
              className="w-full py-2 rounded-[8px] bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition cursor-pointer"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
