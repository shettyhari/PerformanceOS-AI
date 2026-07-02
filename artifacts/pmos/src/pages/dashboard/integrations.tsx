import React, { useState } from "react";
import { useGetWindsorConnection } from "@workspace/api-client-react";
import { IntegrationsView } from "@/components/dashboard/integrations-view";
import { GoogleAdsMcpPanel } from "@/components/dashboard/google-ads-mcp";
import { Database, Zap } from "lucide-react";

const TABS = [
  { id: "windsor", label: "Windsor.ai", icon: Database },
  { id: "google-ads-mcp", label: "Google Ads MCP", icon: Zap },
] as const;

type Tab = typeof TABS[number]["id"];

export default function IntegrationsPage() {
  const { data: connection, isLoading } = useGetWindsorConnection();
  const [activeTab, setActiveTab] = useState<Tab>("windsor");

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Data Integrations
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Connect your ad platforms to pull live campaign data into PerformanceOS.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-[14px] bg-white/[0.02] border border-white/5 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-xs font-medium transition cursor-pointer outline-none ${activeTab === tab.id ? "bg-white text-black" : "text-neutral-400 hover:text-neutral-200"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Windsor.ai tab */}
      {activeTab === "windsor" && (
        isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center gap-3 text-neutral-400 text-sm">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          </div>
        ) : (
          <IntegrationsView connection={connection as any ?? null} />
        )
      )}

      {/* Google Ads MCP tab */}
      {activeTab === "google-ads-mcp" && <GoogleAdsMcpPanel />}
    </div>
  );
}
