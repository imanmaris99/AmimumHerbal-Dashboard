import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  CreditCard, 
  Users, 
  Settings, 
  LogOut,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleGuard } from '../RoleGuard';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/overview' },
  { icon: ShoppingBag, label: 'Orders', path: '/orders' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
];

export function Sidebar() {
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full sticky top-0 overflow-y-auto shrink-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
          <span className="text-white font-bold text-xl">U</span>
        </div>
        <span className="font-bold text-xl text-gray-900 tracking-tight">AmImUm</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-orange-50 text-orange-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}

        <RoleGuard allowedRoles={['owner']}>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-orange-50 text-orange-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">User Management</span>
          </NavLink>
        </RoleGuard>
      </nav>

      <div className="p-4 mt-auto border-t border-gray-50 space-y-1">
         <NavLink
            to="/help"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-orange-50 text-orange-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <HelpCircle className="w-5 h-5" />
            <span className="font-medium">Help Desk</span>
          </NavLink>
          
        <RoleGuard allowedRoles={['owner']}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-orange-50 text-orange-600 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </NavLink>
        </RoleGuard>

        <button 
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200 group mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
