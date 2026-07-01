import React from "react";
import { useGetWindsorConnection } from "@workspace/api-client-react";
import { IntegrationsView } from "@/components/dashboard/integrations-view";

export default function IntegrationsPage() {
  const { data: connection, isLoading } = useGetWindsorConnection();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading integrations...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Data Integrations
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Manage your Windsor.ai data connection and connected marketing channels.
        </p>
      </div>
      <IntegrationsView connection={connection as any ?? null} />
    </div>
  );
}
