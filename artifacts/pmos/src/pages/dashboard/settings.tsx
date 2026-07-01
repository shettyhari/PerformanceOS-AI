import React, { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { User, Building, Lock, Shield, Bell, Save } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function SettingsPage() {
  const { data: user } = useGetMe();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Workspace Settings
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Manage your account, organization, and notification preferences.
        </p>
      </div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-white">Profile Information</h3>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-light">Full Name</label>
              <input type="text" defaultValue={(user as any)?.name || ""} className="w-full px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-light">Email Address</label>
              <input type="email" defaultValue={(user as any)?.email || ""} disabled className="w-full px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 text-sm text-neutral-500 outline-none cursor-not-allowed" />
            </div>
          </div>
          <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-white text-black text-xs font-medium hover:bg-neutral-200 active:scale-95 transition cursor-pointer">
            <Save className="w-3.5 h-3.5" />
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </form>
      </motion.div>

      {/* Organization */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Building className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-white">Organization</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-light">Organization Name</label>
            <input type="text" defaultValue={(user as any)?.orgName || ""} disabled className="w-full px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 text-sm text-neutral-500 outline-none cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 font-light">Your Role</label>
            <input type="text" value={(user as any)?.role || ""} disabled className="w-full px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 text-sm text-neutral-500 outline-none cursor-not-allowed" />
          </div>
        </div>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-white">Appearance</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white font-medium">Color Theme</p>
            <p className="text-[11px] text-neutral-500 mt-0.5 font-light">Switch between dark, light, or system preference</p>
          </div>
          <ThemeToggle />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4 text-neutral-400" />
          <h3 className="text-sm font-semibold text-white">Alert Preferences</h3>
        </div>
        {[
          { label: "Critical ROAS drops", desc: "Notify when a campaign falls below 1x ROAS", defaultChecked: true },
          { label: "Performance warnings", desc: "Notify when ROAS is below the 1.5x target", defaultChecked: true },
          { label: "AI Recommendations", desc: "Receive daily optimization suggestions from Athena", defaultChecked: false },
          { label: "Weekly performance digest", desc: "Weekly email summary of your best and worst performers", defaultChecked: false },
        ].map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-white font-medium">{item.label}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5 font-light">{item.desc}</p>
            </div>
            <label className="relative flex-shrink-0 cursor-pointer">
              <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
              <div className="w-9 h-5 rounded-full bg-white/[0.06] border border-white/10 peer-checked:bg-purple-600 peer-checked:border-purple-500 transition-all duration-200 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
