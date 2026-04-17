import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ShoppingBag, PackageCheck, Clock3, Wallet } from 'lucide-react';
import api from '@/lib/api';
import { getStatusStyle, orderStatusStyles } from '@/lib/dashboard';

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

interface AdminOrdersResponse {
  status_code: number;
  message: string;
  data: AdminOrderItem[];
  meta?: {
    skip: number;
    limit: number;
    count: number;
  };
}

const orderStatusOptions = ['all', 'pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'failed'];

export default function OrdersPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: async () => {
      const response = await api.get<AdminOrdersResponse>('/admin/orders', {
        params: {
          limit: 100,
          skip: 0,
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        },
      });
      return response.data;
    },
  });

  const orders = ordersResponse?.data ?? [];

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return orders;

    return orders.filter((order) => {
      return (
        order.id.toLowerCase().includes(normalizedSearch) ||
        (order.customer_name || '').toLowerCase().includes(normalizedSearch) ||
        (order.status || '').toLowerCase().includes(normalizedSearch)
      );
    });
  }, [orders, search]);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
  const pendingOrders = filteredOrders.filter((order) => order.status?.toLowerCase() === 'pending').length;
  const processingOrders = filteredOrders.filter((order) => order.status?.toLowerCase() === 'processing').length;
  const shippedOrders = filteredOrders.filter((order) => order.status?.toLowerCase() === 'shipped').length;

  const summaryCards = [
    {
      label: 'Visible Orders',
      value: filteredOrders.length,
      helper: 'Order yang tampil di layar sekarang',
      icon: ShoppingBag,
      tone: 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Pending Review',
      value: pendingOrders,
      helper: 'Perlu perhatian admin/owner',
      icon: Clock3,
      tone: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'In Fulfillment',
      value: processingOrders + shippedOrders,
      helper: 'Order sedang diproses atau dikirim',
      icon: PackageCheck,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Visible Gross',
      value: `Rp ${totalRevenue.toLocaleString('id-ID')}`,
      helper: 'Total nilai order yang sedang difilter',
      icon: Wallet,
      tone: 'bg-green-50 text-green-600',
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders Management</h1>
          <p className="text-gray-500 mt-1">Area monitoring order untuk admin dan owner, agar operasional harian lebih mudah dipantau.</p>
        </div>
        <Button disabled className="bg-orange-500 hover:bg-orange-600 rounded-xl h-11 px-6 shadow-lg shadow-orange-100 transition-all active:scale-95 disabled:opacity-60">
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

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by order id, customer, or status..."
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
                {orderStatusOptions.map((status) => (
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
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Order</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Customer</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Delivery</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Total</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Status</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No orders matched the current filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{order.id}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Shipment: {order.shipment_id || 'N/A'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{order.customer_name || 'Unknown Customer'}</p>
                        <p className="text-[10px] text-gray-400">Notes: {order.notes || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-gray-600 capitalize">{order.delivery_type}</p>
                        <p className="text-[10px] text-gray-400">Shipping: Rp {Number(order.shipping_cost || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-gray-900">Rp {Number(order.total_price || 0).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${getStatusStyle(orderStatusStyles, order.status)}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-gray-500">
                      {new Date(order.created_at).toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-orange-50 border-orange-100 overflow-hidden p-8">
        <h3 className="text-lg font-bold text-orange-900">Peran halaman ini</h3>
        <p className="text-orange-700 text-sm mt-2 leading-relaxed">
          Halaman orders disiapkan untuk monitoring harian oleh admin dan owner. Fokusnya adalah visibilitas order, status fulfilment, dan total nilai transaksi yang sedang dipantau.
        </p>
      </Card>
    </div>
  );
}
