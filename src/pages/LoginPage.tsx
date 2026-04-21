import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { LoginResponse, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { motion } from 'motion/react';
import { KeyRound, Mail, LayoutDashboard, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { t, i18n } = useTranslation();

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

      const displayName = `${backendUser.firstname || ''} ${backendUser.lastname || ''}`.trim() || (role === 'owner' ? 'Owner' : 'Admin');

      setAuth(
        {
          id: backendUser.id,
          name: displayName,
          email: backendUser.email,
          role,
          isActive: backendUser.is_active,
          gender: backendUser.gender,
          firstname: backendUser.firstname || undefined,
          lastname: backendUser.lastname || undefined,
        },
        payload.access_token.access_token
      );
      
      toast.success(t('login.welcomeBack', { name: displayName }));
      navigate('/overview');
    } catch (err: any) {
      const message = err?.response?.data?.detail?.message || err?.message || 'Login gagal. Silakan periksa kembali email dan password Anda.';
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Dashboard Toko Herbal AmImUm</h1>
              <p className="text-sm text-gray-500 mt-1">{i18n.language === 'id' ? 'Akses internal untuk owner dan admin' : 'Internal access for owners and admins'}</p>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden bg-white/95 backdrop-blur">
          <CardHeader className="space-y-1 pb-2 pt-8">
            <CardTitle className="text-2xl font-bold text-center">{t('login.title')}</CardTitle>
            <CardDescription className="text-center text-gray-500">
              {t('login.subtitle')}
            </CardDescription>
            <div className="mx-auto mt-4 max-w-[320px] text-center text-xs text-emerald-700 leading-relaxed">
              {t('login.languageIntro')}
            </div>
            <div className="mx-auto mt-3 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              {t('login.sessionNotice')}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.emailLabel')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@amimum.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-100 bg-gray-50 focus:bg-white transition-colors rounded-xl"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t('login.passwordLabel')}</Label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-emerald-500 hover:text-emerald-600">
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-11 h-12 border-gray-100 bg-gray-50 focus:bg-white transition-colors rounded-xl"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                    {t('login.submitting')}
                  </>
                ) : (
                  t('login.submit')
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pb-8 pt-2">
            <p className="text-xs text-center text-gray-400 px-8 leading-relaxed">
              {t('login.footerNote')}
            </p>
          </CardFooter>
        </Card>
        
        <p className="text-center mt-8 text-sm text-gray-400">
          &copy; 2026 Dashboard Toko Herbal AmImUm. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
}
