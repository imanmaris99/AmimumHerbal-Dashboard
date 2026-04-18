import React, { useMemo, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { BasicStatusResponse, ResetPasswordPayload } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialEmail = searchParams.get('email') || '';
  const initialCode = searchParams.get('code') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPrefilled = useMemo(() => Boolean(initialEmail || initialCode), [initialCode, initialEmail]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post<BasicStatusResponse<ResetPasswordPayload>>('/admin/password-reset/confirm', {
        email,
        code,
        new_password: newPassword,
      });

      toast.success(response.data.message || 'Password berhasil direset. Silakan login kembali.');
      navigate('/login');
    } catch (error: any) {
      const message = error?.response?.data?.detail?.message || error?.message || 'Gagal mereset password.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 selection:bg-emerald-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden">
          <CardHeader className="space-y-2 pb-2 pt-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Reset password dashboard</CardTitle>
            <CardDescription className="text-gray-500">
              Masukkan email, kode verifikasi, dan password baru untuk akun internal Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email internal</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50 pl-10 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Kode verifikasi</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Masukkan kode dari email"
                  className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Password baru</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter, kombinasi lengkap"
                    className="h-12 rounded-xl border-gray-100 bg-gray-50 pl-10 pr-11 focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600"
                    aria-label={showPassword ? 'Sembunyikan password baru' : 'Tampilkan password baru'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-emerald-500 shadow-lg shadow-emerald-200 hover:bg-emerald-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan password baru...
                  </>
                ) : (
                  'Reset password'
                )}
              </Button>
            </form>

            {isPrefilled ? (
              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                Email atau kode sudah terisi dari tautan email. Silakan cek ulang sebelum submit.
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pb-8 pt-2 text-sm text-gray-500">
            <p className="text-center">Setelah reset berhasil, login kembali memakai password baru Anda.</p>
            <Link to="/forgot-password" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Belum punya kode? Minta email reset dulu
            </Link>
            <Link to="/login" className="text-gray-500 hover:text-gray-700">
              Kembali ke login
            </Link>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
