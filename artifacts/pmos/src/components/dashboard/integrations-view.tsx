import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Key, Trash2, RefreshCw, Link2, Info, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useConnectWindsor, useDisconnectWindsor, useTriggerSync,
  getGetWindsorConnectionQueryKey,
  getGetAnalyticsDataQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@workspace/api-client-react";

interface SyncLog { id: string; status: string; errorMessage: string | null; rowsSynced: number; timestamp: string; }

interface IntegrationsViewProps {
  connection: { connected: boolean; syncStatus: string | null; lastSyncAt: string | null; createdAt: string | null; syncLogs: SyncLog[]; } | null;
}

export function IntegrationsView({ connection }: IntegrationsViewProps) {
  const [apiKey, setApiKey] = useState("");
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string; rows?: number } | null>(null);
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getGetWindsorConnectionQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetAnalyticsDataQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const connectMutation = useConnectWindsor({ mutation: { onSuccess: invalidateAll } });
  const disconnectMutation = useDisconnectWindsor({ mutation: { onSuccess: invalidateAll } });
  const syncMutation = useTriggerSync({
    mutation: {
      onSuccess: (data: any) => {
        invalidateAll();
        const rows = data?.rowsSynced ?? 0;
        if (rows === 0) {
          setSyncResult({ ok: false, message: "Sync succeeded but Windsor.ai returned 0 rows. Make sure your ad accounts are connected inside your Windsor.ai dashboard at windsor.ai." });
        } else {
          setSyncResult({ ok: true, message: `Successfully synced ${rows.toLocaleString()} rows of real campaign data from Windsor.ai.`, rows });
        }
        setTimeout(() => setSyncResult(null), 10000);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || err?.message || "Sync failed. Check that your Windsor.ai API key is valid and your ad accounts are connected.";
        setSyncResult({ ok: false, message: msg });
      },
    },
  });

  const formatDateTime = (dateVal: string | null) => {
    if (!dateVal) return "Never";
    return new Date(dateVal).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    connectMutation.mutate({ data: { apiKey } }, { onSuccess: () => setApiKey("") });
  };

  const handleDisconnect = () => {
    if (!confirm("Disconnect Windsor.ai? This will delete all synced campaign data.")) return;
    disconnectMutation.mutate();
  };

  const isConnected = connection?.connected;
  const lastLog = connection?.syncLogs?.[connection.syncLogs.length - 1];
  const syncFailed = connection?.syncStatus === "FAILED";

  const connectorsList = [
    { name: "Google Ads", desc: "Search, Shopping & Display performance metrics" },
    { name: "Meta Ads", desc: "Facebook & Instagram campaign performance" },
    { name: "LinkedIn Ads", desc: "B2B audience targeting & conversion tracking" },
    { name: "Microsoft Ads", desc: "Bing Search Network & display metrics" },
    { name: "TikTok Ads", desc: "Short-form video campaign performance" },
    { name: "Pinterest Ads", desc: "Discovery & shopping campaign metrics" },
  ];

  return (
    <div className="space-y-8 max-w-4xl">

      {/* Connection card */}
      {isConnected ? (
        <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center border ${syncFailed ? "bg-red-950/40 border-red-500/20 text-red-400" : "bg-emerald-950/40 border-emerald-500/20 text-emerald-400"}`}>
                {syncFailed ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Windsor.ai Data Layer Connected</h3>
                <p className="text-xs text-neutral-400 font-light mt-0.5">
                  Status:{" "}
                  <span className={`font-medium uppercase ${syncFailed ? "text-red-400" : "text-emerald-400"}`}>
                    {connection?.syncStatus}
                  </span>
                  {" · "}Last sync: <span className="text-neutral-300">{formatDateTime(connection?.lastSyncAt || null)}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSyncResult(null); syncMutation.mutate(); }}
                disabled={syncMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                {syncMutation.isPending ? "Syncing live data..." : "Sync Now"}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-300 hover:bg-red-900 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Disconnect
              </button>
            </div>
          </div>

          {/* Inline sync result */}
          {syncResult && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 p-4 rounded-[14px] border text-xs ${syncResult.ok ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-200" : "bg-red-950/20 border-red-500/20 text-red-200"}`}
            >
              {syncResult.ok ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />}
              <span className="leading-relaxed">{syncResult.message}</span>
            </motion.div>
          )}

          {/* Warning if last sync had an issue */}
          {!syncResult && lastLog?.errorMessage && (
            <div className="flex gap-3 p-4 rounded-[14px] border bg-yellow-950/10 border-yellow-500/20 text-yellow-200 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-400" />
              <span className="leading-relaxed">{lastLog.errorMessage}</span>
            </div>
          )}

          {/* Re-sync nudge — shown if data looks stale / no rows ever */}
          {!syncResult && lastLog?.rowsSynced === 0 && (
            <div className="flex gap-3 p-4 rounded-[14px] border bg-blue-950/10 border-blue-500/20 text-blue-200 text-xs">
              <Info className="w-4 h-4 flex-shrink-0 text-blue-400" />
              <span className="leading-relaxed">
                No campaign data has been synced yet. Click <strong>Sync Now</strong> to pull your live ad account data from Windsor.ai. Make sure your ad accounts are connected inside your <a href="https://windsor.ai" target="_blank" rel="noreferrer" className="underline">Windsor.ai dashboard</a> first.
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/[0.03] pt-5">
            <div><span className="block text-[10px] text-neutral-500 uppercase font-light">Connected On</span><span className="text-xs text-neutral-300 mt-1 block font-mono">{formatDateTime(connection?.createdAt || null)}</span></div>
            <div><span className="block text-[10px] text-neutral-500 uppercase font-light">Last Synchronization</span><span className="text-xs text-neutral-300 mt-1 block font-mono">{formatDateTime(connection?.lastSyncAt || null)}</span></div>
            <div><span className="block text-[10px] text-neutral-500 uppercase font-light">Total Rows Synced</span><span className="text-xs text-purple-400 mt-1 block font-medium">{(lastLog?.rowsSynced ?? 0).toLocaleString()} rows</span></div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-8 space-y-6">
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-white">Connect your Windsor.ai account</h3>
            <p className="text-xs text-neutral-400 mt-1.5 font-light leading-relaxed">
              Paste your Windsor.ai API key below to pull real campaign data from Google Ads, Meta Ads, LinkedIn Ads, and more. Get your key from{" "}
              <a href="https://windsor.ai/user-profile" target="_blank" rel="noreferrer" className="text-purple-400 underline">windsor.ai/user-profile</a>.
            </p>
          </div>

          {connectMutation.isError && (
            <div className="flex gap-2 p-4 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-200 text-xs max-w-lg">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{(connectMutation.error as any)?.response?.data?.error || "Failed to connect. Check your API key."}</span>
            </div>
          )}

          <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                <Key className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Windsor.ai API key"
                className="w-full pl-10 pr-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-xs text-white placeholder:text-neutral-600 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={connectMutation.isPending}
              className="px-5 py-2.5 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-95 transition text-xs cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              {connectMutation.isPending ? "Connecting..." : "Connect"}
            </button>
          </form>
        </div>
      )}

      {/* Supported connectors */}
      <div>
        <h3 className="font-medium text-sm text-white mb-4">Supported Connectors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectorsList.map((c) => (
            <div key={c.name} className="glass-card rounded-[20px] p-5 border border-white/5 bg-white/[0.01] flex items-start gap-4">
              <div className="h-9 w-9 rounded-[10px] bg-white/[0.02] border border-white/5 flex items-center justify-center flex-shrink-0 text-neutral-400">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-white">{c.name}</h4>
                  {isConnected && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </div>
                <p className="text-[11px] text-neutral-500 font-light leading-normal">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sync history */}
      {isConnected && connection?.syncLogs && connection.syncLogs.length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-white mb-4">Sync History</h3>
          <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.04] bg-[#020203]/25 text-neutral-400 font-light">
                    <th className="py-3 px-5 font-normal">Timestamp</th>
                    <th className="py-3 px-5 font-normal">Status</th>
                    <th className="py-3 px-5 font-normal text-right">Rows Synced</th>
                    <th className="py-3 px-5 font-normal">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {[...connection.syncLogs].reverse().map((log) => (
                    <tr key={log.id} className="text-neutral-300">
                      <td className="py-3.5 px-5 font-mono text-neutral-400">{formatDateTime(log.timestamp)}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wide ${log.status === "SUCCESS" ? "bg-emerald-950/20 border border-emerald-500/20 text-emerald-400" : "bg-red-950/20 border border-red-500/20 text-red-400"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono">{log.rowsSynced.toLocaleString()}</td>
                      <td className="py-3.5 px-5 text-neutral-500 font-light max-w-[280px]">
                        <span className="line-clamp-2">{log.errorMessage || "Sync completed successfully."}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationsView;
