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
import { DashboardLayout } from './components/dashboard/Layout';
import { useAuthStore } from './store/authStore';

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
  if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
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
            <Route path="/orders" element={<div className="p-8 text-center text-gray-500">Orders Management (Under Construction)</div>} />
            <Route path="/payments" element={<div className="p-8 text-center text-gray-500">Payments Tracking (Under Construction)</div>} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/settings" element={<div className="p-8 text-center text-gray-500">Global Settings (Under Construction)</div>} />
            <Route path="/help" element={<div className="p-8 text-center text-gray-500">Help & Support (Under Construction)</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
