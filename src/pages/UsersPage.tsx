import React, { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Search, Filter, ShieldCheck, User as UserIcon, Users, UserCheck, Shield, UserX, PencilLine } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getStatusStyle, userRoleStyles, userStatusStyles } from '@/lib/dashboard';

type DashboardUserRole = 'owner' | 'admin' | 'customer';

interface AdminUserInfo {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  email: string;
  phone?: string | null;
  role: DashboardUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminUserListResponse {
  status_code: number;
  message: string;
  data: AdminUserInfo[];
  meta?: {
    skip: number;
    limit: number;
    count: number;
  };
}

interface AdminUserStatusResponse {
  status_code: number;
  message: string;
  data: {
    id: string;
    email: string;
    role: DashboardUserRole;
    is_active: boolean;
  };
}

export default function UsersPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusTarget, setStatusTarget] = useState<AdminUserInfo | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminUserInfo | null>(null);
  const queryClient = useQueryClient();

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await api.get<AdminUserListResponse>('/admin/users', {
        params: { limit: 100, skip: 0 },
      });
      return response.data;
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await api.patch<AdminUserStatusResponse>(`/admin/users/${userId}/status`, {
        is_active: isActive,
      });
      return response.data;
    },
    onSuccess: () => {
      // handled per-call so dialog can close only after confirmed success
    },
    onError: (error: any) => {
      const message = error?.response?.data?.detail?.message || 'Failed to update user status.';
      toast.error(message);
    },
  });

  const users = usersResponse?.data ?? [];

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return users;

    return users.filter((u) => {
      const fullName = `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim().toLowerCase();
      return (
        fullName.includes(normalizedSearch) ||
        u.email.toLowerCase().includes(normalizedSearch) ||
        (u.role || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [users, search]);

  const handleToggleStatus = (targetUser: AdminUserInfo) => {
    setStatusTarget(targetUser);
  };

  const confirmToggleStatus = () => {
    if (!statusTarget) return;

    toggleUserStatusMutation.mutate(
      {
        userId: statusTarget.id,
        isActive: !statusTarget.is_active,
      },
      {
        onSuccess: (response) => {
          toast.success(response.message || 'User status updated successfully.');
          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          setStatusTarget(null);
        },
      }
    );
  };

  const handleStartEdit = (targetUser: AdminUserInfo) => {
    navigate(`/users/edit/${targetUser.id}`);
  };

  const ownerCount = filteredUsers.filter((u) => u.role === 'owner').length;
  const adminCount = filteredUsers.filter((u) => u.role === 'admin').length;
  const customerCount = filteredUsers.filter((u) => u.role === 'customer').length;
  const inactiveCount = filteredUsers.filter((u) => !u.is_active).length;

  const summaryCards = [
    {
      label: 'Visible Users',
      value: filteredUsers.length,
      helper: 'User yang tampil di layar sekarang',
      icon: Users,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Owners',
      value: ownerCount,
      helper: 'Akses tertinggi internal',
      icon: Shield,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Admins',
      value: adminCount,
      helper: 'Operasional internal harian',
      icon: UserCheck,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Inactive Accounts',
      value: inactiveCount,
      helper: 'Perlu perhatian owner',
      icon: UserX,
      tone: 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1 mr-2">Area monitoring user untuk admin dan owner. Action sensitif seperti edit user lain dan ubah status customer tetap dibatasi khusus owner.</p>
        </div>
        <Button disabled className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-11 px-4 sm:px-6 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-60 w-full sm:w-auto">
          {user?.role === 'owner' ? 'Owner controls active' : 'Admin monitoring mode'}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${card.tone}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{user?.role === 'owner' ? 'Owner' : 'Admin'}</span>
              </div>
              <p className="text-sm font-medium text-gray-500 mt-4">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 break-words">{card.value}</p>
              <p className="text-[11px] text-gray-400 mt-2">{card.label === 'Admins' ? `${customerCount} customer akun terpantau` : card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
            <div className="flex-1 w-full space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari nama, email, atau role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-24 h-11 bg-gray-50 border-transparent rounded-xl w-full"
                />
                {search ? (
                  <Button type="button" variant="ghost" className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-lg px-3 text-xs text-gray-500 hover:text-gray-700" onClick={() => setSearch('')}>
                    Reset
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-gray-500">
                Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{users.length}</strong> user.
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" disabled className="rounded-xl border-gray-100 flex-1 md:flex-none">
                <Filter className="w-4 h-4 mr-2" />
                {user?.role === 'owner' ? 'Owner policy applied' : 'Admin read policy applied'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-8 overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                <TableHead className="w-[320px] font-bold text-gray-400 text-[10px] uppercase">User Profile</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Role</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Status</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Updated</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    Tidak ada user yang cocok dengan pencarian saat ini. Coba reset search atau gunakan kata kunci lain.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const displayName = `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.email;
                  const canToggleStatus = user?.role === 'owner' && u.role === 'customer';
                  const canEditUser = user?.role === 'owner';

                  return (
                    <TableRow key={u.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${u.role === 'owner' ? 'bg-emerald-100 text-emerald-600' : u.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{displayName}</p>
                            <p className="text-xs text-gray-500 font-medium">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {u.role === 'owner' ? (
                            <div className="flex items-center gap-1.5 text-emerald-600">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold uppercase tracking-wide">Owner</span>
                            </div>
                          ) : (
                            <Badge variant="secondary" className={`border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${getStatusStyle(userRoleStyles, u.role)}`}>
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="w-3 h-3" />
                                <span>{u.role}</span>
                              </div>
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`rounded-lg py-0.5 px-2 font-bold text-[10px] uppercase border-none ${u.is_active ? userStatusStyles.active : userStatusStyles.inactive}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gray-500">
                        {new Date(u.updated_at).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" />}>
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-100 shadow-xl shadow-gray-200/50">
                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">User Actions</div>
                              <DropdownMenuItem className="cursor-pointer font-medium text-slate-700 hover:text-slate-900" onClick={() => setDetailTarget(u)}>
                                <UserIcon className="w-4 h-4 mr-2 text-gray-400" />
                                Lihat Detail User
                              </DropdownMenuItem>
                              <div className="-mx-1 my-1 h-px bg-gray-50" />
                              {canEditUser ? (
                                <DropdownMenuItem className="cursor-pointer font-medium text-slate-700 hover:text-slate-900" onClick={() => handleStartEdit(u)}>
                                  <PencilLine className="w-4 h-4 mr-2" />
                                  Edit User Profile
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="cursor-default text-gray-400">
                                  <PencilLine className="w-4 h-4 mr-2" />
                                  Edit (Owner Only)
                                </DropdownMenuItem>
                              )}
                              {canToggleStatus ? (
                                <DropdownMenuItem
                                  className={`cursor-pointer font-medium ${u.is_active ? 'text-red-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'}`}
                                  onClick={() => handleToggleStatus(u)}
                                  disabled={toggleUserStatusMutation.isPending}
                                >
                                  {u.is_active ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="cursor-default text-gray-400">
                                  Status Protected
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={Boolean(statusTarget)} onOpenChange={(open) => { if (!open && !toggleUserStatusMutation.isPending) setStatusTarget(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{statusTarget?.is_active ? 'Nonaktifkan customer ini?' : 'Aktifkan customer ini?'}</DialogTitle>
            <DialogDescription>
              {statusTarget ? (
                <>
                  Anda akan {statusTarget.is_active ? 'menonaktifkan' : 'mengaktifkan'} akun customer <strong>{`${statusTarget.firstname ?? ''} ${statusTarget.lastname ?? ''}`.trim() || statusTarget.email}</strong>.
                  Tindakan ini khusus owner dan akan langsung memakai endpoint status backend.
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
            <p><strong>Email:</strong> {statusTarget?.email || '-'}</p>
            <p className="mt-1"><strong>Status saat ini:</strong> {statusTarget?.is_active ? 'Active' : 'Inactive'}</p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setStatusTarget(null)} disabled={toggleUserStatusMutation.isPending}>
              Batal
            </Button>
            <Button
              type="button"
              onClick={confirmToggleStatus}
              disabled={toggleUserStatusMutation.isPending}
              className={statusTarget?.is_active ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {toggleUserStatusMutation.isPending ? 'Menyimpan...' : statusTarget?.is_active ? 'Ya, nonaktifkan' : 'Ya, aktifkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailTarget)} onOpenChange={(open) => { if (!open) setDetailTarget(null); }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
            <DialogDescription>
              Informasi lengkap profil pengguna ini.
            </DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${detailTarget.role === 'owner' ? 'bg-emerald-100 text-emerald-600' : detailTarget.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                  {(`${detailTarget.firstname ?? ''} ${detailTarget.lastname ?? ''}`.trim() || detailTarget.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{`${detailTarget.firstname ?? ''} ${detailTarget.lastname ?? ''}`.trim() || detailTarget.email}</h3>
                  <p className="text-sm text-gray-500">{detailTarget.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
                <div>
                  <p className="text-gray-500 mb-1">Role</p>
                  <Badge variant="secondary" className="uppercase font-bold text-[10px] border-none">{detailTarget.role}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Status</p>
                  <Badge variant="secondary" className={`uppercase font-bold text-[10px] border-none ${detailTarget.is_active ? userStatusStyles.active : userStatusStyles.inactive}`}>{detailTarget.is_active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Firstname</p>
                  <p className="font-medium text-gray-900">{detailTarget.firstname || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Lastname</p>
                  <p className="font-medium text-gray-900">{detailTarget.lastname || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{detailTarget.phone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">Terakhir Diupdate</p>
                  <p className="font-medium text-gray-900">{new Date(detailTarget.updated_at).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDetailTarget(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-8">
        <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-5 sm:p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-lg font-bold">Batas tanggung jawab internal</h3>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Admin dan owner sama-sama bisa memonitor daftar user dan membaca data customer untuk kebutuhan operasional. Khusus owner, action edit user lain dan kontrol status customer tetap aktif, sementara role internal tetap dijaga terpisah agar otoritas tidak tercampur.
          </p>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 border-emerald-100 overflow-hidden p-5 sm:p-8">
          <h3 className="text-lg font-bold text-emerald-900">Matrix alignment</h3>
          <p className="text-emerald-700 text-sm mt-2 leading-relaxed">
            Halaman ini mengikuti policy terbaru: admin dan owner boleh memonitor data customer, tetapi patch/edit user lain dan kontrol status customer tetap khusus owner.
          </p>
          <p className="mt-2 text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
            Source: GET /admin/users + GET /admin/users/:id + PUT /admin/users/:id + PATCH /admin/users/:id/status
          </p>
        </Card>
      </div>
    </div>
  );
}
