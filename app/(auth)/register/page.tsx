"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, User, Briefcase, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
import { signUpUser } from "../../../server/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
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

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("name", name);
    formData.append("organizationName", orgName);

    try {
      const res = await signUpUser(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050508] overflow-hidden text-white font-sans">
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(66,133,244,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(224,81,81,0.12)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />

      <div className="w-full max-w-[500px] p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="glass-card rounded-[24px] p-8 md:p-10 border border-white/5 bg-white/[0.02] backdrop-blur-[24px]"
        >
          {/* Header */}
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="h-12 w-12 rounded-[16px] bg-gradient-to-tr from-blue-600 via-purple-600 to-red-500 flex items-center justify-center shadow-lg shadow-purple-900/20 mb-4">
              <span className="font-display font-bold text-xl tracking-tight text-white">P</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-medium tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
              Create PerformanceOS
            </h1>
            <p className="text-neutral-400 text-sm mt-2 font-light">
              Provision a new AI Command Center workspace
            </p>
          </div>

          {/* Success State */}
          {success && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center p-6 rounded-[16px] bg-emerald-950/20 border border-emerald-500/20 text-emerald-200 mb-6"
            >
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-3 animate-bounce" />
              <h3 className="font-medium text-base mb-1">Workspace Created Successfully!</h3>
              <p className="text-xs text-neutral-400 font-light">Redirecting you to the portal login...</p>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-6 p-4 rounded-[12px] bg-red-950/30 border border-red-500/20 text-red-200 text-xs"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-light">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <User className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-purple-500/40 transition duration-200 text-sm placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-light">Work Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Mail className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@agency.com"
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-purple-500/40 transition duration-200 text-sm placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-light">Organization/Agency Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Briefcase className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Nexus Media Group"
                    className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-purple-500/40 transition duration-200 text-sm placeholder:text-neutral-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-light">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (Min 8 characters)"
                    className="w-full pl-10 pr-10 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-purple-500/40 transition duration-200 text-sm placeholder:text-neutral-600 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[12px] bg-white text-black font-medium hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition duration-200 text-sm shadow-md mt-6 cursor-pointer"
              >
                {loading ? "Creating workspace..." : "Initialize PerformanceOS"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-neutral-500 font-light">
            Already have a workspace?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 transition font-normal">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
