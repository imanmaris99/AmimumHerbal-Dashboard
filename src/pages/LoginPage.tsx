import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { LoginResponse, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'motion/react';
import { KeyRound, Mail, Loader2, Eye, EyeOff } from 'lucide-react';
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
      const response = await api.post<LoginResponse>('/admin/login', { email, password });
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-4 py-8 sm:py-12 selection:bg-emerald-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-md"
      >
        <Card className="overflow-hidden rounded-3xl border-none shadow-2xl shadow-emerald-900/20">
          <div className="bg-emerald-400/90 px-6 pt-6 pb-7 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/95 p-1.5 shadow-md">
                <img src={logoAmimum} alt="Logo Toko Herbal Amimum" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-2xl font-extrabold leading-none">Dashboard</p>
                <p className="text-sm text-emerald-50/95 font-medium mt-1">Toko Herbal Amimum</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-emerald-50/95">
              {i18n.language === 'id'
                ? 'Akses internal untuk owner dan admin. Masuk untuk melanjutkan operasional dashboard.'
                : 'Internal access for owners and admins. Sign in to continue dashboard operations.'}
            </p>
          </div>

          <CardContent className="bg-white px-6 sm:px-7 pt-6 pb-7">
            <div className="text-center mb-5">
              <h1 className="text-2xl font-bold text-gray-900">{i18n.language === 'id' ? 'Masuk' : 'Sign in'}</h1>
              <p className="text-sm text-emerald-600 mt-1">{i18n.language === 'id' ? 'Selamat datang kembali' : 'Welcome back'}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.emailLabel')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@amimum.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 focus:bg-white"
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
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 bg-gray-50 pl-10 pr-11 focus:bg-white"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-emerald-500 shadow-lg shadow-emerald-200 hover:bg-emerald-600"
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

            <p className="mt-5 text-center text-[11px] leading-relaxed text-gray-400">{t('login.footerNote')}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
