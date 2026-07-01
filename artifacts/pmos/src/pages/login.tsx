import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { login } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (res.error) {
        setError(res.error);
      } else {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        navigate("/dashboard");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050508] overflow-hidden text-white font-sans">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(66,133,244,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.08)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="w-full max-w-[440px] p-6 z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="glass-card rounded-[28px] border border-white/5 p-8 md:p-10">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-start gap-3">
            <div className="h-10 w-10 rounded-[12px] bg-gradient-to-tr from-blue-600 via-purple-600 to-red-500 flex items-center justify-center shadow-lg">
              <span className="font-bold text-sm text-white">P</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Welcome back</h1>
              <p className="text-sm text-neutral-400 font-light mt-1">Sign in to your PerformanceOS workspace</p>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-6 p-4 rounded-[12px] bg-red-950/30 border border-red-500/20 text-red-200 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-light">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><Mail className="w-4 h-4" /></span>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@agency.com" className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-purple-500/40 transition duration-200 text-sm placeholder:text-neutral-600 outline-none" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-neutral-400 font-light">Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500"><Lock className="w-4 h-4" /></span>
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-10 pr-10 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-purple-500/40 transition duration-200 text-sm placeholder:text-neutral-600 outline-none" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition duration-200 text-sm shadow-md mt-6 cursor-pointer">
              {loading ? "Signing in..." : "Access Dashboard"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-neutral-500 font-light">
            Don't have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 transition font-normal">Create a workspace</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
