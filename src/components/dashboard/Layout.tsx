import React, { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuthStore } from '@/store/authStore';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from 'sonner';

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];

export function DashboardLayout() {
  const { user, isAuthenticated, touchSession, isSessionExpired, logout } = useAuthStore();

  useEffect(() => {
    const syncSession = () => {
      if (isSessionExpired()) {
        logout();
        toast.error('Sesi dashboard berakhir karena tidak ada aktivitas. Silakan login kembali.');
        return;
      }
      touchSession();
    };

    const intervalId = window.setInterval(() => {
      if (isSessionExpired()) {
        logout();
        toast.error('Sesi dashboard berakhir karena tidak ada aktivitas. Silakan login kembali.');
      }
    }, 60_000);

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, syncSession, { passive: true });
    });

    return () => {
      window.clearInterval(intervalId);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, syncSession);
      });
    };
  }, [touchSession, isSessionExpired, logout]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F4F7F6]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        <Topbar />
        <main className="px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 xl:px-8 xl:py-8 flex-1 animate-in fade-in duration-500 overflow-x-hidden max-w-full">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
