import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, ShoppingBag, PackageCheck, Clock3, Wallet, Truck, Store, Eye, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import {
  deliveryTypeLabels,
  getOrderStatusLabel,
  getStatusLabel,
  getStatusStyle,
  orderStatusLabels,
  orderStatusStyles,
  paymentStatusLabels,
  paymentStatusStyles,
} from '@/lib/dashboard';

interface AdminOrderItem {
  id: string;
  status: string;
  total_price: number;
  shipment_id?: string | null;
  delivery_type: string;
  notes?: string | null;
  customer_name?: string | null;
  created_at: string;
  shipping_cost?: number;
}

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
  updated_at: string;
}

interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T[];
  meta?: { count: number };
}

const orderStatusOptions = ['all', 'pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'failed', 'capture', 'settlement', 'refund'];
const paymentStatusOptions = ['all', 'pending', 'settlement', 'expire', 'cancel', 'deny', 'refund', 'capture', 'authorize', 'challenge', 'partial_refund'];
const POS_RECEIPT_STORAGE_KEY = 'amimum.pos.receipts.v1';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';

  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localPosReceipts, setLocalPosReceipts] = useState<Array<{ transactionId: string; createdAt: string; total: number; paymentMethod?: string; buyerName?: string }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_RECEIPT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setLocalPosReceipts(parsed);
    } catch {
      setLocalPosReceipts([]);
    }
  }, []);

  const { data: ordersResponse, isLoading: isOrdersLoading, isError: isOrdersError } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AdminOrderItem>>('/admin/orders', {
        params: { limit: 30, skip: 0, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) },
      });
      return response.data;
    },
    enabled: true,
  });

  const { data: paymentsResponse, isLoading: isPaymentsLoading, isError: isPaymentsError } = useQuery({
    queryKey: ['admin-payments', statusFilter],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AdminPaymentInfo>>('/admin/payments', {
        params: { limit: 30, skip: 0, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) },
      });
      return response.data;
    },
    enabled: activeTab === 'payments',
  });

  const orders = ordersResponse?.data ?? [];

  const extractBuyerFromNotes = (notes?: string | null) => {
    const raw = String(notes || '');
    const match = raw.match(/POS\s*Buyer\s*:\s*([^|\[\n\r]+)/i)
      || raw.match(/\[?POS_BUYER\]?\s*:\s*([^|\[\n\r]+)/i);
    if (match?.[1]?.trim()) return match[1].trim();

    const marker = raw.toLowerCase().indexOf('pos buyer');
    if (marker >= 0) {
      const tail = raw.slice(marker);
      const afterColon = tail.split(':').slice(1).join(':').trim();
      const candidate = afterColon.split('|')[0]?.split('[')[0]?.trim();
      return candidate || '';
    }

    return '';
  };

  const resolveOrderCustomerName = (order: AdminOrderItem) => {
    const buyerFromNotes = extractBuyerFromNotes(order.notes);
    if (buyerFromNotes) return buyerFromNotes;
    return order.customer_name || '-';
  };

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
          transaction_id: String(order.id),
          payment_type: localReceipt?.paymentMethod || extractPaymentFromNotes(order.notes),
          gross_amount: Number(order.total_price || 0),
          transaction_status: String(order.status || '').toLowerCase() === 'pending' ? 'pending' : 'settlement',
          fraud_status: null,
          customer_name: localReceipt?.buyerName || extractBuyerFromNotes(order.notes) || order.customer_name || 'Pelanggan POS',
          customer_email: '-',
          order_status: order.status || 'paid',
          updated_at: order.created_at,
        };
      });


    const knownTxn = new Set([...paymentRows.map((p) => String(p.transaction_id)), ...syntheticFromOrders.map((p) => String(p.transaction_id))]);
    const syntheticFromLocal: AdminPaymentInfo[] = localPosReceipts
      .filter((r) => !knownTxn.has(String(r.transactionId)))
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
        updated_at: r.createdAt,
      }));

    return [...paymentRows, ...syntheticFromOrders, ...syntheticFromLocal];
  }, [paymentsResponse?.data, ordersResponse?.data, localPosReceipts]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) =>
      order.id.toLowerCase().includes(q) ||
      resolveOrderCustomerName(order).toLowerCase().includes(q) ||
      (order.status || '').toLowerCase().includes(q)
    );
  }, [orders, search]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((payment) =>
      payment.order_id.toLowerCase().includes(q) ||
      payment.transaction_id.toLowerCase().includes(q) ||
      (payment.customer_name || '').toLowerCase().includes(q) ||
      (payment.customer_email || '').toLowerCase().includes(q) ||
      (payment.transaction_status || '').toLowerCase().includes(q)
    );
  }, [payments, search]);

  const orderGross = filteredOrders.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  const paymentGross = filteredPayments.reduce((sum, item) => sum + Number(item.gross_amount || 0), 0);

  const summaryCards = activeTab === 'orders'
    ? [
        { label: t('ordersPage.summary.visibleOrders'), value: filteredOrders.length, icon: ShoppingBag },
        { label: t('ordersPage.summary.pendingReview'), value: filteredOrders.filter((x) => x.status?.toLowerCase() === 'pending').length, icon: Clock3 },
        { label: t('ordersPage.summary.inFulfillment'), value: filteredOrders.filter((x) => ['processing', 'shipped'].includes(String(x.status).toLowerCase())).length, icon: PackageCheck },
        { label: t('ordersPage.summary.visibleGross'), value: `Rp ${orderGross.toLocaleString('id-ID')}`, icon: Wallet },
      ]
    : [
        { label: t('paymentsPage.summary.visiblePayments'), value: filteredPayments.length, icon: CreditCard },
        { label: t('paymentsPage.summary.pendingPayment'), value: filteredPayments.filter((x) => x.transaction_status?.toLowerCase() === 'pending').length, icon: Clock3 },
        { label: t('paymentsPage.summary.settlement'), value: filteredPayments.filter((x) => x.transaction_status?.toLowerCase() === 'settlement').length, icon: PackageCheck },
        { label: t('paymentsPage.grossTitle'), value: `Rp ${paymentGross.toLocaleString('id-ID')}`, icon: Wallet },
      ];

  const isLoading = activeTab === 'orders' ? isOrdersLoading : isPaymentsLoading;
  const isError = activeTab === 'orders' ? isOrdersError : isPaymentsError;

  return (
    <div className="space-y-6 pb-10 max-w-full">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('ordersPageUnified.title')}</h1>
        <p className="text-gray-500 mt-1">{t('ordersPageUnified.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'orders' | 'payments'); setStatusFilter('all'); setSearch(''); }}>
        <TabsList className="grid w-full max-w-sm grid-cols-2 rounded-xl">
          <TabsTrigger value="orders">{t('ordersPageUnified.tabs.orders')}</TabsTrigger>
          <TabsTrigger value="payments">{t('ordersPageUnified.tabs.payments')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-none shadow-sm rounded-3xl dark:bg-slate-800/80 dark:border dark:border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><card.icon className="w-5 h-5" /></div>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400 mt-4">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-slate-100 mt-1 break-words">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden dark:bg-slate-800/80 dark:border dark:border-slate-700">
        <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={activeTab === 'orders' ? t('ordersPage.searchPlaceholder') : t('paymentsPage.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 text-sm text-gray-700 dark:text-slate-200 outline-none">
                {(activeTab === 'orders' ? orderStatusOptions : paymentStatusOptions).map((status) => (
                  <option key={status} value={status}>{status === 'all' ? t('ordersPage.allStatuses') : getStatusLabel(activeTab === 'orders' ? orderStatusLabels : paymentStatusLabels, status)}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 sm:px-8 pb-8">
          {activeTab === 'orders' ? (
            isLoading ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">{t('ordersPage.table.loading')}</div>
            ) : isError ? (
              <div className="rounded-2xl bg-red-50 px-4 py-8 text-center text-sm text-red-600">{t('ordersPage.table.error')}</div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">{t('ordersPage.table.empty')}</div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="rounded-3xl bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ring-1 ring-gray-100 dark:bg-slate-900/70 dark:ring-slate-700">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Order Customer</p>
                        <p className="break-all text-sm font-bold text-gray-900 dark:text-slate-100 sm:text-base">{order.id}</p>
                        <p className="break-words text-xs font-medium text-gray-500 dark:text-slate-400">Customer: {resolveOrderCustomerName(order)}</p>
                        <p className="text-[11px] text-gray-400">Dibuat: {new Date(order.created_at).toLocaleString(locale)}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:min-w-[520px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <div className="rounded-2xl bg-gray-50 px-3 py-2 dark:bg-slate-800">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Penerimaan</p>
                          <p className="mt-1 flex items-center gap-2 font-semibold text-gray-700 dark:text-slate-200">{String(order.delivery_type).toLowerCase() === 'pickup' ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}{getStatusLabel(deliveryTypeLabels, order.delivery_type)}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-3 py-2 dark:bg-slate-800">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Total & Status</p>
                          <p className="mt-1 font-bold text-gray-900 dark:text-slate-100">Rp {Number(order.total_price || 0).toLocaleString('id-ID')}</p>
                          <Badge variant="secondary" className={`mt-2 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${getStatusStyle(orderStatusStyles, order.status)}`}>{getOrderStatusLabel(order.status, order.delivery_type)}</Badge>
                        </div>
                        <div className="flex items-center sm:col-span-2 xl:col-span-1">
                          <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate(`/orders/${order.id}`)}><Eye className="w-4 h-4 mr-2" />Detail Order Ini</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            isLoading ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">{t('paymentsPage.table.loading')}</div>
            ) : isError ? (
              <div className="rounded-2xl bg-red-50 px-4 py-8 text-center text-sm text-red-600">{t('paymentsPage.table.error')}</div>
            ) : filteredPayments.length === 0 ? (
              <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">{t('paymentsPage.table.empty')}</div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="rounded-3xl bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ring-1 ring-gray-100 dark:bg-slate-900/70 dark:ring-slate-700">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Transaksi Pembayaran</p>
                        <p className="break-all text-sm font-bold text-gray-900 dark:text-slate-100 sm:text-base">{payment.transaction_id}</p>
                        <p className="break-all text-xs text-gray-400">Order: {payment.order_id}</p>
                        <p className="break-words text-xs font-medium text-gray-500 dark:text-slate-400">Customer: {payment.customer_name || '-'}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 xl:min-w-[580px] xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <div className="rounded-2xl bg-gray-50 px-3 py-2 dark:bg-slate-800">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Metode & Total</p>
                          <p className="mt-1 uppercase font-semibold text-gray-700 dark:text-slate-200">{payment.payment_type || 'N/A'}</p>
                          <p className="font-bold text-gray-900 dark:text-slate-100">Rp {Number(payment.gross_amount || 0).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="rounded-2xl bg-gray-50 px-3 py-2 dark:bg-slate-800">
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Status</p>
                          <Badge variant="secondary" className={`mt-1 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${getStatusStyle(paymentStatusStyles, payment.transaction_status)}`}>{getStatusLabel(paymentStatusLabels, payment.transaction_status)}</Badge>
                          <Badge variant="secondary" className="mt-2 bg-slate-100 text-slate-600 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">Order: {getStatusLabel(orderStatusLabels, payment.order_status, 'Belum tersedia')}</Badge>
                        </div>
                        <div className="flex items-center sm:col-span-2 xl:col-span-1">
                          <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate(`/payments/${payment.id}`)}><Eye className="w-4 h-4 mr-2" />Detail Pembayaran Ini</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
