import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Search, UserPlus, Filter, ShieldCheck, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';

const mockUsers = [
  { id: '1', name: 'Main Owner', email: 'owner@amimum.com', role: 'owner', isActive: true },
  { id: '2', name: 'Junaidi Admin', email: 'junaidi@amimum.com', role: 'admin', isActive: true },
  { id: '3', name: 'Susi Admin', email: 'susi@amimum.com', role: 'admin', isActive: false },
  { id: '4', name: 'Budi Support', email: 'budi@amimum.com', role: 'admin', isActive: true },
];

export default function UsersPage() {
  const { user } = useAuthStore();

  if (user?.role !== 'owner') {
    toast.error('Access denied. Owner permissions required.');
    return <Navigate to="/overview" replace />;
  }

  const handleToggleStatus = (userName: string) => {
    toast.success(`Status for ${userName} updated successfully.`);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-1 mr-2">Manage team accounts, roles, and platform permissions.</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl h-11 px-6 shadow-lg shadow-orange-100 transition-all active:scale-95">
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" className="rounded-xl border-gray-100 flex-1 md:flex-none">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-8">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                <TableHead className="w-[300px] font-bold text-gray-400 text-[10px] uppercase">User Profile</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Role</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Status</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Last Active</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((u) => (
                <TableRow key={u.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${u.id === '1' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{u.name}</p>
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
                           <User className="w-3.5 h-3.5" />
                           <span className="text-xs font-bold uppercase tracking-wide">Admin</span>
                         </div>
                       )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`rounded-lg py-0.5 px-2 font-bold text-[10px] uppercase border-none ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-gray-500">2 hours ago</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-100 shadow-xl shadow-gray-200/50">
                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                        <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">Edit Profile</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-50" />
                        <DropdownMenuItem 
                          className={`cursor-pointer font-medium ${u.isActive ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}
                          onClick={() => handleToggleStatus(u.name)}
                        >
                          {u.isActive ? 'Deactivate Account' : 'Activate Account'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-8 relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
          <h3 className="text-lg font-bold">Secure Access Guide</h3>
          <p className="text-gray-400 text-sm mt-2 leading-relaxed">
            Ensure all team members have enabled Two-Factor Authentication (2FA) for their account security.
          </p>
          <Button className="mt-6 bg-white text-gray-900 hover:bg-gray-100 rounded-xl h-10 px-6 font-bold text-xs ring-0">
            Read Security Policy
          </Button>
        </Card>
        
        <Card className="border-none shadow-sm rounded-3xl bg-orange-50 border-orange-100 overflow-hidden p-8">
          <h3 className="text-lg font-bold text-orange-900">Platform Limits</h3>
          <p className="text-orange-700 text-sm mt-2 leading-relaxed">
            Your current plan allows up to 10 admin collaborators. You are currently using 4 slots.
          </p>
          <div className="mt-4 w-full bg-orange-200 h-2 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full w-[40%]" />
          </div>
          <p className="mt-2 text-[10px] font-bold text-orange-800 uppercase tracking-wider">4 of 10 Seats Used</p>
        </Card>
      </div>
    </div>
  );
}
