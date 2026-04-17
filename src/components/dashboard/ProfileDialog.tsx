import React, { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ShieldCheck, User as UserIcon, MapPin, Phone, Mail } from 'lucide-react';
import { ROLE_LABELS } from '@/types';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user } = useAuthStore();

  const displayName = useMemo(() => {
    if (!user) return 'Internal User';
    return user.name || [user.firstname, user.lastname].filter(Boolean).join(' ').trim() || 'Internal User';
  }, [user]);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Profil Internal</DialogTitle>
          <DialogDescription>
            Ringkasan akun internal yang sedang login. Edit detail lengkapnya sekarang dipusatkan di halaman settings agar contract backend tetap konsisten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label className="text-gray-500">Wewenang Akun</Label>
              <div className="flex items-center">
                {user.role === 'owner' ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-emerald-700 w-full">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-bold tracking-wide uppercase text-sm">{roleLabel}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-blue-700 w-full">
                    <UserIcon className="w-5 h-5" />
                    <span className="font-bold tracking-wide uppercase text-sm">{roleLabel}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500">Nama</Label>
              <Input value={displayName} className="bg-gray-50 border-gray-100 text-gray-700 font-medium h-11" disabled />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500">Alamat Email</Label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 h-11 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-500">Phone</Label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 h-11 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{user.phone || '-'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-500">Gender</Label>
                <Input value={user.gender === 'male' ? 'Male' : user.gender === 'female' ? 'Female' : '-'} className="bg-gray-50 border-gray-100 text-gray-700 font-medium h-11" disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500">Address</Label>
              <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-600 min-h-[72px]">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span>{user.address || '-'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-semibold"
            >
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
