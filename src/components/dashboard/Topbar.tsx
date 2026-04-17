import React from 'react';
import { Bell, Menu, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/types';

export function Topbar() {
  const { user } = useAuthStore();

  const displayName = user?.name || user?.email || 'Internal User';
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Internal User';

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10 gap-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">Dashboard Internal Toko Herbal Amimum</p>
        <p className="text-xs text-gray-500 mt-1">
          Area ini mengikuti matrix akses internal: shared internal untuk admin dan owner, owner-only untuk aksi sensitif.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-2 text-orange-700">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold">{roleLabel}</span>
        </div>

        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-orange-500 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
        </Button>

        <div className="h-8 w-px bg-gray-100 mx-1" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-none">{displayName}</p>
            <p className="text-xs font-medium text-gray-500 capitalize mt-1">{roleLabel}</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-gray-100 ring-2 ring-transparent hover:ring-orange-200 transition-all cursor-pointer">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </header>
  );
}
