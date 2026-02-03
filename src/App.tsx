import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import AnalyticsPage from "./pages/AnalyticsPage";
import SleepPage from "./pages/SleepPage";
import MindPage from "./pages/MindPage";
import UnifiedJournalPage from "./pages/UnifiedJournalPage";
import VitalsPage from "./pages/VitalsPage";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const queryClient = new QueryClient();

// Wrapper component for pages that use DashboardLayout
const WithDashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <DashboardLayout>{children}</DashboardLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Dashboard Pages with Layout */}
          <Route path="/dashboard" element={<WithDashboardLayout><Dashboard /></WithDashboardLayout>} />
          <Route path="/vitals" element={<WithDashboardLayout><VitalsPage /></WithDashboardLayout>} />
          <Route path="/sleep" element={<WithDashboardLayout><SleepPage /></WithDashboardLayout>} />
          <Route path="/journal" element={<WithDashboardLayout><UnifiedJournalPage /></WithDashboardLayout>} />
          <Route path="/insights" element={<WithDashboardLayout><AnalyticsPage /></WithDashboardLayout>} />
          <Route path="/mind" element={<WithDashboardLayout><MindPage /></WithDashboardLayout>} />
          <Route path="/settings" element={<WithDashboardLayout><Dashboard /></WithDashboardLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
