import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, CreditCard, Clock3, ShieldAlert, Wallet, Eye } from 'lucide-react';
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

const paymentStatusOptions = ['all', 'pending', 'settlement', 'expire', 'cancel', 'deny', 'refund', 'capture', 'authorize', 'challenge', 'partial_refund'];

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: paymentsResponse, isLoading, isError, error } = useQuery({
    queryKey: ['admin-payments', statusFilter],
    queryFn: async () => {
      const response = await api.get<AdminPaymentsResponse>('/admin/payments', {
        params: {
          limit: 30,
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
  const totalPayments = paymentsResponse?.meta?.count ?? filteredPayments.length;
  const pendingPayments = filteredPayments.filter((payment) => payment.transaction_status?.toLowerCase() === 'pending').length;
  const settledPayments = filteredPayments.filter((payment) => payment.transaction_status?.toLowerCase() === 'settlement').length;
  const flaggedPayments = filteredPayments.filter((payment) => {
    const fraud = payment.fraud_status?.toLowerCase();
    return fraud && fraud !== 'accept';
  }).length;

  const summaryCards = [
    {
      label: t('paymentsPage.summary.visiblePayments'),
      value: filteredPayments.length,
      helper: t('paymentsPage.summary.visiblePaymentsHelper', { visible: filteredPayments.length, total: totalPayments }),
      icon: CreditCard,
      tone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: t('paymentsPage.summary.pendingPayment'),
      value: pendingPayments,
      helper: t('paymentsPage.summary.pendingPaymentHelper'),
      icon: Clock3,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: t('paymentsPage.summary.settlement'),
      value: settledPayments,
      helper: t('paymentsPage.summary.settlementHelper'),
      icon: Wallet,
      tone: 'bg-green-50 text-green-600',
    },
    {
      label: t('paymentsPage.summary.fraudWatch'),
      value: flaggedPayments,
      helper: t('paymentsPage.summary.fraudWatchHelper'),
      icon: ShieldAlert,
      tone: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8 pb-10 max-w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('paymentsPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('paymentsPage.subtitle')}</p>
        </div>
        <Button disabled className="bg-emerald-500 hover:bg-emerald-600 rounded-xl h-11 px-6 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-60 w-full sm:w-auto">
          {t('paymentsPage.accessBadge')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
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

      <Card className="border-none shadow-sm rounded-3xl bg-green-50 border-green-100 overflow-hidden p-5 sm:p-6 md:p-8">
        <h3 className="text-lg font-bold text-green-900">{t('paymentsPage.grossTitle')}</h3>
        <p className="text-2xl sm:text-3xl font-bold text-green-700 mt-2 break-words">Rp {grossVisible.toLocaleString('id-ID')}</p>
        <p className="text-green-700 text-sm mt-2 leading-relaxed">
          {t('paymentsPage.grossDescription')}
        </p>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={t('paymentsPage.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto items-stretch sm:items-center">
              {isError ? (
                <span className="text-xs text-red-500 font-medium max-w-[280px]">
                  {String((error as any)?.response?.data?.detail?.message || (error as any)?.message || t('paymentsPage.loadErrorInline'))}
                </span>
              ) : null}
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-gray-100 bg-white px-4 text-sm text-gray-700 outline-none w-full lg:w-auto"
              >
                {paymentStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? t('paymentsPage.allStatuses') : status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-8 overflow-x-auto">
          <Table className="min-w-[860px] xl:min-w-[1020px]">
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">{t('paymentsPage.table.transaction')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">{t('paymentsPage.table.customer')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">{t('paymentsPage.table.paymentType')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">{t('paymentsPage.table.grossAmount')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">{t('paymentsPage.table.status')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">{t('paymentsPage.table.orderStatus')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">{t('paymentsPage.table.updated')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase text-right">{t('paymentsPage.table.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    {t('paymentsPage.table.loading')}
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-red-500 py-8">
                    {t('paymentsPage.table.error')}
                  </TableCell>
                </TableRow>
              ) : filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    {t('paymentsPage.table.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{payment.transaction_id}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{t('paymentsPage.table.order')}: {payment.order_id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{payment.customer_name || t('paymentsPage.table.unknownCustomer')}</p>
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
                          <p className={`text-[10px] uppercase ${String(payment.fraud_status).toLowerCase() === 'accept' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {t('paymentsPage.table.fraud')}: {payment.fraud_status}
                          </p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">
                        {payment.order_status || 'unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-500">
                      {new Date(payment.updated_at).toLocaleString(locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/payments/${payment.id}`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        {t('paymentsPage.table.detail')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 border-emerald-100 overflow-hidden p-6 sm:p-8">
        <h3 className="text-lg font-bold text-emerald-900">{t('paymentsPage.roleTitle')}</h3>
        <p className="text-emerald-700 text-sm mt-2 leading-relaxed">
          {t('paymentsPage.roleDescription')}
        </p>
      </Card>
    </div>
  );
}
