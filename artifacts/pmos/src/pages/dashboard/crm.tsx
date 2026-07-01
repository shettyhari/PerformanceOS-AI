import React, { useState } from "react";
import { useGetWindsorConnection } from "@workspace/api-client-react";
import { OnboardingPanel } from "@/components/dashboard/onboarding";
import { Users, PlusCircle, X, Building, Phone, Mail, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const stages = ["New Leads", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"];

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  source: string;
  stage: string;
  value: number;
}

const defaultLeads: Lead[] = [
  { id: "1", name: "Sarah Johnson", company: "TechCorp Inc.", email: "sarah@techcorp.com", source: "Google Ads", stage: "Qualified", value: 12000 },
  { id: "2", name: "Mark Davis", company: "Growth Agency", email: "mark@growthco.com", source: "Meta Ads", stage: "Contacted", value: 8500 },
  { id: "3", name: "Priya Patel", company: "SaaS Platform", email: "priya@saasplatform.io", source: "LinkedIn Ads", stage: "Proposal Sent", value: 24000 },
  { id: "4", name: "Tom Wilson", company: "E-Commerce Brand", email: "tom@ecobrand.com", source: "Google Ads", stage: "New Leads", value: 5000 },
  { id: "5", name: "Lisa Chen", company: "Digital Media Co.", email: "lisa@dmedia.com", source: "Meta Ads", stage: "Won", value: 18000 },
];

export default function CRMPage() {
  const { data: connection, isLoading } = useGetWindsorConnection();
  const [leads, setLeads] = useState<Lead[]>(defaultLeads);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", company: "", email: "", source: "Google Ads", value: "" });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading CRM...
        </div>
      </div>
    );
  }

  if (!connection || !(connection as any).connected) return <OnboardingPanel />;

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.name || !newLead.company) return;
    setLeads((prev) => [...prev, {
      id: crypto.randomUUID(),
      name: newLead.name,
      company: newLead.company,
      email: newLead.email,
      source: newLead.source,
      stage: "New Leads",
      value: Number(newLead.value) || 0,
    }]);
    setNewLead({ name: "", company: "", email: "", source: "Google Ads", value: "" });
    setShowAddModal(false);
  };

  const moveLead = (leadId: string, newStage: string) => {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stage: newStage } : l));
  };

  const formatValue = (val: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            CRM Leads Pipeline
          </h1>
          <p className="text-neutral-400 text-sm mt-1.5 font-light">
            Track customer acquisition lifecycles, and attribute lead sources to active campaigns.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-95 transition text-xs cursor-pointer flex-shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Add Lead
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage);
          const totalValue = stageLeads.reduce((s, l) => s + l.value, 0);
          return (
            <div key={stage} className="glass-card rounded-[20px] p-4 border border-white/5 bg-[#020203]/25 flex flex-col min-h-[320px]">
              <div className="flex justify-between items-center mb-3 flex-shrink-0">
                <span className="text-[11px] font-semibold text-white tracking-wide">{stage}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-500 font-medium">{stageLeads.length}</span>
              </div>
              {totalValue > 0 && (
                <p className="text-[10px] text-emerald-400 font-medium mb-2">{formatValue(totalValue)}</p>
              )}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {stageLeads.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center border border-dashed border-white/[0.04] rounded-[14px] p-4 text-center min-h-[120px]">
                    <Users className="w-5 h-5 text-neutral-700 mb-2" />
                    <span className="text-[10px] text-neutral-600 font-light">No leads</span>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div key={lead.id} className="p-3 rounded-[12px] bg-white/[0.02] border border-white/5 space-y-1.5 cursor-pointer hover:bg-white/[0.04] transition">
                      <p className="text-[11px] font-semibold text-white">{lead.name}</p>
                      <p className="text-[10px] text-neutral-400 flex items-center gap-1"><Building className="w-3 h-3" />{lead.company}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-950/30 border border-blue-500/20 text-blue-400">{lead.source}</span>
                        <span className="text-[9px] text-emerald-400 font-medium">{formatValue(lead.value)}</span>
                      </div>
                      <select
                        value={lead.stage}
                        onChange={(e) => moveLead(lead.id, e.target.value)}
                        className="w-full text-[9px] bg-white/[0.02] border border-white/5 rounded-[6px] px-1.5 py-1 text-neutral-400 outline-none cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {stages.map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card rounded-[24px] border border-white/5 bg-[#09090b] p-8 w-full max-w-[440px] shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-semibold text-white">Add New Lead</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 rounded-[8px] hover:bg-white/[0.06] text-neutral-500 hover:text-white transition cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleAddLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1.5 font-light">Full Name *</label>
                    <input type="text" required value={newLead.name} onChange={(e) => setNewLead((p) => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" className="w-full px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none placeholder:text-neutral-600" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1.5 font-light">Company *</label>
                    <input type="text" required value={newLead.company} onChange={(e) => setNewLead((p) => ({ ...p, company: e.target.value }))} placeholder="Acme Inc." className="w-full px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none placeholder:text-neutral-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 mb-1.5 font-light">Email</label>
                  <input type="email" value={newLead.email} onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))} placeholder="jane@acme.com" className="w-full px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none placeholder:text-neutral-600" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1.5 font-light">Lead Source</label>
                    <select value={newLead.source} onChange={(e) => setNewLead((p) => ({ ...p, source: e.target.value }))} className="w-full px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-neutral-300 outline-none">
                      {["Google Ads", "Meta Ads", "LinkedIn Ads", "Microsoft Ads", "Organic", "Referral"].map((s) => <option key={s} value={s} className="bg-neutral-900">{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1.5 font-light">Deal Value (USD)</label>
                    <input type="number" value={newLead.value} onChange={(e) => setNewLead((p) => ({ ...p, value: e.target.value }))} placeholder="10000" className="w-full px-3 py-2 rounded-[10px] bg-white/[0.02] border border-white/5 text-xs text-white outline-none placeholder:text-neutral-600" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 rounded-[10px] bg-white/[0.03] border border-white/5 text-xs text-neutral-400 hover:text-white transition cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-[10px] bg-white text-black text-xs font-medium hover:bg-neutral-200 transition cursor-pointer">Add Lead</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
