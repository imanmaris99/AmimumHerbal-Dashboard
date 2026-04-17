import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Topbar() {
  const { user } = useAuthStore();

  return (
    <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
          <Input 
            placeholder="Search here..." 
            className="pl-10 h-10 bg-gray-50 border-transparent focus-visible:ring-orange-500 transition-all rounded-xl w-64 md:w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative text-gray-500 hover:text-orange-500 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white" />
        </Button>

        <div className="h-8 w-px bg-gray-100 mx-2" />

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-none">{user?.name}</p>
            <p className="text-xs font-medium text-gray-500 capitalize mt-1">{user?.role}</p>
          </div>
          <Avatar className="h-10 w-10 border-2 border-gray-100 ring-2 ring-transparent hover:ring-orange-200 transition-all cursor-pointer">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
            <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-6 h-6" />
        </Button>
      </div>
    </header>
  );
}
