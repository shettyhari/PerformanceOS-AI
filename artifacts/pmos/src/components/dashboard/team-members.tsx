import React, { useState } from "react";
import { Users, Mail, Plus, X, Crown, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "VIEWER";
  status: "active" | "pending";
  avatar: string;
}

const ROLE_ICONS = { OWNER: Crown, ADMIN: Shield, VIEWER: User };
const ROLE_COLORS = { OWNER: "text-yellow-400 bg-yellow-950/20 border-yellow-500/20", ADMIN: "text-blue-400 bg-blue-950/20 border-blue-500/20", VIEWER: "text-neutral-400 bg-neutral-900 border-white/5" };

const MOCK_MEMBERS: TeamMember[] = [
  { id: "1", name: "You", email: "owner@workspace.com", role: "OWNER", status: "active", avatar: "YO" },
  { id: "2", name: "Sarah Chen", email: "sarah@workspace.com", role: "ADMIN", status: "active", avatar: "SC" },
  { id: "3", name: "James Park", email: "james@workspace.com", role: "VIEWER", status: "pending", avatar: "JP" },
];

export function TeamMembers({ currentUserEmail }: { currentUserEmail?: string }) {
  const [members, setMembers] = useState<TeamMember[]>(
    MOCK_MEMBERS.map((m, i) => i === 0 && currentUserEmail ? { ...m, email: currentUserEmail } : m)
  );
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "VIEWER">("VIEWER");
  const [inviteSent, setInviteSent] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    const initials = inviteEmail.slice(0, 2).toUpperCase();
    setMembers((prev) => [...prev, {
      id: crypto.randomUUID(),
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      status: "pending",
      avatar: initials,
    }]);
    setInviteEmail("");
    setInviteSent(true);
    setTimeout(() => { setInviteSent(false); setShowInvite(false); }, 1500);
  };

  const removeMember = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));

  return (
    <div className="glass-card rounded-[24px] p-6 border border-white/5 bg-white/[0.01] space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Team Members</h3>
          <span className="text-[10px] text-neutral-500 font-light ml-1">({members.length})</span>
        </div>
        <button
          onClick={() => setShowInvite((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-white text-black text-[10px] font-medium hover:bg-neutral-200 transition cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Invite
        </button>
      </div>

      <AnimatePresence>
        {showInvite && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleInvite}
            className="rounded-[14px] bg-white/[0.02] border border-white/5 p-4 space-y-3 overflow-hidden"
          >
            <p className="text-xs text-white font-medium">Invite team member</p>
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none placeholder:text-neutral-600"
            />
            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "VIEWER")}
                className="flex-1 px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-neutral-300 outline-none"
              >
                <option value="VIEWER" className="bg-neutral-900">Viewer — read only</option>
                <option value="ADMIN" className="bg-neutral-900">Admin — full access</option>
              </select>
              <button type="submit" className="px-4 py-2 rounded-[10px] bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition cursor-pointer">
                {inviteSent ? "Sent!" : "Send Invite"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {members.map((member) => {
          const RoleIcon = ROLE_ICONS[member.role];
          return (
            <div key={member.id} className="flex items-center gap-3 p-3 rounded-[14px] bg-white/[0.01] border border-white/[0.03] hover:border-white/5 transition">
              <div className="h-8 w-8 rounded-full bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-300 flex-shrink-0">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{member.name}</p>
                <p className="text-[10px] text-neutral-500 font-light truncate">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {member.status === "pending" && (
                  <span className="text-[9px] text-yellow-400 bg-yellow-950/20 border border-yellow-500/20 px-2 py-0.5 rounded-full font-medium">Pending</span>
                )}
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold ${ROLE_COLORS[member.role]}`}>
                  <RoleIcon className="w-2.5 h-2.5" />
                  {member.role}
                </div>
                {member.role !== "OWNER" && (
                  <button onClick={() => removeMember(member.id)} className="p-1 rounded-[6px] hover:bg-white/[0.04] text-neutral-600 hover:text-red-400 transition cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
