import React, { useState } from 'react';
import { Bell, Menu, ShieldCheck, Info } from 'lucide-react';
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

export function Topbar() {
  const { user } = useAuthStore();
  const { toggleSidebar } = useUiStore();
  const { t, i18n } = useTranslation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
    <header className="h-16 md:h-20 bg-white border-b border-gray-100 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 gap-2 sm:gap-4">
      <div className="flex-1 min-w-0 mr-2 sm:mr-4">
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
              <p className="text-xs text-gray-500 mt-1 hidden md:block truncate">
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

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 px-2 text-xs font-semibold text-gray-600 hover:text-emerald-600">
              {i18n.language === 'id' ? 'ID' : 'EN'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 rounded-xl border-gray-100 shadow-lg shadow-gray-200/50">
            <DropdownMenuItem onClick={() => i18n.changeLanguage('id')} className="cursor-pointer">
              Indonesia (ID)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => i18n.changeLanguage('en')} className="cursor-pointer">
              English (EN)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-semibold">{roleLabel}</span>
        </div>

        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-emerald-500 rounded-full transition-colors shrink-0">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
        </Button>

        <div className="h-8 w-px bg-gray-100 mx-1" />

        <div 
          className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2 group cursor-pointer"
          onClick={() => setIsProfileOpen(true)}
        >
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-gray-900 leading-none group-hover:text-emerald-600 transition-colors">{displayName}</p>
            <p className="text-xs font-medium text-gray-500 capitalize mt-1">{roleLabel}</p>
          </div>
          <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-gray-100 ring-2 ring-transparent group-hover:ring-emerald-200 transition-all">
            <AvatarImage src={getAvatarUrl(displayName, user?.gender)} />
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
          <Menu className="w-6 h-6" />
        </Button>
      </div>

      <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </header>
  );
}
