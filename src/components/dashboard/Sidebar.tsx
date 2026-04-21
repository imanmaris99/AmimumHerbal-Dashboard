import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  Boxes,
  Layers3,
  FileText,
  Factory,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RoleGuard } from '../RoleGuard';
import { useAuthStore } from '@/store/authStore';
import { ROLE_LABELS } from '@/types';
import { useUiStore } from '@/store/uiStore';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';

const useSharedNavItems = () => {
  const { t } = useTranslation();
  return useMemo(() => [
    { icon: LayoutDashboard, label: t('sidebar.nav.dashboard'), path: '/overview', description: t('sidebar.nav.dashboardDesc') },
    { icon: ShoppingBag, label: t('sidebar.nav.orders'), path: '/orders', description: t('sidebar.nav.ordersDesc') },
    { icon: CreditCard, label: t('sidebar.nav.payments'), path: '/payments', description: t('sidebar.nav.paymentsDesc') },
    { icon: Boxes, label: t('sidebar.nav.catalog'), path: '/catalog', description: t('sidebar.nav.catalogDesc') },
    { icon: Layers3, label: t('sidebar.nav.variants'), path: '/variants', description: t('sidebar.nav.variantsDesc') },
    { icon: Factory, label: t('sidebar.nav.production'), path: '/productions', description: t('sidebar.nav.productionDesc') },
    { icon: FileText, label: t('sidebar.nav.content'), path: '/content', description: t('sidebar.nav.contentDesc') },
  ], [t]);
};

const useOwnerNavItems = () => {
  const { t } = useTranslation();
  return useMemo(() => [
    { icon: Users, label: t('sidebar.nav.users'), path: '/users', description: t('sidebar.nav.usersDesc') },
    { icon: Settings, label: t('sidebar.nav.settings'), path: '/settings', description: t('sidebar.nav.settingsDesc') },
  ], [t]);
};

function SidebarContent() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { setSidebarOpen } = useUiStore();
  const { t } = useTranslation();
  const sharedNavItems = useSharedNavItems();
  const ownerNavItems = useOwnerNavItems();

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div className="p-6 border-b border-gray-50 shrink-0 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-sm shadow-emerald-100">
            <span className="text-white font-bold text-xl">U</span>
          </div>
          <div>
            <span className="font-bold text-base text-gray-900 tracking-tight block leading-tight">Dashboard Toko Herbal AmImUm</span>
            <span className="text-xs text-gray-500">{t('sidebar.header.subtitle')}</span>
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-gradient-to-br from-emerald-50 via-emerald-50 to-teal-50 border border-emerald-100/80 p-4 shadow-sm shadow-emerald-100/50">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <p className="text-xs font-bold uppercase tracking-wide">{t('sidebar.roleCard.title')}</p>
          </div>
          <p className="mt-2 text-sm font-semibold text-emerald-900">{ROLE_LABELS[user?.role ?? 'admin']}</p>
          <p className="mt-2 text-xs text-emerald-700 leading-relaxed">
            {t('sidebar.roleCard.desc')}
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto bg-white">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">{t('sidebar.group.shared')}</p>
          <div className="space-y-1">
            {sharedNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
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
            <p className="px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 mb-2">{t('sidebar.group.owner')}</p>
            <div className="space-y-1">
              {ownerNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    cn(
                      'flex items-start gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group',
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-100'
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

      <div className="p-4 mt-auto border-t border-gray-50 shrink-0">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">{t('sidebar.logout')}</span>
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isSidebarOpen, setSidebarOpen } = useUiStore();

  return (
    <>
      <aside className="hidden md:flex w-64 xl:w-[272px] bg-white border-r border-gray-100 flex-col h-[100dvh] sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[88vw] max-w-72 flex flex-col h-full bg-white [&>button]:top-5 [&>button]:right-4 border-r-0">
          <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
