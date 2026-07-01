import { redirect } from "next/navigation";
import { auth } from "../../auth";
import { Sidebar } from "../../components/shared/sidebar";
import { Navbar } from "../../components/shared/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = {
    name: session.user?.name,
    email: session.user?.email,
    role: session.role || "OWNER",
  };

  const orgName = session.orgName || "Workspace";
  const role = session.role || "OWNER";

  return (
    <div className="flex h-screen w-screen bg-[#050508] overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar user={user} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <Navbar orgName={orgName} role={role} />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#07070a] p-6 relative">
          {/* Decorative background gradients for Gemini-like look */}
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
