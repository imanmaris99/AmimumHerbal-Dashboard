import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '@/store/authStore';
import { Navigate, Outlet } from 'react-router-dom';

export function DashboardLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        <Topbar />
        <main className="px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 xl:px-8 xl:py-8 flex-1 animate-in fade-in duration-500 overflow-x-hidden max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
