import React, { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, AlertTriangle, Key, Trash2, RefreshCw, Link2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useConnectWindsor, useDisconnectWindsor, useTriggerSync,
  getGetWindsorConnectionQueryKey,
} from "@workspace/api-client-react";

interface SyncLog { id: string; status: string; errorMessage: string | null; rowsSynced: number; timestamp: string; }

interface IntegrationsViewProps {
  connection: { connected: boolean; syncStatus: string | null; lastSyncAt: string | null; createdAt: string | null; syncLogs: SyncLog[]; } | null;
}

export function IntegrationsView({ connection }: IntegrationsViewProps) {
  const [apiKey, setApiKey] = useState("");
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetWindsorConnectionQueryKey() });

  const connectMutation = useConnectWindsor({ mutation: { onSuccess: invalidate } });
  const disconnectMutation = useDisconnectWindsor({ mutation: { onSuccess: invalidate } });
  const syncMutation = useTriggerSync({ mutation: { onSuccess: invalidate } });

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
    if (!confirm("Are you sure you want to disconnect Windsor.ai?")) return;
    disconnectMutation.mutate();
  };

  const isConnected = connection?.connected;
  const connectorsList = [
    { name: "Google Ads", desc: "Search & Display performance metrics", active: !!isConnected },
    { name: "Meta Ads", desc: "Facebook & Instagram campaign performance", active: !!isConnected },
    { name: "LinkedIn Ads", desc: "B2B audience targeting & conversion tracking", active: !!isConnected },
    { name: "Microsoft Ads", desc: "Bing search Network & display metrics", active: !!isConnected },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {isConnected ? (
        <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-[12px] bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Windsor.ai Data Layer Connected</h3>
                <p className="text-xs text-neutral-400 font-light mt-0.5">Synced status: <span className="font-medium text-emerald-400 uppercase">{connection?.syncStatus}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
                {syncMutation.isPending ? "Syncing..." : "Sync Now"}
              </button>
              <button onClick={handleDisconnect} disabled={disconnectMutation.isPending} className="flex items-center gap-1.5 px-3 py-2 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-300 hover:bg-red-900 hover:text-white transition duration-200 cursor-pointer disabled:opacity-50 text-xs">
                <Trash2 className="w-3.5 h-3.5" />Disconnect
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/[0.03] pt-6">
            <div><span className="block text-[10px] text-neutral-500 uppercase font-light">Connected On</span><span className="text-xs text-neutral-300 mt-1 block font-mono">{formatDateTime(connection?.createdAt || null)}</span></div>
            <div><span className="block text-[10px] text-neutral-500 uppercase font-light">Last Synchronization</span><span className="text-xs text-neutral-300 mt-1 block font-mono">{formatDateTime(connection?.lastSyncAt || null)}</span></div>
            <div><span className="block text-[10px] text-neutral-500 uppercase font-light">Background Frequency</span><span className="text-xs text-neutral-300 mt-1 block font-medium text-purple-400">Every 15 Minutes</span></div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-8 space-y-6">
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-white">No active data connection</h3>
            <p className="text-xs text-neutral-400 mt-1.5 font-light leading-relaxed">PerformanceOS AI requires an active Windsor.ai API key to query and aggregate multi-channel marketing campaigns.</p>
          </div>
          {connectMutation.isError && (
            <div className="flex gap-2 p-4 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-200 text-xs max-w-md">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>Failed to connect. Check your API key.</span>
            </div>
          )}
          <form onSubmit={handleConnect} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><Key className="w-4 h-4" /></span>
              <input type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter Windsor.ai api_key" className="w-full pl-10 pr-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-xs text-white placeholder:text-neutral-600 outline-none" />
            </div>
            <button type="submit" disabled={connectMutation.isPending} className="px-5 py-2.5 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-95 transition text-xs cursor-pointer flex-shrink-0">
              {connectMutation.isPending ? "Connecting..." : "Connect Key"}
            </button>
          </form>
        </div>
      )}

      <div>
        <h3 className="font-medium text-sm text-white mb-4">Supported Connectors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectorsList.map((c) => (
            <div key={c.name} className="glass-card rounded-[20px] p-5 border border-white/5 bg-white/[0.01] flex items-start gap-4">
              <div className="h-9 w-9 rounded-[10px] bg-white/[0.02] border border-white/5 flex items-center justify-center flex-shrink-0 text-neutral-400"><Link2 className="w-4 h-4" /></div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-white">{c.name}</h4>
                  {c.active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </div>
                <p className="text-[11px] text-neutral-500 font-light leading-normal">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isConnected && connection?.syncLogs && connection.syncLogs.length > 0 && (
        <div>
          <h3 className="font-medium text-sm text-white mb-4">Sync History Logs</h3>
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
                  {connection.syncLogs.map((log) => (
                    <tr key={log.id} className="text-neutral-300">
                      <td className="py-3.5 px-5 font-mono text-neutral-400">{formatDateTime(log.timestamp)}</td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium tracking-wide ${log.status === "SUCCESS" ? "bg-emerald-950/20 border border-emerald-500/20 text-emerald-400" : "bg-red-950/20 border border-red-500/20 text-red-400"}`}>{log.status}</span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono">{log.rowsSynced}</td>
                      <td className="py-3.5 px-5 text-neutral-500 font-light truncate max-w-[200px]">{log.errorMessage || "Sync completed successfully."}</td>
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
