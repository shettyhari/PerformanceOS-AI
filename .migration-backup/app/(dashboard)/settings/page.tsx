import React from "react";
import { getWindsorConnection } from "../../../server/actions/windsor";
import { OnboardingPanel } from "../../../components/dashboard/onboarding";
import { auth } from "../../../auth";
import { Settings, Users, Key, Globe, Shield, UserPlus } from "lucide-react";

export const metadata = {
  title: "Settings - PerformanceOS AI",
};

export default async function SettingsPage() {
  const session = await auth();
  const res = await getWindsorConnection();

  if (res.error || !res.connection) {
    return <OnboardingPanel />;
  }

  const teamMembers = [
    { name: session?.user?.name || "User", email: session?.user?.email || "", role: session?.role || "OWNER" },
  ];

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
          Workspace Settings
        </h1>
        <p className="text-neutral-400 text-sm mt-1.5 font-light">
          Manage organization profiles, team members access policies, and api connections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Workspace Info Card */}
        <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-6 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs uppercase tracking-wider text-purple-400 font-semibold font-display">General Configurations</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-light">Organization Name</label>
              <input
                type="text"
                disabled
                value={session?.orgName || ""}
                className="w-full px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 text-xs text-neutral-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-light">Slug URL ID</label>
              <input
                type="text"
                disabled
                value={session?.orgSlug || ""}
                className="w-full px-4 py-2.5 rounded-[12px] bg-white/[0.02] border border-white/5 text-xs text-neutral-500 font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="glass-card rounded-[24px] border border-white/5 bg-white/[0.01] p-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs uppercase tracking-wider text-purple-400 font-semibold font-display">Team Members</h3>
            </div>
            <button className="text-neutral-500 hover:text-white transition cursor-pointer" title="Invite User">
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.email} className="p-3 rounded-[12px] bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs">
                <div className="truncate">
                  <h4 className="font-semibold text-white truncate">{member.name}</h4>
                  <p className="text-[10px] text-neutral-500 truncate mt-0.5">{member.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[8px] text-neutral-400 font-bold uppercase flex-shrink-0">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
