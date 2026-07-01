import React from "react";
import { useGetAlerts } from "@workspace/api-client-react";
import { AlertsView } from "@/components/dashboard/alerts-view";
import { Bell } from "lucide-react";

export default function AlertsPage() {
  const { data: alerts = [], isLoading } = useGetAlerts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading alerts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Performance Alerts
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          AI-powered anomaly detection across your marketing channels.
        </p>
      </div>
      <AlertsView alerts={alerts as any} />
    </div>
  );
}
