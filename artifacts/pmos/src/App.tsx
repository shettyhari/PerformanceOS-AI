import React, { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/pages/dashboard/layout";
import DashboardPage from "@/pages/dashboard/index";
import CampaignsPage from "@/pages/dashboard/campaigns";
import AnalyticsPage from "@/pages/dashboard/analytics";
import AttributionPage from "@/pages/dashboard/attribution";
import ReportsPage from "@/pages/dashboard/reports";
import AthenaPage from "@/pages/dashboard/athena";
import AlertsPage from "@/pages/dashboard/alerts";
import IntegrationsPage from "@/pages/dashboard/integrations";
import CRMPage from "@/pages/dashboard/crm";
import SettingsPage from "@/pages/dashboard/settings";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30 * 1000 } },
});

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  baseTheme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#a855f7",
    colorForeground: "#f5f5f5",
    colorMutedForeground: "#737373",
    colorDanger: "#ef4444",
    colorBackground: "#09090b",
    colorInput: "#ffffff08",
    colorInputForeground: "#f5f5f5",
    colorNeutral: "#27272a",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#09090b] border border-white/[0.06] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-semibold",
    headerSubtitle: "text-neutral-400",
    socialButtonsBlockButtonText: "text-neutral-300",
    formFieldLabel: "text-neutral-300",
    footerActionLink: "text-purple-400 hover:text-purple-300",
    footerActionText: "text-neutral-500",
    dividerText: "text-neutral-600",
    identityPreviewEditButton: "text-purple-400",
    formFieldSuccessText: "text-emerald-400",
    alertText: "text-neutral-300",
    logoBox: "flex justify-center py-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] text-neutral-200",
    formButtonPrimary: "bg-purple-600 hover:bg-purple-500 text-white",
    formFieldInput: "bg-white/[0.02] border-white/[0.06] text-white",
    footerAction: "text-neutral-500",
    dividerLine: "bg-white/[0.06]",
    alert: "bg-white/[0.02] border-white/[0.06]",
    otpCodeFieldInput: "bg-white/[0.02] border-white/[0.06] text-white",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        appearance={clerkAppearance}
      />
    </div>
  );
}

function ClerkQueryInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

function DashboardRoute({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function AppRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Welcome back", subtitle: "Sign in to your PerformanceOS workspace" } },
        signUp: { start: { title: "Create your workspace", subtitle: "Start tracking your ad performance today" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/login">
              {() => <Redirect to="/sign-in" />}
            </Route>
            <Route path="/register">
              {() => <Redirect to="/sign-up" />}
            </Route>
            <Route path="/dashboard">
              {() => <DashboardRoute><DashboardPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/campaigns">
              {() => <DashboardRoute><CampaignsPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/analytics">
              {() => <DashboardRoute><AnalyticsPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/attribution">
              {() => <DashboardRoute><AttributionPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/reports">
              {() => <DashboardRoute><ReportsPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/athena">
              {() => <DashboardRoute><AthenaPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/alerts">
              {() => <DashboardRoute><AlertsPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/integrations">
              {() => <DashboardRoute><IntegrationsPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/crm">
              {() => <DashboardRoute><CRMPage /></DashboardRoute>}
            </Route>
            <Route path="/dashboard/settings">
              {() => <DashboardRoute><SettingsPage /></DashboardRoute>}
            </Route>
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <WouterRouter base={basePath}>
        <AppRoutes />
      </WouterRouter>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
