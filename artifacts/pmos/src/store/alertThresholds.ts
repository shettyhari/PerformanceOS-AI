import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AlertThresholdsState {
  criticalRoas: number;
  warningRoas: number;
  maxDailySpend: number;
  setCriticalRoas: (v: number) => void;
  setWarningRoas: (v: number) => void;
  setMaxDailySpend: (v: number) => void;
}

export const useAlertThresholds = create<AlertThresholdsState>()(
  persist(
    (set) => ({
      criticalRoas: 1.0,
      warningRoas: 1.5,
      maxDailySpend: 5000,
      setCriticalRoas: (criticalRoas) => set({ criticalRoas }),
      setWarningRoas: (warningRoas) => set({ warningRoas }),
      setMaxDailySpend: (maxDailySpend) => set({ maxDailySpend }),
    }),
    { name: "pmos-alert-thresholds" }
  )
);
