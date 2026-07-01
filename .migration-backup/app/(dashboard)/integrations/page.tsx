import React from "react";
import { getWindsorConnection } from "../../../server/actions/windsor";
import { IntegrationsView } from "../../../components/dashboard/integrations-view";

export const metadata = {
  title: "Integrations - PerformanceOS AI",
};

export default async function IntegrationsPage() {
  const res = await getWindsorConnection();

  const connection = res.success && res.connection ? res.connection : null;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Platform Integrations
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Manage your marketing API connections and verify background synchronizer logs.
        </p>
      </div>

      <IntegrationsView connection={connection} />
    </div>
  );
}
