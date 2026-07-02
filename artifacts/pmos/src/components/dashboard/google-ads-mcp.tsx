import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Link2, CheckCircle2, XCircle, RefreshCw, Search,
  ChevronDown, ChevronRight, Terminal, Info, Users, ExternalLink, Trash2
} from "lucide-react";
import { useGoogleAdsMcp } from "@/store/googleAdsMcp";

const BASE = import.meta.env.BASE_URL ?? "/";
const API = `${BASE}api`.replace(/\/+/g, "/");

const SAMPLE_QUERIES = [
  { label: "Top spending campaigns (30d)", query: "SELECT campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE segments.date DURING LAST_30_DAYS ORDER BY metrics.cost_micros DESC LIMIT 10" },
  { label: "Active campaigns with ROAS", query: "SELECT campaign.name, campaign.status, metrics.cost_micros, metrics.conversions_value FROM campaign WHERE campaign.status = 'ENABLED' AND segments.date DURING LAST_30_DAYS ORDER BY metrics.conversions_value DESC LIMIT 20" },
  { label: "Ad groups performance", query: "SELECT ad_group.name, campaign.name, metrics.cost_micros, metrics.clicks, metrics.conversions FROM ad_group WHERE segments.date DURING LAST_7_DAYS ORDER BY metrics.cost_micros DESC LIMIT 15" },
  { label: "Keywords top performers", query: "SELECT ad_group_criterion.keyword.text, metrics.cost_micros, metrics.clicks, metrics.conversions FROM keyword_view WHERE segments.date DURING LAST_30_DAYS AND metrics.impressions > 0 ORDER BY metrics.conversions DESC LIMIT 20" },
  { label: "Weekly spend by device", query: "SELECT segments.device, metrics.cost_micros, metrics.clicks, metrics.conversions FROM campaign WHERE segments.date DURING LAST_7_DAYS" },
];

function microsToDollars(micros: number) {
  return (micros / 1_000_000).toFixed(2);
}

async function callMcpProxy(mcpUrl: string, toolName: string, args: Record<string, any>) {
  const res = await fetch(`${API}/integrations/google-ads-mcp/proxy`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mcpUrl, toolName, args }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function GoogleAdsMcpPanel() {
  const { mcpUrl, customerId, connected, availableCustomers, setMcpUrl, setCustomerId, setConnected, setAvailableCustomers, disconnect } = useGoogleAdsMcp();

  const [urlInput, setUrlInput] = useState(mcpUrl);
  const [customerInput, setCustomerInput] = useState(customerId);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");

  const [queryText, setQueryText] = useState(SAMPLE_QUERIES[0].query);
  const [queryRunning, setQueryRunning] = useState(false);
  const [queryError, setQueryError] = useState("");
  const [queryResults, setQueryResults] = useState<any[] | null>(null);

  const [showGuide, setShowGuide] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnectError("");
    if (!urlInput.trim()) return;
    setConnecting(true);
    try {
      const data = await callMcpProxy(urlInput.trim(), "list_accessible_customers", {});
      const customers: { id: string; name: string }[] = (data.result ?? data).map((c: any) => ({
        id: String(c.customer_id ?? c.id ?? c),
        name: c.descriptive_name ?? c.name ?? `Account ${c.customer_id ?? c.id ?? c}`,
      }));
      setMcpUrl(urlInput.trim());
      setAvailableCustomers(customers);
      if (!customerInput && customers.length > 0) setCustomerInput(customers[0].id);
      setConnected(true);
    } catch (err: any) {
      setConnectError(err.message || "Failed to connect. Check the MCP server URL.");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (!confirm("Disconnect Google Ads MCP server?")) return;
    disconnect();
    setUrlInput("");
    setCustomerInput("");
    setQueryResults(null);
  };

  const handleQuery = async () => {
    if (!queryText.trim() || !customerId) return;
    setQueryError("");
    setQueryResults(null);
    setQueryRunning(true);
    try {
      const data = await callMcpProxy(mcpUrl, "search", {
        customer_id: customerId.replace(/-/g, ""),
        query: queryText.trim(),
      });
      const rows = data.result ?? data.results ?? data ?? [];
      setQueryResults(Array.isArray(rows) ? rows : [rows]);
    } catch (err: any) {
      setQueryError(err.message || "Query failed");
    } finally {
      setQueryRunning(false);
    }
  };

  const handleSaveCustomer = () => {
    setCustomerId(customerInput);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-[12px] flex items-center justify-center border ${connected ? "bg-blue-950/40 border-blue-500/20 text-blue-400" : "bg-white/[0.02] border-white/5 text-neutral-400"}`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Google Ads MCP Server
                {connected && <span className="text-[10px] text-blue-400 bg-blue-950/20 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">Connected</span>}
              </h3>
              <p className="text-xs text-neutral-400 font-light mt-0.5">
                Query your live Google Ads campaigns using natural language via Model Context Protocol
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGuide(s => !s)}
            className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition cursor-pointer"
          >
            <Info className="w-3.5 h-3.5" />
            Setup guide
            {showGuide ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </div>

        {/* Setup guide */}
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-[16px] bg-white/[0.02] border border-white/5 p-5 space-y-4 text-xs text-neutral-400">
                <p className="text-white font-semibold text-sm">How to deploy your Google Ads MCP server</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="h-5 w-5 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">1</span>
                    <div>
                      <p className="text-white font-medium">Get credentials from Google Ads Developer Console</p>
                      <p className="text-neutral-500 mt-0.5 font-light">You need a Developer Token, Google Cloud Project ID, and OAuth2 Client ID + Secret.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="h-5 w-5 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">2</span>
                    <div>
                      <p className="text-white font-medium">Build & deploy to Google Cloud Run</p>
                      <div className="mt-1.5 rounded-[10px] bg-black/40 border border-white/[0.04] p-3 font-mono text-[10px] text-neutral-300 space-y-1">
                        <p className="text-neutral-500"># Build the Docker image</p>
                        <p>gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT/mcp-servers/google-ads-mcp:latest .</p>
                        <p className="text-neutral-500 mt-2"># Deploy to Cloud Run</p>
                        <p>gcloud run deploy google-ads-mcp \</p>
                        <p>&nbsp;&nbsp;--image us-central1-docker.pkg.dev/YOUR_PROJECT/mcp-servers/google-ads-mcp:latest \</p>
                        <p>&nbsp;&nbsp;--set-env-vars="GOOGLE_ADS_DEVELOPER_TOKEN=...,FASTMCP_HOST=0.0.0.0" \</p>
                        <p>&nbsp;&nbsp;--allow-unauthenticated</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="h-5 w-5 rounded-full bg-purple-950/40 border border-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">3</span>
                    <div>
                      <p className="text-white font-medium">Paste your Cloud Run URL below</p>
                      <p className="text-neutral-500 mt-0.5 font-light">Format: <span className="font-mono text-neutral-300">https://your-service.a.run.app</span></p>
                    </div>
                  </div>
                </div>
                <a
                  href="https://github.com/googleads/google-ads-mcp"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View google-ads-mcp on GitHub
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connect form */}
        {!connected ? (
          <form onSubmit={handleConnect} className="space-y-3 max-w-xl">
            {connectError && (
              <div className="flex gap-2 p-3 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-200 text-xs">
                <XCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                {connectError}
              </div>
            )}
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1.5 font-light">MCP Server URL (Cloud Run)</label>
              <input
                type="url"
                required
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://google-ads-mcp-xxxx-uc.a.run.app"
                className="w-full px-3 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-blue-500/40 text-xs text-white placeholder:text-neutral-600 outline-none font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              {connecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              {connecting ? "Connecting..." : "Connect MCP Server"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-[14px] bg-blue-950/10 border border-blue-500/10">
              <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white font-medium">MCP Server Connected</p>
                <p className="text-[10px] text-neutral-500 font-mono truncate mt-0.5">{mcpUrl}</p>
              </div>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-red-950/20 border border-red-500/20 text-red-300 text-[10px] hover:bg-red-900/30 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Disconnect
              </button>
            </div>

            {/* Customer selector */}
            {availableCustomers.length > 0 && (
              <div className="flex items-end gap-3 max-w-xl">
                <div className="flex-1">
                  <label className="block text-[11px] text-neutral-400 mb-1.5 font-light flex items-center gap-1">
                    <Users className="w-3 h-3" /> Ad Account (Customer ID)
                  </label>
                  <select
                    value={customerInput}
                    onChange={(e) => setCustomerInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-[12px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none"
                  >
                    {availableCustomers.map((c) => (
                      <option key={c.id} value={c.id} className="bg-neutral-900">{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleSaveCustomer}
                  className="px-4 py-2 rounded-[12px] bg-white text-black text-xs font-medium hover:bg-neutral-200 transition cursor-pointer flex-shrink-0"
                >
                  Use Account
                </button>
              </div>
            )}
            {customerId && (
              <p className="text-[11px] text-emerald-400 font-light">
                ✓ Querying customer ID: <span className="font-mono">{customerId}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* GAQL Query panel — only shown when connected */}
      {connected && customerId && (
        <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">GAQL Query Console</h3>
            <span className="ml-auto text-[10px] text-neutral-500">Google Ads Query Language</span>
          </div>

          {/* Sample query picker */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1.5 font-light">Quick Templates</label>
            <select
              onChange={(e) => { if (e.target.value) setQueryText(e.target.value); }}
              className="w-full px-3 py-2 rounded-[12px] bg-white/[0.02] border border-white/5 text-xs text-neutral-300 outline-none"
            >
              <option value="">— pick a template —</option>
              {SAMPLE_QUERIES.map((q) => (
                <option key={q.label} value={q.query} className="bg-neutral-900">{q.label}</option>
              ))}
            </select>
          </div>

          {/* Query textarea */}
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1.5 font-light">GAQL Query</label>
            <textarea
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-[14px] bg-black/30 border border-white/5 focus:border-blue-500/30 text-xs text-neutral-200 placeholder:text-neutral-600 outline-none font-mono resize-none"
              placeholder="SELECT campaign.name, metrics.cost_micros FROM campaign WHERE ..."
            />
          </div>

          <button
            onClick={handleQuery}
            disabled={queryRunning || !queryText.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            {queryRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            {queryRunning ? "Running query..." : "Run Query"}
          </button>

          {queryError && (
            <div className="flex gap-2 p-3 rounded-[12px] bg-red-950/20 border border-red-500/20 text-red-200 text-xs">
              <XCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              {queryError}
            </div>
          )}

          {/* Results table */}
          {queryResults && queryResults.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <p className="text-[11px] text-emerald-400 font-light">{queryResults.length} row{queryResults.length !== 1 ? "s" : ""} returned</p>
              <div className="overflow-x-auto rounded-[16px] border border-white/5 bg-white/[0.01]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] bg-black/20">
                      {Object.keys(queryResults[0]).map((col) => (
                        <th key={col} className="py-2.5 px-4 text-neutral-400 font-normal whitespace-nowrap">
                          {col.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {queryResults.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="text-neutral-300 hover:bg-white/[0.01]">
                        {Object.entries(row).map(([key, val]) => {
                          const strVal = String(val ?? "—");
                          const isMicros = key.includes("micros");
                          const display = isMicros ? `$${microsToDollars(Number(val))}` : strVal;
                          return (
                            <td key={key} className="py-2.5 px-4 font-mono whitespace-nowrap">
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {queryResults.length > 50 && (
                  <p className="text-[10px] text-neutral-500 px-4 py-2 border-t border-white/[0.04]">Showing first 50 of {queryResults.length} rows</p>
                )}
              </div>
            </motion.div>
          )}

          {queryResults && queryResults.length === 0 && (
            <p className="text-xs text-neutral-500 font-light">Query returned 0 rows. Try adjusting your date range or filters.</p>
          )}
        </div>
      )}
    </div>
  );
}
