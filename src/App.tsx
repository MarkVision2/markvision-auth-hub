import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/hooks/useAuthReady";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { RoleProvider } from "@/hooks/useRole";
import { NotificationProvider } from "@/hooks/useNotifications";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import DashboardTarget from "./pages/DashboardTarget";
import DashboardSales from "./pages/DashboardSales";
import DashboardPM from "./pages/DashboardPM";
import AgencyAccounts from "./pages/AgencyAccounts";
import ContentFactory from "./pages/ContentFactory";
import CrmSystem from "./pages/CrmSystem";
import AiRopPage from "./pages/AiRopPage";
import CompetitorSpy from "./pages/CompetitorSpy";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import FinancePage from "./pages/FinancePage";
import AiReportsPage from "./pages/AiReportsPage";
import ScoreboardPage from "./pages/ScoreboardPage";
import AgencyBillingPage from "./pages/AgencyBillingPage";
import AutopostingPage from "./pages/AutopostingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RoleProvider>
        <WorkspaceProvider>
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/target" element={<ProtectedRoute><DashboardTarget /></ProtectedRoute>} />
          <Route path="/dashboard/sales" element={<ProtectedRoute><DashboardSales /></ProtectedRoute>} />
          <Route path="/dashboard/pm" element={<ProtectedRoute><DashboardPM /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute><AgencyAccounts /></ProtectedRoute>} />
          <Route path="/content" element={<ProtectedRoute><ContentFactory /></ProtectedRoute>} />
          <Route path="/crm" element={<ProtectedRoute><CrmSystem /></ProtectedRoute>} />
          <Route path="/ai-rop" element={<ProtectedRoute><AiRopPage /></ProtectedRoute>} />
          <Route path="/spy" element={<ProtectedRoute><CompetitorSpy /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
          <Route path="/ai-reports" element={<ProtectedRoute><AiReportsPage /></ProtectedRoute>} />
          <Route path="/scoreboard" element={<ProtectedRoute><ScoreboardPage /></ProtectedRoute>} />
          <Route path="/agency-billing" element={<ProtectedRoute><AgencyBillingPage /></ProtectedRoute>} />
          <Route path="/autoposting" element={<ProtectedRoute><AutopostingPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </WorkspaceProvider>
        </RoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
