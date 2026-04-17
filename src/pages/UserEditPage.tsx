import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, Shield, User as UserIcon, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { AdminProfileEditPayload } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getStatusStyle, userRoleStyles, userStatusStyles } from '@/lib/dashboard';

type DashboardUserRole = 'owner' | 'admin' | 'customer';

interface AdminUserInfo {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: DashboardUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminUserDetailResponse {
  status_code: number;
  message: string;
  data: AdminUserInfo;
}

export default function UserEditPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useParams<{ userId: string }>();

  const [form, setForm] = useState<AdminProfileEditPayload>({
    fullname: '',
    firstname: '',
    lastname: '',
    phone: '',
    address: '',
  });

  if (user?.role !== 'owner') {
    return <Navigate to="/overview" replace />;
  }

  const userDetailQuery = useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: async () => {
      const response = await api.get<AdminUserDetailResponse>(`/admin/users/${userId}`);
      return response.data.data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userDetailQuery.data) return;

    const firstname = userDetailQuery.data.firstname ?? '';
    const lastname = userDetailQuery.data.lastname ?? '';

    setForm({
      fullname: `${firstname} ${lastname}`.trim(),
      firstname,
      lastname,
      phone: userDetailQuery.data.phone ?? '',
      address: userDetailQuery.data.address ?? '',
    });
  }, [userDetailQuery.data]);

  const updateUserMutation = useMutation({
    mutationFn: async (payload: AdminProfileEditPayload) => {
      const response = await api.put(`/admin/users/${userId}`, payload);
      return response.data;
    },
    onSuccess: (response) => {
      toast.success(response?.message || 'User profile updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', userId] });
      navigate('/users');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail?.message || 'Failed to update user profile.';
      toast.error(message);
    },
  });

  const roleSummaryIcon = useMemo(() => {
    const role = userDetailQuery.data?.role;
    if (role === 'owner') return Shield;
    if (role === 'admin') return UserCheck;
    return UserIcon;
  }, [userDetailQuery.data?.role]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const firstname = form.firstname.trim();
    const lastname = form.lastname.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const fullname = form.fullname.trim() || `${firstname} ${lastname}`.trim();

    if (!firstname || !lastname || !phone || !address) {
      toast.error('Firstname, lastname, phone, dan address wajib diisi.');
      return;
    }

    updateUserMutation.mutate({
      fullname,
      firstname,
      lastname,
      phone,
      address,
    });
  };

  const SummaryIcon = roleSummaryIcon;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button type="button" variant="outline" className="rounded-xl border-gray-200" onClick={() => navigate('/users')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Users
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit User Profile</h1>
          <p className="text-gray-500 mt-1">Halaman edit khusus owner agar CTA edit langsung menuju form penuh yang lebih fokus dan rapi.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl w-fit">Owner-only edit page</Badge>
      </div>

      {userDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat detail user...
          </CardContent>
        </Card>
      ) : userDetailQuery.isError || !userDetailQuery.data ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            Gagal memuat data user. Silakan kembali ke halaman users dan coba lagi.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-[0.8fr_1.2fr] gap-6 xl:gap-8 items-start">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className={`p-3 rounded-2xl ${getStatusStyle(userRoleStyles, userDetailQuery.data.role)}`}>
                  <SummaryIcon className="w-5 h-5" />
                </div>
                <Badge variant="secondary" className={`rounded-lg py-0.5 px-2 font-bold text-[10px] uppercase border-none ${userDetailQuery.data.is_active ? userStatusStyles.active : userStatusStyles.inactive}`}>
                  {userDetailQuery.data.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 break-words">{`${userDetailQuery.data.firstname ?? ''} ${userDetailQuery.data.lastname ?? ''}`.trim() || userDetailQuery.data.email}</h2>
                <p className="text-sm text-gray-500 break-all mt-1">{userDetailQuery.data.email}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Role</span>
                  <strong className="text-slate-900 uppercase">{userDetailQuery.data.role}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Status</span>
                  <strong className="text-slate-900">{userDetailQuery.data.is_active ? 'Active' : 'Inactive'}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Updated</span>
                  <strong className="text-slate-900 text-right">{new Date(userDetailQuery.data.updated_at).toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
                Halaman ini khusus untuk edit data profil user. Perubahan role dan kontrol status sensitif tetap dipisah agar otoritas tidak tercampur.
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Form edit user</h2>
                <p className="text-sm text-gray-500 mt-1">Terhubung ke endpoint <strong>PUT /admin/users/{'{user_id}'}</strong>.</p>
              </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-8">
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="edit-user-firstname-page">Firstname</Label>
                    <Input id="edit-user-firstname-page" value={form.firstname} onChange={(e) => setForm((prev) => ({ ...prev, firstname: e.target.value, fullname: `${e.target.value} ${prev.lastname}`.trim() }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-user-lastname-page">Lastname</Label>
                    <Input id="edit-user-lastname-page" value={form.lastname} onChange={(e) => setForm((prev) => ({ ...prev, lastname: e.target.value, fullname: `${prev.firstname} ${e.target.value}`.trim() }))} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="edit-user-fullname-page">Fullname</Label>
                    <Input id="edit-user-fullname-page" value={form.fullname} onChange={(e) => setForm((prev) => ({ ...prev, fullname: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-user-phone-page">Phone</Label>
                    <Input id="edit-user-phone-page" value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-user-email-page">Email</Label>
                  <Input id="edit-user-email-page" value={userDetailQuery.data.email} disabled className="bg-gray-50 border-gray-100 text-gray-500" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-user-address-page">Address</Label>
                  <textarea
                    id="edit-user-address-page"
                    value={form.address}
                    onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="min-h-[140px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full"
                    placeholder="Alamat user"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-gray-500">Setelah simpan berhasil, halaman akan kembali ke daftar user.</p>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                    <Button type="button" variant="ghost" className="rounded-xl w-full sm:w-auto" onClick={() => navigate('/users')}>
                      Batal
                    </Button>
                    <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto" disabled={updateUserMutation.isPending}>
                      {updateUserMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                      ) : (
                        <><Save className="w-4 h-4 mr-2" />Save Changes</>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
