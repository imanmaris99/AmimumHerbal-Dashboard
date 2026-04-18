import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { BasicStatusResponse, ForgotPasswordPayload } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

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
            <CardTitle className="text-2xl font-bold text-gray-900">Lupa password dashboard</CardTitle>
            <CardDescription className="text-gray-500">
              Masukkan email akun internal Anda. Kami akan kirim kode verifikasi dan tautan reset password ke email tersebut.
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
                    placeholder="owner@amimum.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-xl border-gray-100 bg-gray-50 pl-10 focus:bg-white"
                    required
                  />
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
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pb-8 pt-2 text-sm text-gray-500">
            <p className="text-center">Hanya akun internal dengan role admin atau owner yang boleh memakai flow ini.</p>
            <Link to="/reset-password" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Sudah punya kode? Lanjut reset password
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
