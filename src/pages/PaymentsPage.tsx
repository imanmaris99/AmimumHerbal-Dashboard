import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, CreditCard, Clock3, ShieldAlert, Wallet, Eye } from 'lucide-react';
import api from '@/lib/api';
import {
  getAdminSafeErrorMessage,
  getStatusLabel,
  getStatusStyle,
  orderStatusLabels,
  orderStatusStyles,
  paymentStatusLabels,
  paymentStatusStyles,
} from '@/lib/dashboard';

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

interface AdminOrdersResponse {
  status_code: number;
  message: string;
  data: Array<{
    id: string;
    customer_name: string | null;
    customer_email?: string | null;
    total_price: number;
    status: string;
    notes?: string | null;
    created_at: string;
    updated_at?: string;
  }>;
}

const paymentStatusOptions = ['all', 'pending', 'settlement', 'expire', 'cancel', 'deny', 'refund', 'capture', 'authorize', 'challenge', 'partial_refund'];
const POS_RECEIPT_STORAGE_KEY = 'amimum.pos.receipts.v1';

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localPosReceipts, setLocalPosReceipts] = useState<Array<{ transactionId: string; createdAt: string; total: number; paymentMethod?: string; buyerName?: string }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_RECEIPT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLocalPosReceipts(parsed);
      }
    } catch {
      setLocalPosReceipts([]);
    }
  }, []);

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

  const { data: ordersResponse } = useQuery({
    queryKey: ['admin-orders-for-payments-bridge'],
    queryFn: async () => {
      const response = await api.get<AdminOrdersResponse>('/admin/orders', {
        params: { limit: 50, skip: 0 },
      });
      return response.data;
    },
  });

  const payments = useMemo(() => {
    const paymentRows = paymentsResponse?.data ?? [];
    const orderRows = ordersResponse?.data ?? [];

    const paymentByOrderId = new Map(paymentRows.map((p) => [String(p.order_id), p]));
    const extractPaymentFromNotes = (notes?: string | null): string => {
      if (!notes) return 'cash';
      const match = notes.match(/\[PAYMENT:\s*(\w+)\]/i);
      return match ? match[1].toLowerCase() : 'cash';
    };

    const localPosReceiptMap = new Map<string, { transactionId: string; createdAt: string; total: number; paymentMethod?: string; buyerName?: string }>(
      localPosReceipts.map((r) => [String(r.transactionId), r])
    );

    const syntheticFromOrders: AdminPaymentInfo[] = orderRows
      .filter((order) => !paymentByOrderId.has(String(order.id)))
      .map((order) => {
        const localReceipt = localPosReceiptMap.get(String(order.id));
        return {
          id: `POS-${order.id}`,
          order_id: String(order.id),
          transaction_id: `POS-${order.id}`,
          payment_type: localReceipt?.paymentMethod || extractPaymentFromNotes(order.notes),
          gross_amount: Number(order.total_price || 0),
          transaction_status: String(order.status || '').toLowerCase() === 'pending' ? 'pending' : 'settlement',
          fraud_status: null,
          customer_name: localReceipt?.buyerName || order.customer_name || 'Pelanggan POS',
          customer_email: order.customer_email || '-',
          order_status: order.status || 'paid',
          created_at: order.created_at,
          updated_at: order.updated_at || order.created_at,
        };
      });

    const knownTransactionIds = new Set([
      ...paymentRows.map((p) => String(p.transaction_id || '')),
      ...syntheticFromOrders.map((p) => String(p.transaction_id || '')),
    ]);

    const syntheticFromLocalPos: AdminPaymentInfo[] = localPosReceipts
      .filter((r) => !knownTransactionIds.has(String(r.transactionId || '')))
      .map((r) => ({
        id: `LOCAL-${r.transactionId}`,
        order_id: String(r.transactionId),
        transaction_id: String(r.transactionId),
        payment_type: String(r.paymentMethod || 'cash'),
        gross_amount: Number(r.total || 0),
        transaction_status: 'settlement',
        fraud_status: null,
        customer_name: r.buyerName || 'Pelanggan POS',
        customer_email: '-',
        order_status: 'paid',
        created_at: r.createdAt,
        updated_at: r.createdAt,
      }));

    return [...paymentRows, ...syntheticFromOrders, ...syntheticFromLocalPos];
  }, [paymentsResponse?.data, ordersResponse?.data, localPosReceipts]);

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
  const totalPayments = payments.length;
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
                  {getAdminSafeErrorMessage(error, t('paymentsPage.loadErrorInline'))}
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
                    {status === 'all' ? t('paymentsPage.allStatuses') : getStatusLabel(paymentStatusLabels, status)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 sm:px-8 pb-8">
          {isLoading ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">{t('paymentsPage.table.loading')}</div>
          ) : isError ? (
            <div className="rounded-2xl bg-red-50 px-4 py-8 text-center text-sm text-red-600">{t('paymentsPage.table.error')}</div>
          ) : filteredPayments.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">{t('paymentsPage.table.empty')}</div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="rounded-3xl bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ring-1 ring-gray-100">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Transaksi Pembayaran</p>
                      <p className="break-all text-sm font-bold text-gray-900 sm:text-base">{payment.transaction_id}</p>
                      <p className="break-all text-[11px] font-medium text-gray-400">Order: {payment.order_id}</p>
                      <p className="break-words text-xs text-gray-500">{payment.customer_name || t('paymentsPage.table.unknownCustomer')} · {payment.customer_email || '-'}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:min-w-[620px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div className="rounded-2xl bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Metode & Total</p>
                        <p className="mt-1 uppercase font-semibold text-gray-700">{payment.payment_type || 'N/A'}</p>
                        <p className="font-bold text-gray-900">Rp {Number(payment.gross_amount || 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Status pembayaran</p>
                        <Badge variant="secondary" className={`mt-1 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${getStatusStyle(paymentStatusStyles, payment.transaction_status)}`}>
                          {getStatusLabel(paymentStatusLabels, payment.transaction_status)}
                        </Badge>
                        <Badge variant="secondary" className="mt-2 bg-slate-100 text-slate-600 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">
                          Order: {getStatusLabel(orderStatusLabels, payment.order_status, 'Belum tersedia')}
                        </Badge>
                        {payment.fraud_status ? (
                          <p className={`mt-2 text-[10px] uppercase ${String(payment.fraud_status).toLowerCase() === 'accept' ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {t('paymentsPage.table.fraud')}: {payment.fraud_status}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center sm:col-span-2 xl:col-span-1">
                        <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => navigate(`/payments/${payment.id}`)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Detail Pembayaran Ini
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
