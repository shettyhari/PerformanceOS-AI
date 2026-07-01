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
import AnalyticsPage from "@/pages/dashboard/analytics";
import AlertsPage from "@/pages/dashboard/alerts";
import IntegrationsPage from "@/pages/dashboard/integrations";
import AthenaPage from "@/pages/dashboard/athena";
import SettingsPage from "@/pages/dashboard/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/dashboard">
        {() => (
          <DashboardLayout>
            <DashboardPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/analytics">
        {() => (
          <DashboardLayout>
            <AnalyticsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/alerts">
        {() => (
          <DashboardLayout>
            <AlertsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/integrations">
        {() => (
          <DashboardLayout>
            <IntegrationsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/athena">
        {() => (
          <DashboardLayout>
            <AthenaPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/dashboard/settings">
        {() => (
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        )}
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
