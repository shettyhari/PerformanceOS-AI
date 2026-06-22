"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AlertTriangle, Bell, CheckCircle2, ShieldAlert, 
  Check, RefreshCw, AlertCircle, Clock 
} from "lucide-react";
import { resolveAlert } from "../../server/actions/alerts";

interface AlertItem {
  id: string;
  type: string;
  severity: string;
  message: string;
  isResolved: boolean;
  createdAt: Date;
}

interface AlertsViewProps {
  alerts: AlertItem[];
}

export function AlertsView({ alerts }: AlertsViewProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((a) => 
    tab === "active" ? !a.isResolved : a.isResolved
  );

  const handleResolve = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await resolveAlert(id);
      if (res.success) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const formatDateTime = (dateVal: Date | string) => {
    const d = new Date(dateVal);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tabs Switcher */}
      <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
        <div className="flex gap-2 p-1 rounded-[12px] bg-white/[0.02] border border-white/5">
          <button
            onClick={() => setTab("active")}
            className={`px-4 py-2 rounded-[9px] text-xs font-medium transition cursor-pointer outline-none ${
              tab === "active"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Active Warnings ({alerts.filter((a) => !a.isResolved).length})
          </button>
          <button
            onClick={() => setTab("resolved")}
            className={`px-4 py-2 rounded-[9px] text-xs font-medium transition cursor-pointer outline-none ${
              tab === "resolved"
                ? "bg-white text-black"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Resolved ({alerts.filter((a) => a.isResolved).length})
          </button>
        </div>

        <button 
          onClick={() => router.refresh()}
          className="p-2 rounded-[10px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] text-neutral-400 hover:text-white transition cursor-pointer"
          title="Scan campaign data for anomalies"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Alert Listings */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 text-neutral-500 font-light text-xs"
            >
              No {tab} alerts detected. Workspace parameters are in range.
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`glass-card rounded-[20px] p-5 border flex items-start gap-4 transition duration-200 ${
                    alert.isResolved 
                      ? "border-white/5 bg-white/[0.01]" 
                      : alert.severity === "CRITICAL"
                        ? "border-red-500/10 bg-red-950/[0.01]"
                        : "border-yellow-500/10 bg-yellow-950/[0.01]"
                  }`}
                >
                  {/* Alert severity indicator */}
                  <div className={`h-9 w-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                    alert.isResolved
                      ? "bg-emerald-950/20 text-emerald-400 border border-emerald-500/10"
                      : alert.severity === "CRITICAL"
                        ? "bg-red-950/40 text-red-400 border border-red-500/20"
                        : "bg-yellow-950/40 text-yellow-400 border border-yellow-500/20"
                  }`}>
                    {alert.isResolved ? (
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    ) : alert.severity === "CRITICAL" ? (
                      <ShieldAlert className="w-4.5 h-4.5" />
                    ) : (
                      <AlertTriangle className="w-4.5 h-4.5" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                        {alert.type.replace("_", " ")}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-neutral-700" />
                      <span className="text-[10px] text-neutral-500 font-light flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(alert.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-200 leading-relaxed font-light">
                      {alert.message}
                    </p>
                  </div>

                  {/* Action Button */}
                  {!alert.isResolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      disabled={loadingId === alert.id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-white text-black font-medium hover:bg-neutral-200 text-[10px] transition cursor-pointer flex-shrink-0 disabled:opacity-50"
                    >
                      <Check className="w-3 h-3" />
                      {loadingId === alert.id ? "Resolving..." : "Acknowledge"}
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
