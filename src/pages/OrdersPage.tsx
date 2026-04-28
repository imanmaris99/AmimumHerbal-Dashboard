import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, ShoppingBag, PackageCheck, Clock3, Wallet, Truck, Store, Eye, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { getStatusStyle, orderStatusStyles, paymentStatusStyles } from '@/lib/dashboard';

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

const orderStatusOptions = ['all', 'pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'failed', 'capture', 'refund'];
const paymentStatusOptions = ['all', 'pending', 'settlement', 'expire', 'cancel', 'deny', 'refund', 'capture', 'authorize', 'challenge', 'partial_refund'];

export default function OrdersPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';

  const [activeTab, setActiveTab] = useState<'orders' | 'payments'>('orders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: ordersResponse, isLoading: isOrdersLoading, isError: isOrdersError } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AdminOrderItem>>('/admin/orders', {
        params: { limit: 30, skip: 0, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) },
      });
      return response.data;
    },
    enabled: activeTab === 'orders',
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
  const payments = paymentsResponse?.data ?? [];

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) =>
      order.id.toLowerCase().includes(q) ||
      (order.customer_name || '').toLowerCase().includes(q) ||
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
          <Card key={card.label} className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><card.icon className="w-5 h-5" /></div>
              </div>
              <p className="text-sm font-medium text-gray-500 mt-4">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1 break-words">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={activeTab === 'orders' ? t('ordersPage.searchPlaceholder') : t('paymentsPage.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-11 rounded-xl border border-gray-100 bg-white px-4 text-sm text-gray-700 outline-none">
                {(activeTab === 'orders' ? orderStatusOptions : paymentStatusOptions).map((status) => (
                  <option key={status} value={status}>{status === 'all' ? t('ordersPage.allStatuses') : status}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-8 overflow-x-auto">
          {activeTab === 'orders' ? (
            <Table className="min-w-[760px]">
              <TableHeader className="bg-gray-50/50"><TableRow><TableHead>{t('ordersPage.table.order')}</TableHead><TableHead>{t('ordersPage.table.customer')}</TableHead><TableHead>{t('ordersPage.table.delivery')}</TableHead><TableHead>{t('ordersPage.table.total')}</TableHead><TableHead>{t('ordersPage.table.status')}</TableHead><TableHead>{t('ordersPage.table.created')}</TableHead><TableHead className="text-right">{t('ordersPage.table.action')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8">{t('ordersPage.table.loading')}</TableCell></TableRow>
                  : isError ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-red-500">{t('ordersPage.table.error')}</TableCell></TableRow>
                  : filteredOrders.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">{t('ordersPage.table.empty')}</TableCell></TableRow>
                  : filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50/50 border-gray-50">
                      <TableCell><p className="font-bold text-sm">{order.id}</p></TableCell>
                      <TableCell>{order.customer_name || '-'}</TableCell>
                      <TableCell><span className="flex items-center gap-2">{String(order.delivery_type).toLowerCase() === 'pickup' ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}{order.delivery_type}</span></TableCell>
                      <TableCell className="font-bold">Rp {Number(order.total_price || 0).toLocaleString('id-ID')}</TableCell>
                      <TableCell><Badge variant="secondary" className={`border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${getStatusStyle(orderStatusStyles, order.status)}`}>{order.status}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(order.created_at).toLocaleString(locale)}</TableCell>
                      <TableCell className="text-right"><Button variant="outline" className="rounded-xl" onClick={() => navigate(`/orders/${order.id}`)}><Eye className="w-4 h-4 mr-2" />{t('ordersPage.table.detail')}</Button></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader className="bg-gray-50/50"><TableRow><TableHead>{t('paymentsPage.table.transaction')}</TableHead><TableHead>{t('paymentsPage.table.customer')}</TableHead><TableHead>{t('paymentsPage.table.paymentType')}</TableHead><TableHead>{t('paymentsPage.table.grossAmount')}</TableHead><TableHead>{t('paymentsPage.table.status')}</TableHead><TableHead>{t('paymentsPage.table.orderStatus')}</TableHead><TableHead>{t('paymentsPage.table.updated')}</TableHead><TableHead className="text-right">{t('paymentsPage.table.action')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8">{t('paymentsPage.table.loading')}</TableCell></TableRow>
                  : isError ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-red-500">{t('paymentsPage.table.error')}</TableCell></TableRow>
                  : filteredPayments.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">{t('paymentsPage.table.empty')}</TableCell></TableRow>
                  : filteredPayments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-gray-50/50 border-gray-50">
                      <TableCell><p className="font-bold text-sm">{payment.transaction_id}</p><p className="text-[10px] text-gray-400">{t('paymentsPage.table.order')}: {payment.order_id}</p></TableCell>
                      <TableCell>{payment.customer_name || '-'}</TableCell>
                      <TableCell className="uppercase">{payment.payment_type || 'N/A'}</TableCell>
                      <TableCell className="font-bold">Rp {Number(payment.gross_amount || 0).toLocaleString('id-ID')}</TableCell>
                      <TableCell><Badge variant="secondary" className={`border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${getStatusStyle(paymentStatusStyles, payment.transaction_status)}`}>{payment.transaction_status}</Badge></TableCell>
                      <TableCell><Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">{payment.order_status || 'unknown'}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(payment.updated_at).toLocaleString(locale)}</TableCell>
                      <TableCell className="text-right"><Button variant="outline" className="rounded-xl" onClick={() => navigate(`/payments/${payment.id}`)}><Eye className="w-4 h-4 mr-2" />{t('paymentsPage.table.detail')}</Button></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
