
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Web3Provider } from "@/contexts/Web3Context";

import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// User Pages
import Dashboard from "./pages/user/Dashboard";
import PropertiesIndex from "./pages/user/PropertiesIndex";
import PropertyNew from "./pages/user/PropertyNew";
import PropertyDetail from "./pages/user/PropertyDetail";
import LoansIndex from "./pages/user/LoansIndex";
import LoanNew from "./pages/user/LoanNew";
import LoanDetail from "./pages/user/LoanDetail";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProperties from "./pages/admin/AdminProperties";
import AdminPropertyDetail from "./pages/admin/AdminPropertyDetail";
import AdminLoans from "./pages/admin/AdminLoans";
import AdminLoanDetail from "./pages/admin/AdminLoanDetail";

// Protected Route Component
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    {/* Public Routes */}
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />

    {/* User Routes */}
    <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/properties"
      element={
        <ProtectedRoute>
          <PropertiesIndex />
        </ProtectedRoute>
      }
    />
    <Route
      path="/properties/new"
      element={
        <ProtectedRoute>
          <PropertyNew />
        </ProtectedRoute>
      }
    />
    <Route
      path="/properties/:id"
      element={
        <ProtectedRoute>
          <PropertyDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/loans"
      element={
        <ProtectedRoute>
          <LoansIndex />
        </ProtectedRoute>
      }
    />
    <Route
      path="/loans/new"
      element={
        <ProtectedRoute>
          <LoanNew />
        </ProtectedRoute>
      }
    />
    <Route
      path="/loans/:id"
      element={
        <ProtectedRoute>
          <LoanDetail />
        </ProtectedRoute>
      }
    />

    {/* Admin Routes */}
    <Route
      path="/admin/dashboard"
      element={
        <ProtectedRoute adminOnly>
          <AdminDashboard />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/properties"
      element={
        <ProtectedRoute adminOnly>
          <AdminProperties />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/properties/:id"
      element={
        <ProtectedRoute adminOnly>
          <AdminPropertyDetail />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/loans"
      element={
        <ProtectedRoute adminOnly>
          <AdminLoans />
        </ProtectedRoute>
      }
    />
    <Route
      path="/admin/loans/:id"
      element={
        <ProtectedRoute adminOnly>
          <AdminLoanDetail />
        </ProtectedRoute>
      }
    />

    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Web3Provider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </Web3Provider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
