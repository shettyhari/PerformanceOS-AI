import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, CheckCircle2, ShieldAlert, Check, RefreshCw, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useResolveAlert, getGetAlertsQueryKey } from "@workspace/api-client-react";

interface AlertItem { id: string; type: string; severity: string; message: string; isResolved: boolean; createdAt: string; }

export function AlertsView({ alerts }: { alerts: AlertItem[] }) {
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const queryClient = useQueryClient();
  const resolveAlert = useResolveAlert({
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() }),
    },
  });

  const filtered = alerts.filter((a) => tab === "active" ? !a.isResolved : a.isResolved);

  const formatDateTime = (dateVal: string) => {
    const d = new Date(dateVal);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
        <div className="flex gap-2 p-1 rounded-[12px] bg-white/[0.02] border border-white/5">
          <button onClick={() => setTab("active")} className={`px-4 py-2 rounded-[9px] text-xs font-medium transition cursor-pointer outline-none ${tab === "active" ? "bg-white text-black" : "text-neutral-400 hover:text-neutral-200"}`}>
            Active Warnings ({alerts.filter((a) => !a.isResolved).length})
          </button>
          <button onClick={() => setTab("resolved")} className={`px-4 py-2 rounded-[9px] text-xs font-medium transition cursor-pointer outline-none ${tab === "resolved" ? "bg-white text-black" : "text-neutral-400 hover:text-neutral-200"}`}>
            Resolved ({alerts.filter((a) => a.isResolved).length})
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16 text-neutral-500 font-light text-xs">
              No {tab} alerts detected. Workspace parameters are in range.
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filtered.map((alert) => (
                <motion.div key={alert.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className={`glass-card rounded-[20px] p-5 border flex items-start gap-4 transition duration-200 ${alert.isResolved ? "border-white/5 bg-white/[0.01]" : alert.severity === "CRITICAL" ? "border-red-500/10 bg-red-950/[0.01]" : "border-yellow-500/10 bg-yellow-950/[0.01]"}`}>
                  <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${alert.isResolved ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/10" : alert.severity === "CRITICAL" ? "bg-red-950/40 text-red-400 border border-red-500/20" : "bg-yellow-950/40 text-yellow-400 border border-yellow-500/20"}`}>
                    {alert.isResolved ? <CheckCircle2 className="w-4 h-4" /> : alert.severity === "CRITICAL" ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{alert.type.replace(/_/g, " ")}</span>
                      <span className="h-1 w-1 rounded-full bg-neutral-700" />
                      <span className="text-[10px] text-neutral-500 font-light flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(alert.createdAt)}</span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-light">{alert.message}</p>
                  </div>
                  {!alert.isResolved && (
                    <button onClick={() => resolveAlert.mutate({ id: alert.id })} disabled={resolveAlert.isPending} className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-white text-black font-medium hover:bg-neutral-200 text-[10px] transition cursor-pointer flex-shrink-0 disabled:opacity-50">
                      <Check className="w-3 h-3" />
                      {resolveAlert.isPending ? "Resolving..." : "Acknowledge"}
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AlertsView;
