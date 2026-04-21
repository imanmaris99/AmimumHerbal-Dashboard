import React, { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ClipboardList, Loader2, MapPinned, Package2, Save, Truck } from 'lucide-react';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { getStatusStyle, orderStatusStyles } from '@/lib/dashboard';
import { toast } from 'sonner';

interface OrderItemDto {
  id: number;
  product_name?: string | null;
  variant_product?: string | null;
  variant_discount?: number | null;
  quantity?: number | null;
  price_per_item?: number | null;
  total_price?: number | null;
  created_at: string;
}

interface ShippingInfoDto {
  id: string;
  my_address?: {
    id: number;
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    created_at: string;
  } | null;
  my_courier?: {
    id: number;
    courier_name?: string | null;
    weight?: number | null;
    service_type?: string | null;
    cost?: number | null;
    estimated_delivery?: string | null;
    created_at: string;
  } | null;
  created_at: string;
}

interface AdminOrderDetailData {
  id: string;
  status: string;
  total_price?: number | null;
  delivery_type: string;
  notes?: string | null;
  customer_name: string;
  created_at: string;
  shipping_cost?: number | null;
  my_shipping?: ShippingInfoDto | null;
  order_item_lists: OrderItemDto[];
}

interface AdminOrderDetailResponse {
  status_code: number;
  message: string;
  data: AdminOrderDetailData;
}

interface UpdateOrderStatusResponse {
  status_code: number;
  message: string;
  data: {
    id: string;
    status: string;
    total_price?: number | null;
    shipment_id?: string | null;
    delivery_type: string;
    notes?: string | null;
    created_at: string;
  };
}

const orderStatusOptions = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'failed', 'capture', 'refund'];

export default function OrderDetailPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orderId } = useParams<{ orderId: string }>();
  const [nextStatus, setNextStatus] = useState('');

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  const orderDetailQuery = useQuery({
    queryKey: ['admin-order-detail', orderId],
    queryFn: async () => {
      const response = await api.get<AdminOrderDetailResponse>(`/admin/orders/${orderId}`);
      return response.data.data;
    },
    enabled: !!orderId,
  });

  const order = orderDetailQuery.data;

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await api.patch<UpdateOrderStatusResponse>(`/admin/orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Status order berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      setNextStatus('');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || 'Gagal memperbarui status order.';
      toast.error(String(message));
    },
  });

  const submitStatusUpdate = () => {
    if (!nextStatus) {
      toast.error('Pilih status baru terlebih dahulu.');
      return;
    }

    updateStatusMutation.mutate(nextStatus);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button type="button" variant="outline" className="rounded-xl border-gray-200" onClick={() => navigate('/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Orders
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Order Detail</h1>
          <p className="text-gray-500 mt-1">Detail order admin untuk melihat struktur item, pengiriman, dan konteks order secara lebih utuh.</p>
        </div>
        {order ? (
          <Badge className={`border-none px-3 py-2 rounded-xl ${getStatusStyle(orderStatusStyles, order.status)}`}>
            {order.status}
          </Badge>
        ) : null}
      </div>

      {orderDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat detail order...
          </CardContent>
        </Card>
      ) : orderDetailQuery.isError || !order ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            Gagal memuat detail order. Coba kembali ke halaman orders dan ulangi dari sana.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-[0.82fr_1.18fr] gap-6 xl:gap-8 items-start">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-none">Admin order view</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 break-all">{order.id}</h2>
                <p className="text-sm text-gray-500 mt-1">Customer: {order.customer_name || 'Unknown Customer'}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Status</span>
                  <strong className="text-slate-900 capitalize">{order.status}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Delivery type</span>
                  <strong className="text-slate-900 capitalize">{order.delivery_type}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Total order</span>
                  <strong className="text-slate-900">Rp {Number(order.total_price || 0).toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Shipping cost</span>
                  <strong className="text-slate-900">Rp {Number(order.shipping_cost || 0).toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Notes</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{order.notes || '-'}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 text-white p-4 text-sm flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><Package2 className="w-4 h-4" />Jumlah item order</span>
                <strong>{order.order_item_lists?.length || 0}</strong>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">Update status order</h3>
                  <p className="text-sm text-emerald-700 mt-1">Gunakan hanya untuk workflow admin internal. Pastikan perubahan status sesuai realitas operasional order.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-status-next">Status baru</Label>
                  <select
                    id="order-status-next"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="h-11 rounded-xl border border-emerald-200 bg-white px-3 text-sm text-gray-700 outline-none w-full"
                  >
                    <option value="">Pilih status baru</option>
                    {orderStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="button" onClick={submitStatusUpdate} disabled={updateStatusMutation.isPending} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  {updateStatusMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Update Status</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Order items</h2>
                  <p className="text-sm text-gray-500 mt-1">Daftar item yang tersimpan di order ini.</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 space-y-4">
                {order.order_item_lists?.length ? order.order_item_lists.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900">{item.product_name || '-'}</p>
                        <p className="text-sm text-gray-500">Variant: {item.variant_product || '-'}</p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-700 border-none w-fit">Qty {item.quantity || 0}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Harga/item</p>
                        <p className="font-semibold text-gray-900">Rp {Number(item.price_per_item || 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Discount variant</p>
                        <p className="font-semibold text-gray-900">{Number(item.variant_discount || 0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Subtotal</p>
                        <p className="font-semibold text-gray-900">Rp {Number(item.total_price || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                    Order ini belum memiliki item yang bisa ditampilkan.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Shipping snapshot</h2>
                  <p className="text-sm text-gray-500 mt-1">Ringkasan alamat dan courier yang tersimpan di order.</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8">
                {order.my_shipping ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-semibold"><MapPinned className="w-4 h-4" />Alamat</div>
                      <p>{order.my_shipping.my_address?.name || '-'}</p>
                      <p>{order.my_shipping.my_address?.phone || '-'}</p>
                      <p>{order.my_shipping.my_address?.address || '-'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-semibold"><Truck className="w-4 h-4" />Courier</div>
                      <p>{order.my_shipping.my_courier?.courier_name || '-'}</p>
                      <p>Service: {order.my_shipping.my_courier?.service_type || '-'}</p>
                      <p>Estimasi: {order.my_shipping.my_courier?.estimated_delivery || '-'}</p>
                      <p>Cost: Rp {Number(order.my_shipping.my_courier?.cost || 0).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                    Tidak ada snapshot shipping untuk order ini. Biasanya ini terjadi pada order pickup atau data shipment belum tersedia.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
