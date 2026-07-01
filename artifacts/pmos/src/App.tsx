import React from "react";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
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
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function DashboardRoute({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
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
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
