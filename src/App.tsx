/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import UsersPage from './pages/UsersPage';
import OrdersPage from './pages/OrdersPage';
import PaymentsPage from './pages/PaymentsPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import { DashboardLayout } from './components/dashboard/Layout';
import { useAuthStore } from './store/authStore';
import { INTERNAL_ALLOWED_ROLES } from './types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: true,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user || !INTERNAL_ALLOWED_ROLES.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
