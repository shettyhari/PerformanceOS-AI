import React from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Megaphone, BarChart3, GitMerge, FileSpreadsheet,
  Sparkles, Bell, Link2, Users, Settings, ChevronLeft, ChevronRight, LogOut
} from "lucide-react";
import { useClerk } from "@clerk/react";
import { useSidebarStore } from "@/store/sidebar-store";

interface SidebarProps {
  user: Partial<{ name: string; email: string; orgName: string; role: string }>;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  isAi?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const menuGroups: NavGroup[] = [
  {
    label: "Analytics",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
      { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
      { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
      { name: "Attribution", href: "/dashboard/attribution", icon: GitMerge },
    ],
  },
  {
    label: "Tools",
    items: [
      { name: "Athena AI", href: "/dashboard/athena", icon: Sparkles, isAi: true },
      { name: "Reports", href: "/dashboard/reports", icon: FileSpreadsheet },
      { name: "CRM", href: "/dashboard/crm", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { name: "Alerts", href: "/dashboard/alerts", icon: Bell },
      { name: "Integrations", href: "/dashboard/integrations", icon: Link2 },
      { name: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebarStore();
  const { signOut } = useClerk();

  const handleLogout = () => {
    signOut({ redirectUrl: "/" });
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location === href || location.startsWith(href + "/");
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 76 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative h-screen bg-[#050508]/65 border-r border-white/[0.04] backdrop-blur-[20px] flex flex-col flex-shrink-0 z-20 text-neutral-400 select-none overflow-hidden"
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.04] flex-shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 outline-none">
          <div className="h-9 w-9 flex-shrink-0 rounded-[10px] bg-gradient-to-tr from-blue-600 via-purple-600 to-red-500 flex items-center justify-center shadow-lg shadow-purple-900/10">
            <span className="font-bold text-sm tracking-tight text-white">P</span>
          </div>
          {!isCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
              <span className="font-medium text-sm tracking-tight text-white leading-tight">PerformanceOS</span>
              <span className="text-[10px] text-neutral-500 font-light leading-tight">AI Marketing Suite</span>
            </motion.div>
          )}
        </Link>
        {!isCollapsed ? (
          <button onClick={toggleSidebar} className="p-1.5 rounded-[8px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:text-white transition duration-200 cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button onClick={toggleSidebar} className="absolute right-2 top-[14px] p-1.5 rounded-[8px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:text-white transition duration-200 cursor-pointer">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden space-y-1">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-2">
            {!isCollapsed && (
              <p className="text-[9px] uppercase tracking-widest text-neutral-600 font-semibold px-3 py-1.5">{group.label}</p>
            )}
            {isCollapsed && <div className="my-1 mx-2 border-t border-white/[0.04]" />}
            {group.items.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href} className="outline-none block">
                  <span className={`flex items-center gap-3 px-3 py-2.5 rounded-[12px] transition duration-200 relative group cursor-pointer ${active ? "bg-white/[0.04] text-white font-medium" : "hover:bg-white/[0.02] hover:text-neutral-200"}`}>
                    {active && (
                      <motion.div layoutId="active-indicator" className="absolute left-0 w-1 h-5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-r-full" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                    )}
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? (item.isAi ? "text-purple-400" : "text-white") : (item.isAi ? "text-purple-500 group-hover:text-purple-400" : "text-neutral-500 group-hover:text-neutral-300")}`} />
                    {!isCollapsed && <span className="text-sm tracking-wide flex-1 truncate">{item.name}</span>}
                    {!isCollapsed && item.isAi && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-[6px] bg-purple-950/40 border border-purple-500/20 text-purple-300 font-medium">AI</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-white/[0.04] flex-shrink-0">
        {!isCollapsed && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-neutral-500 font-light truncate">{user?.email}</p>
          </div>
        )}
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-[12px] text-neutral-500 hover:text-red-400 hover:bg-red-950/10 transition duration-200 cursor-pointer">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs">Sign Out</span>}
        </button>
      </div>
    </motion.div>
  );
}

export default Sidebar;
