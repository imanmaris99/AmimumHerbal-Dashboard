import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, CreditCard, Clock3, ShieldAlert, Wallet } from 'lucide-react';
import api from '@/lib/api';
import { getStatusStyle, paymentStatusStyles } from '@/lib/dashboard';

interface AdminPaymentInfo {
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

interface AdminPaymentsResponse {
  status_code: number;
  message: string;
  data: AdminPaymentInfo[];
  meta?: {
    skip: number;
    limit: number;
    count: number;
  };
}

const paymentStatusOptions = ['all', 'pending', 'settlement', 'expire', 'cancel', 'deny', 'refund', 'capture'];

export default function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: paymentsResponse, isLoading } = useQuery({
    queryKey: ['admin-payments', statusFilter],
    queryFn: async () => {
      const response = await api.get<AdminPaymentsResponse>('/admin/payments', {
        params: {
          limit: 100,
          skip: 0,
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        },
      });
      return response.data;
    },
  });

  const payments = paymentsResponse?.data ?? [];

  const filteredPayments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return payments;

    return payments.filter((payment) => {
      return (
        payment.order_id.toLowerCase().includes(normalizedSearch) ||
        payment.transaction_id.toLowerCase().includes(normalizedSearch) ||
        (payment.customer_name || '').toLowerCase().includes(normalizedSearch) ||
        (payment.customer_email || '').toLowerCase().includes(normalizedSearch) ||
        (payment.transaction_status || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [payments, search]);

  const grossVisible = filteredPayments.reduce((sum, payment) => sum + Number(payment.gross_amount || 0), 0);
  const pendingPayments = filteredPayments.filter((payment) => payment.transaction_status?.toLowerCase() === 'pending').length;
  const settledPayments = filteredPayments.filter((payment) => payment.transaction_status?.toLowerCase() === 'settlement').length;
  const flaggedPayments = filteredPayments.filter((payment) => {
    const fraud = payment.fraud_status?.toLowerCase();
    return fraud && fraud !== 'accept';
  }).length;

  const summaryCards = [
    {
      label: 'Visible Payments',
      value: filteredPayments.length,
      helper: 'Transaksi yang tampil saat ini',
      icon: CreditCard,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Pending Payment',
      value: pendingPayments,
      helper: 'Perlu monitoring lanjutan',
      icon: Clock3,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Settlement',
      value: settledPayments,
      helper: 'Pembayaran sudah settle',
      icon: Wallet,
      tone: 'bg-green-50 text-green-600',
    },
    {
      label: 'Fraud Watch',
      value: flaggedPayments,
      helper: 'Status fraud non-accept',
      icon: ShieldAlert,
      tone: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments Monitoring</h1>
          <p className="text-gray-500 mt-1">Area monitoring transaksi untuk admin dan owner agar status pembayaran mudah dipantau dan diaudit.</p>
        </div>
        <Button disabled className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-11 px-6 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-60">
          Shared internal access active
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${card.tone}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span>
              </div>
              <p className="text-sm font-medium text-gray-500 mt-4">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 break-words">{card.value}</p>
              <p className="text-[11px] text-gray-400 mt-2">{card.helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-green-50 border-green-100 overflow-hidden p-8">
        <h3 className="text-lg font-bold text-green-900">Visible gross amount</h3>
        <p className="text-3xl font-bold text-green-700 mt-2">Rp {grossVisible.toLocaleString('id-ID')}</p>
        <p className="text-green-700 text-sm mt-2 leading-relaxed">
          Ini adalah total gross amount untuk transaksi yang sedang terlihat berdasarkan filter aktif, agar admin dan owner bisa cepat membaca nilai pembayaran yang sedang dipantau.
        </p>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order, transaction, customer, or status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto items-center">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-gray-100 bg-white px-4 text-sm text-gray-700 outline-none"
              >
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-8">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Transaction</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Customer</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Payment Type</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Gross Amount</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Status</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Order Status</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    Loading payments...
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    No payments matched the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{payment.transaction_id}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Order: {payment.order_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{payment.customer_name || 'Unknown Customer'}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{payment.customer_email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 uppercase">{payment.payment_type || 'N/A'}</TableCell>
                    <TableCell className="font-bold text-gray-900">Rp {Number(payment.gross_amount || 0).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="secondary" className={`border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${getStatusStyle(paymentStatusStyles, payment.transaction_status)}`}>
                          {payment.transaction_status}
                        </Badge>
                        {payment.fraud_status ? (
                          <p className="text-[10px] text-gray-400 uppercase">Fraud: {payment.fraud_status}</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">
                        {payment.order_status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-500">
                      {new Date(payment.updated_at).toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 border-emerald-100 overflow-hidden p-8">
        <h3 className="text-lg font-bold text-emerald-900">Peran halaman ini</h3>
        <p className="text-emerald-700 text-sm mt-2 leading-relaxed">
          Halaman payments disiapkan untuk monitoring transaksi dan audit status pembayaran oleh admin maupun owner. Fokus utamanya adalah membaca health payment flow, status settlement, dan anomali fraud secara cepat.
        </p>
      </Card>
    </div>
  );
}
