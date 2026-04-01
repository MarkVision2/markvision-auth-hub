import { lazy, Suspense, StrictMode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/hooks/useAuthReady";
import { AuthProvider } from "@/hooks/useAuth";
import { WorkspaceProvider } from "@/hooks/useWorkspace";
import { RoleProvider } from "@/hooks/useRole";
import { NotificationProvider } from "@/hooks/useNotifications";

// Lazy-loaded pages for code splitting
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardTarget = lazy(() => import("./pages/DashboardTarget"));
const DashboardSales = lazy(() => import("./pages/DashboardSales"));
const DashboardPM = lazy(() => import("./pages/DashboardPM"));
const ContentFactory = lazy(() => import("./pages/ContentFactory"));
const CrmSystem = lazy(() => import("./pages/CrmSystem"));
const AiRopPage = lazy(() => import("./pages/AiRopPage"));
const CompetitorSpy = lazy(() => import("./pages/CompetitorSpy"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const AiReportsPage = lazy(() => import("./pages/AiReportsPage"));
const ScoreboardPage = lazy(() => import("./pages/ScoreboardPage"));
const AgencyBillingPage = lazy(() => import("./pages/AgencyBillingPage"));
const AutopostingPage = lazy(() => import("./pages/AutopostingPage"));
const QualityControlPage = lazy(() => import("./pages/QualityControlPage"));
const RetentionLtvPage = lazy(() => import("./pages/RetentionLtvPage"));
const AiManagerPage = lazy(() => import("./pages/AiManagerPage"));
const DoctorTerminal = lazy(() => import("./pages/DoctorTerminal"));
const SchedulePage = lazy(() => import("./pages/SchedulePage"));
const DiagnosticsDashboardPage = lazy(() => import("./pages/DiagnosticsDashboardPage"));
const AdsManager = lazy(() => import("./pages/AdsManager"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <RoleProvider>
              <WorkspaceProvider>
                <NotificationProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<AuthPage />} />
                      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                      <Route path="/dashboard/target" element={<ProtectedRoute><DashboardTarget /></ProtectedRoute>} />
                      <Route path="/dashboard/sales" element={<ProtectedRoute><DashboardSales /></ProtectedRoute>} />
                      <Route path="/dashboard/pm" element={<ProtectedRoute><DashboardPM /></ProtectedRoute>} />
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
                      <Route path="/quality" element={<ProtectedRoute><QualityControlPage /></ProtectedRoute>} />
                      <Route path="/retention" element={<ProtectedRoute><RetentionLtvPage /></ProtectedRoute>} />
                      <Route path="/admin/ai-manager" element={<ProtectedRoute><AiManagerPage /></ProtectedRoute>} />
                      <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
                      <Route path="/diagnostics" element={<ProtectedRoute><DiagnosticsDashboardPage /></ProtectedRoute>} />
                      <Route path="/doctor/terminal" element={<ProtectedRoute><DoctorTerminal /></ProtectedRoute>} />
                      <Route path="/ads-manager" element={<ProtectedRoute><AdsManager /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </NotificationProvider>
              </WorkspaceProvider>
            </RoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>
);

export default App;
