import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2, LockKeyhole, Save, ShieldCheck, Upload, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AdminProfileEditPayload, AdminProfileResponse, ChangePasswordPayload } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [profileForm, setProfileForm] = useState<AdminProfileEditPayload>({
    fullname: '',
    firstname: '',
    lastname: '',
    phone: '',
    address: '',
  });
  const [passwordForm, setPasswordForm] = useState<ChangePasswordPayload>({
    old_password: '',
    new_password: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const profileQuery = useQuery({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const response = await api.get<AdminProfileResponse>('/admin/profile');
      return response.data.data;
    },
    enabled: user?.role === 'owner' || user?.role === 'admin',
  });

  useEffect(() => {
    if (!profileQuery.data) return;

    const firstname = profileQuery.data.firstname || '';
    const lastname = profileQuery.data.lastname || '';
    const fullname = [firstname, lastname].filter(Boolean).join(' ').trim();

    setProfileForm({
      fullname,
      firstname,
      lastname,
      phone: profileQuery.data.phone || '',
      address: profileQuery.data.address || '',
    });

    updateUser({
      name: fullname || user?.name || 'Internal User',
      email: profileQuery.data.email,
      role: profileQuery.data.role,
      isActive: profileQuery.data.is_active,
      gender: profileQuery.data.gender || undefined,
      firstname: profileQuery.data.firstname || undefined,
      lastname: profileQuery.data.lastname || undefined,
      phone: profileQuery.data.phone || undefined,
      address: profileQuery.data.address || undefined,
      photoUrl: profileQuery.data.photo_url || undefined,
    });
  }, [profileQuery.data, updateUser, user?.name]);

  const memberSinceLabel = useMemo(() => {
    if (!profileQuery.data?.created_at) return '-';
    return new Date(profileQuery.data.created_at).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }, [profileQuery.data?.created_at]);

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: AdminProfileEditPayload) => {
      const response = await api.put('/admin/edit-info', payload);
      return response.data;
    },
    onSuccess: () => {
      const displayName = [profileForm.firstname, profileForm.lastname].filter(Boolean).join(' ').trim();
      updateUser({
        name: displayName || user?.name || 'Internal User',
        firstname: profileForm.firstname,
        lastname: profileForm.lastname,
        phone: profileForm.phone,
        address: profileForm.address,
      });
      toast.success('Profil internal berhasil diperbarui.');
      profileQuery.refetch();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail?.message || error?.message || 'Gagal memperbarui profil.';
      toast.error(message);
    },
  });

  const updatePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.put('/admin/edit-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (payload) => {
      const photoUrl = payload?.data?.photo_url;
      updateUser({ photoUrl });
      setPhotoFile(null);
      toast.success('Foto profil berhasil diperbarui.');
      profileQuery.refetch();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail?.message || error?.message || 'Gagal upload foto profil.';
      toast.error(message);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const response = await api.put('/admin/change-password', payload);
      return response.data;
    },
    onSuccess: () => {
      setPasswordForm({ old_password: '', new_password: '' });
      toast.success('Password internal berhasil diganti.');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail?.message || error?.message || 'Gagal mengganti password.';
      toast.error(message);
    },
  });

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Internal Profile Settings</h1>
        <p className="text-gray-500 mt-1">Area profile pribadi internal untuk owner dan admin, agar pengelolaan akun tidak perlu keluar dari dashboard.</p>
      </div>

      {profileQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat data profile internal...
          </CardContent>
        </Card>
      ) : profileQuery.isError ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            Gagal memuat profile internal. Silakan refresh atau login ulang.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 xl:gap-8">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden 2xl:col-span-1">
              <CardContent className="p-5 sm:p-8 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <Badge className="bg-emerald-50 text-emerald-600 border-none">Admin + Owner</Badge>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex flex-col items-center text-center gap-4">
                  {profileQuery.data?.photo_url ? (
                    <div className="h-28 w-28 rounded-3xl border border-gray-100 bg-white p-2 flex items-center justify-center overflow-hidden shadow-sm">
                      <img
                        src={profileQuery.data.photo_url}
                        alt={profileQuery.data.firstname || 'Owner'}
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="h-28 w-28 rounded-3xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
                      <UserCircle2 className="w-12 h-12" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{user?.name || 'Owner'}</h2>
                    <p className="text-sm text-gray-500 break-all">{profileQuery.data?.email}</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>Role</span>
                    <strong className="text-slate-900 uppercase">{profileQuery.data?.role || '-'}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Status</span>
                    <strong className="text-slate-900">{profileQuery.data?.is_active ? 'Active' : 'Inactive'}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Bergabung</span>
                    <strong className="text-slate-900">{memberSinceLabel}</strong>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="photo-upload">Foto profile</Label>
                  <Input id="photo-upload" type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                  <Button
                    type="button"
                    onClick={() => photoFile && updatePhotoMutation.mutate(photoFile)}
                    disabled={!photoFile || updatePhotoMutation.isPending}
                    className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600"
                  >
                    {updatePhotoMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Upload Foto Baru</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="2xl:col-span-2 space-y-8">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Profil pribadi internal</h2>
                    <p className="text-sm text-gray-500 mt-1">Terhubung ke endpoint <strong>PUT /admin/edit-info</strong>.</p>
                  </div>
                </CardHeader>
                <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
                  <form
                    className="space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      updateProfileMutation.mutate(profileForm);
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="firstname">Firstname</Label>
                        <Input id="firstname" value={profileForm.firstname} onChange={(e) => setProfileForm((prev) => ({ ...prev, firstname: e.target.value, fullname: `${e.target.value} ${prev.lastname}`.trim() }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastname">Lastname</Label>
                        <Input id="lastname" value={profileForm.lastname} onChange={(e) => setProfileForm((prev) => ({ ...prev, lastname: e.target.value, fullname: `${prev.firstname} ${e.target.value}`.trim() }))} required />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="fullname">Fullname</Label>
                        <Input id="fullname" value={profileForm.fullname} onChange={(e) => setProfileForm((prev) => ({ ...prev, fullname: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={profileForm.phone} onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="+628..." required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <textarea
                        id="address"
                        value={profileForm.address}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                        className="min-h-[120px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full"
                        placeholder="Alamat operasional atau alamat pribadi owner"
                        required
                      />
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <p className="text-xs text-gray-500">Profil ini memengaruhi data akun internal yang sedang login, bukan data customer/public.</p>
                      <Button type="submit" disabled={updateProfileMutation.isPending} className="rounded-xl bg-slate-900 hover:bg-slate-800 w-full sm:w-auto">
                        {updateProfileMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Menyimpan...</>
                        ) : (
                          <><Save className="w-4 h-4 mr-2" />Simpan Perubahan</>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Ganti password internal</h2>
                    <p className="text-sm text-gray-500 mt-1">Terhubung ke endpoint <strong>PUT /admin/change-password</strong>.</p>
                  </div>
                </CardHeader>
                <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
                  <form
                    className="space-y-5"
                    onSubmit={(e) => {
                      e.preventDefault();
                      changePasswordMutation.mutate(passwordForm);
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="old-password">Password lama</Label>
                        <Input id="old-password" type="password" value={passwordForm.old_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, old_password: e.target.value }))} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Password baru</Label>
                        <Input id="new-password" type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))} required />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
                      Password tetap mengikuti policy backend, jadi harus cukup kuat dan lolos validasi server.
                    </div>

                    <Button type="submit" disabled={changePasswordMutation.isPending} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                      {changePasswordMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Memproses...</>
                      ) : (
                        <><LockKeyhole className="w-4 h-4 mr-2" />Ganti Password</>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
