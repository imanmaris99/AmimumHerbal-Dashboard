import React, { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
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
import { toast } from 'sonner';
import { ShieldCheck, User as UserIcon, Mail, Save, Loader2 } from 'lucide-react';
import { ROLE_LABELS } from '@/types';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, updateUser } = useAuthStore();
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const displayName = useMemo(() => {
    if (!user) return 'Internal User';
    return user.name || [user.firstname, user.lastname].filter(Boolean).join(' ').trim() || 'Internal User';
  }, [user]);

  useEffect(() => {
    if (!open || !user) return;
    setFirstname(user.firstname || '');
    setLastname(user.lastname || '');
    setPhone(user.phone || '');
    setAddress(user.address || '');
  }, [open, user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { fullname: string; firstname: string; lastname: string; phone: string; address: string }) => {
      const response = await api.put('/admin/edit-info', payload);
      return response.data;
    },
    onSuccess: (response: any, payload) => {
      updateUser({
        name: payload.fullname,
        firstname: payload.firstname,
        lastname: payload.lastname,
        phone: payload.phone,
        address: payload.address,
      });
      toast.success(response?.message || 'Profil internal berhasil diperbarui.');
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail?.message || error?.message || 'Gagal memperbarui profil internal.';
      toast.error(message);
    },
  });

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Profil Internal</DialogTitle>
          <DialogDescription>
            Ubah info inti akun internal langsung dari popup. Untuk foto profil dan ganti password, tetap gunakan halaman settings.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-6 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fullname = [firstname, lastname].filter(Boolean).join(' ').trim();
            if (!firstname.trim() || !lastname.trim() || !phone.trim() || !address.trim()) {
              toast.error('Firstname, lastname, phone, dan address wajib diisi.');
              return;
            }
            updateProfileMutation.mutate({
              fullname,
              firstname: firstname.trim(),
              lastname: lastname.trim(),
              phone: phone.trim(),
              address: address.trim(),
            });
          }}
        >
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="profile-firstname" className="text-gray-700">Firstname</Label>
                <Input id="profile-firstname" value={firstname} onChange={(e) => setFirstname(e.target.value)} className="h-11 rounded-xl border-gray-200" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-lastname" className="text-gray-700">Lastname</Label>
                <Input id="profile-lastname" value={lastname} onChange={(e) => setLastname(e.target.value)} className="h-11 rounded-xl border-gray-200" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-500">Alamat Email</Label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 h-11 text-sm text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone" className="text-gray-700">Phone</Label>
              <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 rounded-xl border-gray-200" placeholder="+628..." required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-address" className="text-gray-700">Address</Label>
              <textarea
                id="profile-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="min-h-[92px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full"
                placeholder="Alamat internal atau operasional"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              disabled={updateProfileMutation.isPending}
            >
              {updateProfileMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" />Simpan</>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
