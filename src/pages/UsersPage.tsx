import React, { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Search, Filter, ShieldCheck, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import api from '@/lib/api';

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

const roleBadgeMap: Record<DashboardUserRole, string> = {
  owner: 'bg-orange-50 text-orange-600',
  admin: 'bg-blue-50 text-blue-600',
  customer: 'bg-gray-100 text-gray-600',
};

export default function UsersPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  if (user?.role !== 'owner') {
    toast.error('Access denied. Owner permissions required.');
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
    onSuccess: (response) => {
      toast.success(response.message || 'User status updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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
    toggleUserStatusMutation.mutate({
      userId: targetUser.id,
      isActive: !targetUser.is_active,
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1 mr-2">Owner-only user visibility and account status control.</p>
        </div>
        <Button disabled className="bg-orange-500 hover:bg-orange-600 rounded-xl h-11 px-6 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-60">
          Owner-only controls active
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" disabled className="rounded-xl border-gray-100 flex-1 md:flex-none">
                <Filter className="w-4 h-4 mr-2" />
                Filters (next batch)
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-8">
          <Table>
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
                    No users matched the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const displayName = `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim() || u.email;
                  const canToggleStatus = u.role === 'customer';

                  return (
                    <TableRow key={u.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${u.role === 'owner' ? 'bg-orange-100 text-orange-600' : u.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
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
                            <div className="flex items-center gap-1.5 text-orange-600">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold uppercase tracking-wide">Owner</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <UserIcon className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold uppercase tracking-wide">{u.role}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`rounded-lg py-0.5 px-2 font-bold text-[10px] uppercase border-none ${u.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-gray-500">
                        {new Date(u.updated_at).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-100 shadow-xl shadow-gray-200/50">
                            <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="cursor-default">Email: {u.email}</DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-50" />
                            {canToggleStatus ? (
                              <DropdownMenuItem
                                className={`cursor-pointer font-medium ${u.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}
                                onClick={() => handleToggleStatus(u)}
                                disabled={toggleUserStatusMutation.isPending}
                              >
                                {u.is_active ? 'Deactivate Account' : 'Activate Account'}
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem className="cursor-default text-gray-400">
                                Internal role status is protected
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-lg font-bold">Owner-only user control</h3>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Customer account status can be managed here. Internal admin/owner accounts remain protected from generic status actions.
          </p>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-orange-50 border-orange-100 overflow-hidden p-8">
          <h3 className="text-lg font-bold text-orange-900">Live data mode</h3>
          <p className="text-orange-700 text-sm mt-2 leading-relaxed">
            This page is already connected to the backend live endpoint and follows the owner-only action policy agreed for the dashboard.
          </p>
          <p className="mt-2 text-[10px] font-bold text-orange-800 uppercase tracking-wider">
            Source: GET /admin/users + PATCH /admin/users/:id/status
          </p>
        </Card>
      </div>
    </div>
  );
}
