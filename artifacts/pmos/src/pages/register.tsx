import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, User, Briefcase, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { register } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await register(email, password, name, orgName);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050508] overflow-hidden text-white font-sans py-8">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(66,133,244,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(224,81,81,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="w-full max-w-[500px] p-6 z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="glass-card rounded-[28px] border border-white/5 p-8 md:p-10">
          <div className="mb-8 flex flex-col items-start gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-gradient-to-tr from-blue-600 via-purple-600 to-red-500 flex items-center justify-center shadow-lg">
              <span className="font-bold text-sm text-white">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Create your workspace</h1>
              <p className="text-sm text-neutral-400 font-light mt-1">Set up PerformanceOS AI for your organization</p>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-6 p-4 rounded-[12px] bg-red-950/30 border border-red-500/20 text-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-6 p-4 rounded-[12px] bg-emerald-950/30 border border-emerald-500/20 text-emerald-200 text-xs">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>Workspace created! Redirecting to dashboard...</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-light">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500"><User className="w-4 h-4" /></span>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" className="w-full pl-9 pr-3 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-sm placeholder:text-neutral-600 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-light">Organization</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500"><Briefcase className="w-4 h-4" /></span>
                  <input type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Agency" className="w-full pl-9 pr-3 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-sm placeholder:text-neutral-600 outline-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-light">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><Mail className="w-4 h-4" /></span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@agency.com" className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-sm placeholder:text-neutral-600 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-light">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><Lock className="w-4 h-4" /></span>
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} className="w-full pl-10 pr-10 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 text-sm placeholder:text-neutral-600 outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading || success} className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition duration-200 text-sm shadow-md mt-6 cursor-pointer">
              {loading ? "Creating workspace..." : "Create Workspace"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-neutral-500 font-light">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition font-normal">Sign in</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
