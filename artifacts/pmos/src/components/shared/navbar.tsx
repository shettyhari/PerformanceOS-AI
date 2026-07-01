import React, { useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { RefreshCw, CheckCircle2, Shield, ChevronDown, Building, User } from "lucide-react";
import { motion } from "framer-motion";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";

interface NavbarProps {
  orgName: string;
  role: string;
  userName?: string;
}

export function Navbar({ orgName, role, userName }: NavbarProps) {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>("Synced 10m ago");

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setLastSynced("Synced just now");
    }, 2000);
  };

  const displayName = userName && userName !== "User" ? userName : null;
  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : null;

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/[0.04] bg-[#050508]/40 backdrop-blur-[12px] z-10 flex-shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[12px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition duration-200 cursor-pointer">
          <Building className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white tracking-wide">{orgName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-medium tracking-wider uppercase">
          <Shield className="w-3 h-3 text-blue-400" />
          {role}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DateRangePicker />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-neutral-500 hidden md:inline font-light">{lastSynced}</span>
          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 hover:text-white transition active:scale-95 disabled:opacity-50 text-xs font-medium text-neutral-400 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-purple-400" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </button>
        </div>
        <div className="h-4 w-px bg-white/[0.04]" />
        <ThemeToggle />
        <div className="h-9 w-9 rounded-[12px] bg-white/[0.02] border border-white/5 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer" title="Windsor.ai Data Layer: Healthy">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>

        {displayName ? (
          <div className="flex items-center gap-2 pl-1">
            <div className="h-8 w-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-[10px] font-bold text-purple-300 flex-shrink-0">
              {initials}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-medium text-white leading-tight">{displayName}</p>
              <p className="text-[10px] text-neutral-500 leading-tight font-light">{role}</p>
            </div>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-white/[0.04] border border-white/5 flex items-center justify-center text-neutral-400">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
