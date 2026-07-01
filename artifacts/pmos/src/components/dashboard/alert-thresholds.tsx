import React, { useState } from "react";
import { SlidersHorizontal, Save, RotateCcw } from "lucide-react";
import { useAlertThresholds } from "@/store/alertThresholds";

export function AlertThresholds() {
  const { criticalRoas, warningRoas, maxDailySpend, setCriticalRoas, setWarningRoas, setMaxDailySpend } = useAlertThresholds();
  const [local, setLocal] = useState({ criticalRoas, warningRoas, maxDailySpend });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setCriticalRoas(local.criticalRoas);
    setWarningRoas(local.warningRoas);
    setMaxDailySpend(local.maxDailySpend);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setLocal({ criticalRoas: 1.0, warningRoas: 1.5, maxDailySpend: 5000 });
  };

  return (
    <div className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-orange-400" />
        <h3 className="text-sm font-semibold text-white">Custom Alert Thresholds</h3>
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-white">Critical ROAS Threshold</p>
              <p className="text-[11px] text-neutral-500 font-light mt-0.5">Alert fires when ROAS drops below this value</p>
            </div>
            <span className="text-sm font-bold text-red-400">{local.criticalRoas.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={local.criticalRoas}
            onChange={(e) => setLocal((p) => ({ ...p, criticalRoas: Number(e.target.value) }))}
            className="w-full h-1.5 rounded-full accent-red-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span><span>3.0x</span>
          </div>
        </div>

        <div className="border-t border-white/[0.04]" />

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-white">Warning ROAS Threshold</p>
              <p className="text-[11px] text-neutral-500 font-light mt-0.5">Alert fires when ROAS drops below this value</p>
            </div>
            <span className="text-sm font-bold text-yellow-400">{local.warningRoas.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.1"
            value={local.warningRoas}
            onChange={(e) => setLocal((p) => ({ ...p, warningRoas: Number(e.target.value) }))}
            className="w-full h-1.5 rounded-full accent-yellow-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>1.0x</span><span>2.0x</span><span>3.0x</span><span>4.0x</span><span>5.0x</span>
          </div>
        </div>

        <div className="border-t border-white/[0.04]" />

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs font-medium text-white">Max Daily Spend Alert</p>
              <p className="text-[11px] text-neutral-500 font-light mt-0.5">Alert when daily spend exceeds this amount</p>
            </div>
            <span className="text-sm font-bold text-blue-400">${local.maxDailySpend.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="500"
            max="50000"
            step="500"
            value={local.maxDailySpend}
            onChange={(e) => setLocal((p) => ({ ...p, maxDailySpend: Number(e.target.value) }))}
            className="w-full h-1.5 rounded-full accent-blue-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-600">
            <span>$500</span><span>$10K</span><span>$25K</span><span>$50K</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-white text-black text-xs font-medium hover:bg-neutral-200 active:scale-95 transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {saved ? "Saved!" : "Save Thresholds"}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/[0.03] border border-white/5 text-xs text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </div>
  );
}
