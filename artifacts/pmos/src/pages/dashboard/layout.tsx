import React from "react";
import { Redirect } from "wouter";
import { useUser } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();
  const { data: user, isLoading: isMeLoading } = useGetMe();

  if (!isLoaded || isMeLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400 text-sm">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Redirect to="/sign-in" />;
  }

  return (
    <div className="flex h-screen w-screen bg-[#050508] overflow-hidden font-sans">
      <Sidebar user={user as any || {}} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Navbar orgName={(user as any)?.orgName || "Workspace"} role={(user as any)?.role || "OWNER"} />
        <main className="flex-1 overflow-y-auto bg-[#07070a] p-6 relative">
          <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />
          <div className="max-w-[1600px] mx-auto w-full relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
