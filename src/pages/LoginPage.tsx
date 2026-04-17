import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { LoginResponse, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'motion/react';
import { KeyRound, Mail, LayoutDashboard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post<LoginResponse>('/admin/login', {
        email,
        password,
      });

      const payload = response.data.data;
      const backendUser = payload.user;
      const role = backendUser.role as UserRole;

      if (role !== 'admin' && role !== 'owner') {
        throw new Error('Akun ini tidak memiliki akses ke dashboard internal.');
      }

      const displayName = role === 'owner' ? 'Owner' : 'Admin';

      setAuth(
        {
          id: backendUser.id,
          name: displayName,
          email: backendUser.email,
          role,
          isActive: backendUser.is_active,
        },
        payload.access_token.access_token
      );
      
      toast.success(`Welcome back, ${displayName}!`);
      navigate('/overview');
    } catch (err: any) {
      const message = err?.response?.data?.detail?.message || err?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 selection:bg-emerald-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-300">
               <LayoutDashboard className="text-white w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AmImUm</h1>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-1 pb-2 pt-8">
            <CardTitle className="text-2xl font-bold text-center">Admin Gatekeeper</CardTitle>
            <CardDescription className="text-center text-gray-500">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-100 bg-gray-50 focus:bg-white transition-colors rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 border-gray-100 bg-gray-50 focus:bg-white transition-colors rounded-xl"
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
            <p className="text-xs text-center text-gray-400 px-8">
              Gunakan akun internal dengan role <strong>admin</strong> atau <strong>owner</strong> untuk masuk ke dashboard.
            </p>
          </CardFooter>
        </Card>
        
        <p className="text-center mt-8 text-sm text-gray-400">
          &copy; 2026 AmImUm System. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
