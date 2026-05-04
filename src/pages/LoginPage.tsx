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
import { KeyRound, Mail, Loader2, Eye, EyeOff, Chrome } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const logoAmimum = 'https://res.cloudinary.com/disuo2s21/image/upload/v1777875211/logo_toko_cppj3d.svg?v=20260504-0630';

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
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 sm:py-10 selection:bg-emerald-100">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-[1100px]"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="hidden lg:flex border border-emerald-100 bg-white/95 rounded-3xl shadow-xl shadow-emerald-100/50 overflow-hidden">
            <CardContent className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl shadow-lg shadow-emerald-200 overflow-hidden ring-1 ring-emerald-100 bg-white shrink-0">
                    <img src={logoAmimum} alt="Logo Toko Herbal Amimum" className="w-full h-full object-contain p-1" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-600 font-semibold">Toko Herbal Amimum</p>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <p className="text-xl font-bold text-gray-900">
                    {i18n.language === 'id' ? 'Selamat datang kembali' : 'Welcome back'}
                  </p>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {i18n.language === 'id'
                      ? 'Akses internal khusus owner dan admin untuk operasional harian dashboard.'
                      : 'Internal access for owners and admins to run daily dashboard operations.'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 leading-relaxed">
                {t('login.sessionNotice')}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 bg-white rounded-3xl shadow-2xl shadow-gray-200/60 overflow-hidden lg:col-span-1">
            <CardHeader className="pt-6 sm:pt-8 pb-2 px-5 sm:px-7">
              <div className="flex items-center gap-3 lg:hidden mb-3">
                <div className="w-10 h-10 rounded-2xl shadow-lg shadow-emerald-200 overflow-hidden ring-1 ring-emerald-100 bg-white shrink-0">
                  <img src={logoAmimum} alt="Logo Toko Herbal Amimum" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-600 font-semibold">Toko Herbal Amimum</p>
                </div>
              </div>

              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{t('login.title')}</CardTitle>
              <CardDescription className="text-center text-gray-500">{t('login.subtitle')}</CardDescription>
            </CardHeader>

            <CardContent className="pt-5 px-5 sm:px-7">
              <form onSubmit={handleLogin} className="space-y-4">
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
                      className="pl-10 h-12 border-gray-100 bg-gray-50 focus:bg-white rounded-xl"
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
                      className="pl-10 pr-11 h-12 border-gray-100 bg-gray-50 focus:bg-white rounded-xl"
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

            <CardFooter className="flex flex-col gap-3 pb-7 pt-2 px-5 sm:px-7">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 rounded-xl border-gray-200 text-gray-500 bg-white"
                disabled
                title={i18n.language === 'id' ? 'Login Google belum aktif (billing Google Cloud belum dikonfigurasi).' : 'Google Login is not active yet (Google Cloud billing is not configured).'}
              >
                <Chrome className="mr-2 h-4 w-4" />
                {i18n.language === 'id' ? 'Masuk dengan Google (segera hadir)' : 'Continue with Google (coming soon)'}
              </Button>

              <p className="text-[11px] text-center text-gray-400 leading-relaxed">{t('login.footerNote')}</p>
            </CardFooter>
          </Card>

          <Card className="hidden lg:flex border border-gray-100 bg-white/95 rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden">
            <CardContent className="p-7 flex flex-col justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">
                  {i18n.language === 'id' ? 'Akses Internal Aman' : 'Secure Internal Access'}
                </p>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {i18n.language === 'id'
                    ? 'Flow login ini disiapkan khusus untuk dashboard owner/admin dengan standar operasional internal.'
                    : 'This sign-in flow is built specifically for owner/admin dashboard operations.'}
                </p>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                    {i18n.language === 'id' ? 'Bahasa Indonesia & English tersedia' : 'Indonesian & English available'}
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    {i18n.language === 'id'
                      ? 'Google Login segera aktif setelah konfigurasi billing Google Cloud'
                      : 'Google Login will be enabled after Google Cloud billing setup'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400">
                &copy; 2026 Dashboard Toko Herbal Amimum. All rights reserved.
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
