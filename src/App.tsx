/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import * as React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { DashboardLayout } from './components/dashboard/Layout';
import { useAuthStore } from './store/authStore';
import { INTERNAL_ALLOWED_ROLES } from './types';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const OverviewPage = React.lazy(() => import('./pages/OverviewPage'));
const UsersPage = React.lazy(() => import('./pages/UsersPage'));
const UserEditPage = React.lazy(() => import('./pages/UserEditPage'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = React.lazy(() => import('./pages/OrderDetailPage'));
const PaymentsPage = React.lazy(() => import('./pages/PaymentsPage'));
const PaymentDetailPage = React.lazy(() => import('./pages/PaymentDetailPage'));
const CatalogPage = React.lazy(() => import('./pages/CatalogPage'));
const ProductEditPage = React.lazy(() => import('./pages/ProductEditPage'));
const VariantsPage = React.lazy(() => import('./pages/VariantsPage'));
const ContentPage = React.lazy(() => import('./pages/ContentPage'));
const ContentEditPage = React.lazy(() => import('./pages/ContentEditPage'));
const ProductionPage = React.lazy(() => import('./pages/ProductionPage'));
const ProductionEditPage = React.lazy(() => import('./pages/ProductionEditPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const HelpPage = React.lazy(() => import('./pages/HelpPage'));

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
    <>
      <Router>
        <React.Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] text-sm font-medium text-gray-500">
              Loading dashboard...
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/payments/:paymentId" element={<PaymentDetailPage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/catalog/edit/:productId" element={<ProductEditPage />} />
              <Route path="/variants" element={<VariantsPage />} />
              <Route path="/content" element={<ContentPage />} />
              <Route path="/content/edit/:articleId" element={<ContentEditPage />} />
              <Route path="/productions" element={<ProductionPage />} />
              <Route path="/productions/edit/:productionId" element={<ProductionEditPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/edit/:userId" element={<UserEditPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/help" element={<HelpPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
