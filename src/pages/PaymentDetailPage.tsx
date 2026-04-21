import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Loader2, ShieldAlert, Wallet } from 'lucide-react';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getStatusStyle, paymentStatusStyles, orderStatusStyles } from '@/lib/dashboard';

interface AdminPaymentDetailData {
  id: string;
  order_id: string;
  transaction_id: string;
  payment_type?: string | null;
  gross_amount: number;
  transaction_status: string;
  fraud_status?: string | null;
  customer_name: string;
  customer_email: string;
  order_status?: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminPaymentDetailResponse {
  status_code: number;
  message: string;
  data: AdminPaymentDetailData;
}

export default function PaymentDetailPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { paymentId } = useParams<{ paymentId: string }>();

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  const paymentDetailQuery = useQuery({
    queryKey: ['admin-payment-detail', paymentId],
    queryFn: async () => {
      const response = await api.get<AdminPaymentDetailResponse>(`/admin/payments/${paymentId}`);
      return response.data.data;
    },
    enabled: !!paymentId,
  });

  const payment = paymentDetailQuery.data;
  const fraudStatus = String(payment?.fraud_status || '').toLowerCase();

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button type="button" variant="outline" className="rounded-xl border-gray-200" onClick={() => navigate('/payments')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Payments
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payment Detail</h1>
          <p className="text-gray-500 mt-1">Detail transaksi payment untuk membantu admin dan owner membaca konteks pembayaran secara lebih utuh.</p>
        </div>
        {payment ? (
          <Badge className={`border-none px-3 py-2 rounded-xl ${getStatusStyle(paymentStatusStyles, payment.transaction_status)}`}>
            {payment.transaction_status}
          </Badge>
        ) : null}
      </div>

      {paymentDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat detail payment...
          </CardContent>
        </Card>
      ) : paymentDetailQuery.isError || !payment ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            Gagal memuat detail payment. Coba kembali ke halaman payments dan ulangi dari sana.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-[0.82fr_1.18fr] gap-6 xl:gap-8 items-start">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-none">Admin payment view</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 break-all">{payment.transaction_id}</h2>
                <p className="text-sm text-gray-500 mt-1">Payment ID: {payment.id}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Order ID</span>
                  <strong className="text-slate-900 text-right max-w-[220px] break-all">{payment.order_id}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Customer</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{payment.customer_name || 'Unknown Customer'}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Email</span>
                  <strong className="text-slate-900 text-right max-w-[220px] break-all">{payment.customer_email || '-'}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Payment type</span>
                  <strong className="text-slate-900 uppercase">{payment.payment_type || 'N/A'}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Gross amount</span>
                  <strong className="text-slate-900">Rp {Number(payment.gross_amount || 0).toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 text-white p-4 text-sm flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><Wallet className="w-4 h-4" />Order status terkait</span>
                <strong>{payment.order_status || 'unknown'}</strong>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Transaction health</h2>
                  <p className="text-sm text-gray-500 mt-1">Ringkasan status transaksi dan fraud monitoring.</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Transaction status</span>
                    <Badge className={`border-none px-3 py-1 rounded-xl ${getStatusStyle(paymentStatusStyles, payment.transaction_status)}`}>
                      {payment.transaction_status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Order status</span>
                    <Badge className={`border-none px-3 py-1 rounded-xl ${getStatusStyle(orderStatusStyles, payment.order_status || 'unknown')}`}>
                      {payment.order_status || 'unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Fraud status</span>
                    <Badge className={`border-none px-3 py-1 rounded-xl ${fraudStatus && fraudStatus !== 'accept' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {payment.fraud_status || 'not provided'}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-slate-900"><ShieldAlert className="w-4 h-4" />Fraud watch notes</div>
                  <p>
                    {fraudStatus && fraudStatus !== 'accept'
                      ? 'Transaksi ini perlu perhatian karena fraud status bukan accept. Cocokkan dengan response Midtrans dan status order terkait.'
                      : 'Tidak ada anomali fraud yang terlihat dari data transaksi ini saat ini.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Timeline snapshot</h2>
                  <p className="text-sm text-gray-500 mt-1">Waktu pembuatan dan update terakhir transaksi.</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8">
                <div className="rounded-2xl bg-slate-50 p-4 space-y-3 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Created at</span>
                    <strong className="text-slate-900">{new Date(payment.created_at).toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Updated at</span>
                    <strong className="text-slate-900">{new Date(payment.updated_at).toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
