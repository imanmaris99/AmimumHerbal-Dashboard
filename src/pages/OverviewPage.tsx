import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  ShoppingBag,
  Wallet,
  Clock,
  ArrowUpRight,
  MoreVertical,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';

interface DashboardSummaryResponse {
  status_code: number;
  message: string;
  data: {
    total_users: number;
    total_active_users: number;
    total_orders: number;
    total_pending_orders: number;
    total_paid_orders: number;
    total_processing_orders: number;
    total_shipped_orders: number;
    total_completed_orders: number;
    total_cancelled_orders: number;
    total_failed_orders: number;
    total_pending_payments: number;
    total_settlement_payments: number;
    total_expire_payments: number;
    total_cancel_payments: number;
    total_deny_payments: number;
    total_refund_payments: number;
    total_capture_payments: number;
    gross_revenue_paid_orders: number;
  };
}

interface OrdersResponse {
  status_code: number;
  message: string;
  data: Array<{
    id: string;
    customer_name: string | null;
    total_price: number;
    status: string;
    notes?: string | null;
    created_at: string;
  }>;
}

const COLORS = ['#F97316', '#FDBA74', '#FFEDD5', '#FED7AA', '#FB923C'];
const POS_RECEIPT_STORAGE_KEY = 'amimum.pos.receipts.v1';

export default function OverviewPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [posReceiptMap, setPosReceiptMap] = useState<Map<string, string>>(new Map());
  const [posReceipts, setPosReceipts] = useState<Array<{ transactionId?: string; buyerName?: string; total?: number; createdAt?: string }>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(POS_RECEIPT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ transactionId?: string; buyerName?: string; total?: number; createdAt?: string }>;
      if (!Array.isArray(parsed)) return;
      const m = new Map<string, string>();
      parsed.forEach((r) => {
        if (r?.transactionId && r?.buyerName) m.set(String(r.transactionId), String(r.buyerName));
      });
      setPosReceiptMap(m);
      setPosReceipts(parsed);
    } catch {
      setPosReceiptMap(new Map());
    }
  }, []);

  const { data: summaryResponse, isLoading: summaryLoading } = useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const response = await api.get<DashboardSummaryResponse>('/admin/dashboard/summary');
      return response.data;
    },
  });

  const { data: ordersResponse, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const response = await api.get<OrdersResponse>('/admin/orders', {
        params: { limit: 5, skip: 0 },
      });
      return response.data;
    },
  });

  const summary = summaryResponse?.data;
  const recentOrders = ordersResponse?.data ?? [];
  const computedGrossFromOrders = recentOrders
    .filter((order) => String(order.status || '').toLowerCase() === 'completed' || String(order.status || '').toLowerCase() === 'paid')
    .reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const grossRevenueDisplay = summary
    ? (Number(summary.gross_revenue_paid_orders || 0) > 0
      ? Number(summary.gross_revenue_paid_orders || 0)
      : computedGrossFromOrders)
    : 0;

  const today = new Date().toISOString().slice(0, 10);
  const posOmzet = posReceipts.reduce((sum, r) => sum + Number(r?.total || 0), 0);
  const posTodayCount = posReceipts.filter((r) => String(r?.createdAt || '').slice(0, 10) === today).length;

  const stats = summary
    ? [
        {
          label: t('overview.grossRevenue'),
          value: `Rp ${grossRevenueDisplay.toLocaleString('id-ID')}`,
          helper: `${t('overview.grossRevenueHelper')} • ${t('overview.grossRevenueHelperScope')}`, 
          icon: Wallet,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
        },
        {
          label: t('overview.totalOrders'),
          value: summary.total_orders.toLocaleString('id-ID'),
          helper: `${summary.total_pending_orders} ${t('overview.totalOrdersHelper')}`,
          icon: ShoppingBag,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
        },
        {
          label: t('overview.activeUsers'),
          value: summary.total_active_users.toLocaleString('id-ID'),
          helper: `${summary.total_users} ${t('overview.activeUsersHelper')}`,
          icon: Users,
          color: 'text-green-600',
          bg: 'bg-green-50',
        },
        {
          label: t('overview.pendingPayments'),
          value: summary.total_pending_payments.toLocaleString('id-ID'),
          helper: `${summary.total_settlement_payments} ${t('overview.pendingPaymentsHelper')}`,
          icon: Clock,
          color: 'text-purple-600',
          bg: 'bg-purple-50',
        },
        {
          label: 'Omzet Kasir (Lokal)',
          value: `Rp ${posOmzet.toLocaleString('id-ID')}`,
          helper: `${posReceipts.length} transaksi tersimpan`,
          icon: Wallet,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
        },
        {
          label: 'Transaksi Kasir Hari Ini',
          value: posTodayCount.toLocaleString('id-ID'),
          helper: 'Berdasarkan receipt kasir lokal',
          icon: ShoppingBag,
          color: 'text-teal-600',
          bg: 'bg-teal-50',
        },
      ]
    : [];

  const orderStatusChart = summary
    ? [
        { name: 'Pending', value: summary.total_pending_orders },
        { name: 'Paid', value: summary.total_paid_orders },
        { name: 'Processing', value: summary.total_processing_orders },
        { name: 'Shipped', value: summary.total_shipped_orders },
        { name: 'Completed', value: summary.total_completed_orders },
      ].filter((item) => item.value > 0)
    : [];

  const paymentStatusChart = summary
    ? [
        { name: 'Pending', value: summary.total_pending_payments },
        { name: 'Settlement', value: summary.total_settlement_payments },
        { name: 'Expire', value: summary.total_expire_payments },
        { name: 'Cancel', value: summary.total_cancel_payments },
        { name: 'Refund', value: summary.total_refund_payments },
      ].filter((item) => item.value > 0)
    : [];

  const extractBuyerFromNotes = (notes?: string | null) => {
    const raw = String(notes || '');
    const match = raw.match(/POS Buyer:\s*([^|]+)/i);
    return match?.[1]?.trim() || '';
  };

  const resolveCustomerLabel = (orderId: string, customerName: string | null, notes?: string | null) => {
    const raw = (customerName || '').trim();
    const buyerFromNotes = extractBuyerFromNotes(notes);
    if (buyerFromNotes) return buyerFromNotes;

    const adminFullName = [user?.firstname, user?.lastname].filter(Boolean).join(' ').trim().toLowerCase();
    const adminName = String(user?.name || '').trim().toLowerCase();
    const adminEmailPrefix = String(user?.email || '').split('@')[0]?.trim().toLowerCase();
    const normalized = raw.toLowerCase();

    const looksLikeAdmin = !!raw && (
      normalized === adminFullName ||
      normalized === adminName ||
      normalized === adminEmailPrefix
    );

    const looksLikePlaceholder = ['pembeli', 'pelanggan pos', 'customer', 'ibu'].includes(normalized);

    if (looksLikeAdmin || looksLikePlaceholder) {
      const buyerFromPos = posReceiptMap.get(String(orderId));
      return buyerFromPos || (raw || 'Pelanggan POS');
    }

    if (!raw) return t('overview.table.unknown');
    return raw;
  };

  return (
    <div className="space-y-7 md:space-y-9 pb-10 max-w-full">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('overview.title')}</h1>
        <p className="text-gray-500 mt-1">{t('overview.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {summaryLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} className="border-none shadow-sm rounded-3xl">
                <CardContent className="p-6 h-36 animate-pulse bg-gray-50 rounded-3xl" />
              </Card>
            ))
          : stats.map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm rounded-2xl sm:rounded-3xl group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden relative bg-white dark:bg-slate-800/80 dark:border dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.06] dark:group-hover:opacity-[0.12] transition-opacity bg-gradient-to-tr from-gray-50 to-emerald-500" />

                <CardContent className="p-4 sm:p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className={stat.bg + ' p-2.5 sm:p-3 rounded-xl sm:rounded-2xl'}>
                      <stat.icon className={stat.color + ' w-5 h-5 sm:w-6 sm:h-6'} />
                    </div>
                    <MoreVertical className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="mt-4 sm:mt-5">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 leading-snug">{stat.label}</p>
                    <div className="flex items-end justify-between mt-1.5 gap-2 sm:gap-3">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words leading-tight">{stat.value}</h3>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-green-600 shrink-0">
                        <ArrowUpRight className="w-3 h-3" />
                        Live
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium tracking-wide mt-2">{stat.helper}</p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 md:gap-6 xl:gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-800/80 dark:border dark:border-slate-700">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-8 pt-8 px-6 sm:px-8">
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">{t('overview.orderStatus')}</CardTitle>
              <CardDescription>{t('overview.orderStatusDesc')}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 pb-6 md:pb-8 overflow-hidden">
            <div className="h-[260px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderStatusChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: 'none',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-800/80 dark:border dark:border-slate-700">
          <CardHeader className="pt-8 px-8">
            <CardTitle className="text-lg font-bold tracking-tight">{t('overview.paymentStatus')}</CardTitle>
            <CardDescription>{t('overview.paymentStatusDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-5 sm:p-6 md:p-8 overflow-hidden">
            <div className="h-[220px] sm:h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentStatusChart} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value">
                    {paymentStatusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={8} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold">{paymentStatusChart.reduce((acc, item) => acc + item.value, 0)}</span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{t('overview.total')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 w-full mt-6">
              {paymentStatusChart.map((entry, i) => (
                <div key={entry.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] font-bold text-gray-500">{entry.name}</span>
                  </div>
                  <span className="text-xs font-bold">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-800/80 dark:border dark:border-slate-700">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 sm:px-8 py-8">
          <div>
            <CardTitle className="text-lg font-bold tracking-tight">{t('overview.recentOrders')}</CardTitle>
            <CardDescription>{t('overview.recentOrdersDesc')}</CardDescription>
          </div>
          <Button variant="outline" className="rounded-xl border-gray-100 dark:border-slate-600 font-bold text-xs h-9 w-full sm:w-auto hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
            {t('overview.viewAll')}
          </Button>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-8 overflow-x-auto">
          <Table className="min-w-[560px] md:min-w-[640px]">
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50">
                <TableHead className="w-[80px] font-bold text-gray-400 text-[10px] uppercase tracking-wider">{t('overview.table.no')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">{t('overview.table.customer')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">{t('overview.table.amount')}</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">{t('overview.table.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    {t('overview.table.loading')}
                  </TableCell>
                </TableRow>
              ) : recentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    {t('overview.table.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                recentOrders.map((order, index) => (
                  <TableRow key={order.id} className="group hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors border-gray-50 dark:border-slate-700">
                    <TableCell className="font-medium text-gray-600">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{resolveCustomerLabel(order.id, order.customer_name, order.notes)}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">Rp {Number(order.total_price || 0).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-50 text-green-600 hover:bg-green-100 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
