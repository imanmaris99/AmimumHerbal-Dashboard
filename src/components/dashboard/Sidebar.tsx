import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleGuard } from '../RoleGuard';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS } from '@/types';

const sharedNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/overview', description: 'Ringkasan operasional internal' },
  { icon: ShoppingBag, label: 'Orders', path: '/orders', description: 'Pantau dan review order customer' },
  { icon: CreditCard, label: 'Payments', path: '/payments', description: 'Monitor transaksi pembayaran' },
  { icon: Boxes, label: 'Catalog Management', path: '/catalog', description: 'Submit product baru dan pantau struktur katalog' },
];

const ownerNavItems = [
  { icon: Users, label: 'User Management', path: '/users', description: 'Kelola akun internal dan customer' },
  { icon: Settings, label: 'Settings', path: '/settings', description: 'Area owner-only untuk pengaturan sensitif' },
];

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  return (
    <aside className="w-72 bg-white border-r border-gray-100 flex flex-col h-full sticky top-0 overflow-y-auto shrink-0">
      <div className="p-6 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-sm shadow-orange-100">
            <span className="text-white font-bold text-xl">U</span>
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900 tracking-tight block">AmImUm</span>
            <span className="text-xs text-gray-500">Internal Dashboard</span>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-orange-50 border border-orange-100 p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <ShieldCheck className="w-4 h-4" />
            <p className="text-xs font-bold uppercase tracking-wide">Internal Access Layer</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-orange-900">{ROLE_LABELS[user?.role ?? 'admin']}</p>
          <p className="mt-1 text-xs text-orange-700 leading-relaxed">
            Admin dapat mengakses overview, orders, dan payments. Owner mendapat tambahan akses user management dan area sensitif.
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">Shared Internal</p>
          <div className="space-y-1">
            {sharedNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-start gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group',
                    isActive
                      ? 'bg-orange-50 text-orange-600 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  )
                }
              >
                <item.icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium leading-none">{item.label}</p>
                  <p className="text-[11px] mt-1 opacity-80">{item.description}</p>
                </div>
              </NavLink>
            ))}
          </div>
        </div>

        <RoleGuard allowedRoles={['owner']}>
          <div>
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">Owner Only</p>
            <div className="space-y-1">
              {ownerNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-start gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group',
                      isActive
                        ? 'bg-orange-50 text-orange-600 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    )
                  }
                >
                  <item.icon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium leading-none">{item.label}</p>
                    <p className="text-[11px] mt-1 opacity-80">{item.description}</p>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </RoleGuard>
      </nav>

      <div className="p-4 mt-auto border-t border-gray-50">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
