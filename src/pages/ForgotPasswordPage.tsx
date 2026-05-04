import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { BasicStatusResponse, ForgotPasswordPayload } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const logoAmimum = 'https://res.cloudinary.com/disuo2s21/image/upload/v1777875211/logo_toko_cppj3d.svg?v=20260504-0630';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post<BasicStatusResponse<ForgotPasswordPayload>>('/admin/forgot-password', {
        email,
      });

      setSubmittedEmail(email);
      toast.success(response.data.message || 'Instruksi reset password berhasil dikirim.');
    } catch (error: any) {
      const message = error?.response?.data?.detail?.message || error?.message || 'Gagal mengirim instruksi reset password.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F2FBF7] via-[#ECF9F4] to-[#E3F5EE] px-4 py-8 sm:py-12 selection:bg-emerald-100">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto w-full max-w-md"
      >
        <Card className="overflow-hidden rounded-3xl border border-emerald-100/80 bg-white/95 backdrop-blur shadow-2xl shadow-emerald-100/50">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 pt-6 pb-7 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/95 p-1.5 shadow-md">
                <img src={logoAmimum} alt="Logo Toko Herbal Amimum" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-2xl font-extrabold leading-none">Dashboard</p>
                <p className="text-sm text-emerald-50/95 font-medium mt-1">Toko Herbal Amimum</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-emerald-50/90 max-w-[92%]">
              Pemulihan akses internal untuk owner dan admin. Kami akan kirim instruksi reset ke email Anda.
            </p>
          </div>

          <CardContent className="bg-white px-6 sm:px-7 pt-6 pb-7">
            <div className="text-center mb-6">
              <h1 className="text-[28px] font-semibold tracking-tight text-gray-900">Lupa password</h1>
              <p className="text-sm text-emerald-600/90 mt-1">Masukkan email akun internal Anda</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-[13px] font-medium text-gray-600 tracking-[0.01em]">Email internal</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="owner@amimum.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 rounded-xl border-gray-200 bg-[#F7FAF9] pl-10 focus:bg-white focus:border-emerald-200"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-emerald-500 shadow-lg shadow-emerald-200/80 hover:bg-emerald-600 active:scale-[0.99] transition-all"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengirim instruksi...
                  </>
                ) : (
                  'Kirim instruksi reset'
                )}
              </Button>
            </form>

            {submittedEmail ? (
              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Instruksi reset password sudah dikirim ke <strong>{submittedEmail}</strong>. Cek email Anda, lalu lanjutkan ke halaman reset password.
              </div>
            ) : null}

            <div className="mt-6 space-y-2 text-sm text-gray-500 text-center">
              <p>Hanya akun internal dengan role admin atau owner yang boleh memakai flow ini.</p>
              <Link to="/reset-password" className="font-semibold text-emerald-600 hover:text-emerald-700 block">
                Sudah punya kode? Lanjut reset password
              </Link>
              <Link to="/login" className="text-gray-500 hover:text-gray-700 block">
                Kembali ke login
              </Link>
            </div>

            <p className="mt-6 text-center text-[11px] leading-relaxed text-gray-400">
              &copy; 2026 Dashboard Toko Herbal Amimum. All rights reserved.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
