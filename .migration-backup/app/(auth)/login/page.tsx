"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, AlertTriangle, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
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
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      await signIn(provider, { callbackUrl: "/dashboard" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#050508] overflow-hidden text-white font-sans">
      {/* Animated gradient orbs for a premium space/AI look */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(66,133,244,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle,rgba(155,81,224,0.15)_0%,rgba(0,0,0,0)_70%)] pointer-events-none" />
      
      <div className="w-full max-w-[480px] p-6 z-10">
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
              PerformanceOS AI
            </h1>
            <p className="text-neutral-400 text-sm mt-2 font-light">
              One Dashboard. Every Marketing Channel.
            </p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => handleSocialLogin("google")}
              className="flex justify-center items-center py-3 rounded-[12px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] active:bg-white/[0.12] transition duration-250 cursor-pointer"
              title="Sign in with Google"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </button>
            <button
              onClick={() => handleSocialLogin("facebook")}
              className="flex justify-center items-center py-3 rounded-[12px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] active:bg-white/[0.12] transition duration-250 cursor-pointer"
              title="Sign in with Facebook"
            >
              <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button
              onClick={() => handleSocialLogin("linkedin")}
              className="flex justify-center items-center py-3 rounded-[12px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] active:bg-white/[0.12] transition duration-250 cursor-pointer"
              title="Sign in with LinkedIn"
            >
              <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
          </div>

          <div className="relative flex items-center justify-center my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 text-xs uppercase bg-[#050508]/10 text-neutral-500 font-light backdrop-blur-sm">
              Or continue with
            </span>
          </div>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 mb-1.5 font-light">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.com"
                  className="w-full pl-10 pr-4 py-3 rounded-[12px] bg-white/[0.02] border border-white/5 focus:border-purple-500/40 focus:bg-white/[0.04] focus:ring-1 focus:ring-purple-500/40 transition duration-200 text-sm placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-neutral-400 font-light">Password</label>
                <Link href="/forgot" className="text-xs text-purple-400 hover:text-purple-300 font-light transition">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                  <Lock className="w-4.5 h-4.5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              {loading ? "Signing in..." : "Access Dashboard"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-neutral-500 font-light">
            Don't have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 transition font-normal">
              Create a workspace
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
