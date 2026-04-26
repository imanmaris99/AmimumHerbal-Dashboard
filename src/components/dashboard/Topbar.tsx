import React, { useMemo, useState } from 'react';
import { Bell, Menu, ShieldCheck, Info, TimerReset, Languages, Check, BookOpenText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS } from '@/types';
import { useUiStore } from '@/store/uiStore';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProfileDialog } from './ProfileDialog';
import { useLocation } from 'react-router-dom';
import { getPageHandbook } from '@/lib/pageHandbook';

export function Topbar() {
  const { user, lastActivityAt } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const handbook = useMemo(() => getPageHandbook(location.pathname), [location.pathname]);

  const displayName = user?.name || user?.email || 'Internal User';
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Internal User';

  const getAvatarUrl = (name: string, gender?: 'male' | 'female') => {
    if (gender === 'female') {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&top=longHair,longHairStraight,longHairCurly,longHairDreads,longHairCurvy,longHairNotTooLong,longHairMiaWallace&facialHairProbability=0`;
    }
    if (gender === 'male') {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&top=shortHairShortFlat,shortHairSides,shortHairTheCaesar,shortHairShortWaved,shortHairShortCurly,shortHairShortRound&facialHairProbability=20&clothing=blazerAndShirt,blazerAndSweater,collarAndSweater,shirtCrewNeck,shirtVNeck`;
    }
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
  };

  return (
    <header className="min-h-16 md:min-h-20 bg-white border-b border-gray-100 px-3 sm:px-4 md:px-6 xl:px-8 py-3 md:py-4 flex items-start md:items-center justify-between sticky top-0 z-10 gap-3 flex-wrap xl:flex-nowrap">
      <div className="flex-1 min-w-0 mr-0 sm:mr-2 md:mr-4 order-2 xl:order-1 basis-full xl:basis-auto max-w-full">
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-left w-full focus:outline-none min-w-0 rounded-md group block">
              <div className="flex items-center gap-1.5 min-w-0">
                <p className="text-sm font-bold md:font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors flex-shrink">
                  <span className="hidden sm:inline">{t('topbar.title')}</span>
                  <span className="sm:hidden">{t('topbar.titleMobile')}</span>
                </p>
                <Info className="w-3.5 h-3.5 text-gray-400 shrink-0 md:hidden group-hover:text-emerald-500 transition-colors" />
              </div>
              <p className="text-xs text-gray-500 mt-1 hidden 2xl:block truncate max-w-[720px]">
                {t('topbar.subtitle')}
              </p>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">{t('topbar.dialog.title')}</DialogTitle>
              <DialogDescription className="pt-3 pb-2 text-gray-600 leading-relaxed text-sm">
                <strong className="text-gray-900 block mb-2 text-base">{t('topbar.title')}</strong>
                {t('topbar.subtitle')}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 shrink-0 order-1 xl:order-2 ml-auto xl:ml-0 max-w-full w-full xl:w-auto justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-transparent text-gray-500 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50" aria-label="Handbook halaman">
              <BookOpenText className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-emerald-900">Handbook: {handbook.title}</DialogTitle>
              <DialogDescription className="pt-2 text-gray-600 text-sm">{handbook.purpose}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-900">Pengguna utama</p>
                <p className="text-gray-600 mt-1">{handbook.primaryUsers}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-900">Cara penggunaan</p>
                <ol className="mt-2 list-decimal pl-5 space-y-1 text-gray-600">
                  {handbook.usageFlow.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>

              {handbook.notes?.length ? (
                <div>
                  <p className="font-semibold text-gray-900">Catatan penting</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1 text-gray-600">
                    {handbook.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full border border-transparent text-gray-500 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50" aria-label={t('topbar.languageSwitch')}>
              <Languages className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl border-gray-100 shadow-lg shadow-gray-200/50">
            <div className="px-3 py-2 text-xs text-gray-500 leading-relaxed">
              {t('topbar.languageIntro')}
            </div>
            <DropdownMenuItem onClick={() => i18n.changeLanguage('id')} className="cursor-pointer flex items-center justify-between gap-3">
              <span>Indonesia (ID)</span>
              {i18n.language === 'id' ? <Check className="w-4 h-4 text-emerald-600" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => i18n.changeLanguage('en')} className="cursor-pointer flex items-center justify-between gap-3">
              <span>English (EN)</span>
              {i18n.language === 'en' ? <Check className="w-4 h-4 text-emerald-600" /> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold">{roleLabel}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="hidden 2xl:inline-flex h-9 w-9 rounded-full border border-transparent text-gray-500 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50">
              <TimerReset className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-xl border-gray-100 shadow-lg shadow-gray-200/50">
            <div className="px-3 py-2 text-xs text-gray-500 leading-relaxed">
              {t('topbar.languageIntro')}
            </div>
            <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
              Sesi aktif terakhir: {lastActivityAt ? new Date(lastActivityAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
            </div>
            <DropdownMenuItem onClick={() => i18n.changeLanguage('id')} className="cursor-pointer flex items-center justify-between gap-3">
              <span>Indonesia (ID)</span>
              {i18n.language === 'id' ? <Check className="w-4 h-4 text-emerald-600" /> : null}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => i18n.changeLanguage('en')} className="cursor-pointer flex items-center justify-between gap-3">
              <span>English (EN)</span>
              {i18n.language === 'en' ? <Check className="w-4 h-4 text-emerald-600" /> : null}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-emerald-500 rounded-full transition-colors shrink-0 h-9 w-9 md:h-10 md:w-10 border border-transparent hover:border-emerald-100 hover:bg-emerald-50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
        </Button>

        <div className="hidden 2xl:block h-8 w-px bg-gray-100 mx-1" />

        <div 
          className="flex items-center gap-2 sm:gap-3 pl-0 xl:pl-2 pr-0 group cursor-pointer min-w-0 max-w-[168px] sm:max-w-[210px] xl:max-w-none"
          onClick={() => setIsProfileOpen(true)}
        >
          <div className="text-right hidden 2xl:block min-w-0 max-w-[180px] xl:max-w-[220px]">
            <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-emerald-600 transition-colors truncate">{displayName}</p>
            <p className="text-xs font-medium text-gray-500 capitalize mt-1">Akun internal</p>
          </div>
          <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-gray-100 ring-2 ring-transparent group-hover:ring-emerald-200 transition-all">
            <AvatarImage src={getAvatarUrl(displayName, user?.gender)} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden shrink-0 h-9 w-9" onClick={toggleSidebar}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </header>
  );
}
