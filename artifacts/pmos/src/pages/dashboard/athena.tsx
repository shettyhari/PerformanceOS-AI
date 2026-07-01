import React from "react";
import { AthenaChat } from "@/components/dashboard/athena-chat";
import { Sparkles } from "lucide-react";

export default function AthenaPage() {
  return (
    <div className="space-y-4 pb-4 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-purple-400" />
          Athena AI
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Ask questions about your campaign data, get optimization recommendations, and forecast performance.
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <AthenaChat />
      </div>
    </div>
  );
}
