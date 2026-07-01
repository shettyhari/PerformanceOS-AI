import React from "react";
import { AthenaChat } from "../../../components/dashboard/athena-chat";

export const metadata = {
  title: "Athena AI - PerformanceOS AI",
};

export default function AthenaPage() {
  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Athena AI command
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Ask natural language questions to query campaign metrics, analyze performance shifts, and optimize budgets.
        </p>
      </div>

      <AthenaChat />
    </div>
  );
}
