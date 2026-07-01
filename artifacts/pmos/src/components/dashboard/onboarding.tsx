import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Key, Sparkles, RefreshCw, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

export function OnboardingPanel() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/integrations/windsor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to connect");
      } else {
        setStep(2);
      }
    } catch {
      setError("Failed to connect to Windsor.ai. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setLoading(true);
    setError(null);
    setSyncLogs((p) => [...p, "Contacting Windsor.ai...", "Fetching ad campaign records..."]);

    try {
      const res = await fetch("/api/integrations/windsor/sync", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Sync failed");
        setSyncLogs((p) => [...p, `Sync failed: ${data.error}`]);
      } else {
        setSyncLogs((p) => [
          ...p,
          "Successfully fetched campaign metrics.",
          `Synchronized ${data.rowsSynced} daily metric records.`,
          "Finalizing database indices...",
        ]);
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err: any) {
      setError(err.message || "Sync failed");
      setSyncLogs((p) => [...p, "Fatal error occurred during synchronization."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-10 px-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-purple-600/5 blur-[80px] pointer-events-none" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="glass-card w-full max-w-[620px] rounded-[24px] border border-white/5 bg-white/[0.01] backdrop-blur-[24px] p-8 md:p-10 shadow-2xl relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <span className={`h-2 rounded-full transition-all duration-300 ${step === 1 ? "w-8 bg-blue-500" : "w-2 bg-neutral-700"}`} />
          <span className={`h-2 rounded-full transition-all duration-300 ${step === 2 ? "w-8 bg-purple-500" : "w-2 bg-neutral-700"}`} />
        </div>

        {step === 1 ? (
          <div>
            <div className="mb-8">
              <div className="h-10 w-10 rounded-[12px] bg-blue-950/40 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Connect your Windsor.ai Data Layer</h2>
              <p className="text-sm text-neutral-400 mt-2 font-light leading-relaxed">
                PerformanceOS AI uses Windsor.ai as its primary data synchronization layer. Connect your key to aggregate Google Ads, Meta Ads, LinkedIn Ads, and GA4 campaigns into a single unified analytics model.
              </p>
            </div>
            {error && (
              <div className="flex gap-2 p-4 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-200 text-xs mb-6">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleConnect} className="space-y-5">
              <div>
                <label className="block text-xs text-neutral-400 mb-2 font-light">Windsor.ai API Key</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input type="password" required value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter api_key (e.g. 5d5a7b8c...)" className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-blue-500/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-blue-500/40 transition duration-200 text-sm placeholder:text-neutral-600 outline-none text-white" />
                </div>
                <span className="block text-[11px] text-neutral-500 mt-2 font-light">You can find your API key inside the Windsor.ai Dashboard under the "API" tab.</span>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-[0.98] transition duration-200 text-sm disabled:opacity-50 cursor-pointer">
                {loading ? "Validating key..." : "Connect Data Layer"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="mb-8">
              <div className="h-10 w-10 rounded-[12px] bg-purple-950/40 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Run Initial Data Synchronization</h2>
              <p className="text-sm text-neutral-400 mt-2 font-light leading-relaxed">
                Your Windsor.ai connection is verified. We will now fetch the last 30 days of campaign performance data across all connected marketing channels.
              </p>
            </div>
            {error && (
              <div className="flex gap-2 p-4 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-200 text-xs mb-6">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}
            {syncLogs.length > 0 && (
              <div className="p-4 rounded-[12px] bg-black/40 border border-white/5 font-mono text-[11px] text-neutral-400 space-y-1.5 mb-6 max-h-[160px] overflow-y-auto">
                {syncLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-purple-400 flex-shrink-0" />
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleSync} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] bg-purple-600 hover:bg-purple-500 text-white font-medium active:scale-[0.98] transition duration-200 text-sm disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-900/10">
              {loading ? <><RefreshCw className="w-4 h-4 animate-spin" />Synchronizing Database...</> : <>Start Synchronization<ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
