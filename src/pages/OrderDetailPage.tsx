import React, { useState } from 'react';
import { AxiosError } from 'axios';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ClipboardList, Copy, Loader2, MapPinned, MessageCircle, Package2, Save, Truck } from 'lucide-react';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  deliveryTypeLabels,
  getAdminSafeErrorMessage,
  getStatusLabel,
  getStatusStyle,
  orderStatusLabels,
  orderStatusStyles,
  sanitizeOrderNotes,
} from '@/lib/dashboard';
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
  code_tracking?: string | null;
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

const orderStatusOptions = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled', 'failed', 'capture', 'settlement', 'refund'];

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

const extractPaymentMethodFromNotes = (notes?: string | null) => {
  const raw = String(notes || '');
  const match = raw.match(/\[PAYMENT:\s*([^\]]+)\]/i);
  return match?.[1]?.trim().toLowerCase() || '';
};

const normalizePhoneForWhatsApp = (phone?: string | null) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
};

const compactOrderId = (id?: string | null) => String(id || '').slice(0, 8).toUpperCase();

const STORE_BANK_ACCOUNT = {
  bank: 'BRI',
  number: '657401009669505',
  accountName: 'IMAN MARIS',
};

const STORE_BANK_ACCOUNT_TEXT = `${STORE_BANK_ACCOUNT.bank} ${STORE_BANK_ACCOUNT.number} a.n. ${STORE_BANK_ACCOUNT.accountName}`;

const formatCurrency = (value?: number | null) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const getPaymentLabel = (method?: string) => {
  const normalized = String(method || '').toLowerCase();
  if (normalized === 'cod') return 'COD / bayar saat barang diterima';
  if (normalized === 'qris' || normalized === 'qris_manual') return 'QRIS manual';
  if (normalized === 'transfer' || normalized === 'transfer_manual' || normalized === 'bank_transfer') return 'Transfer BRI manual';
  if (normalized === 'cash') return 'Cash / bayar di toko';
  if (normalized === 'bank_transfer') return 'Transfer bank online';
  if (normalized === 'credit_card') return 'Kartu kredit/debit online';
  return 'akan kami cek';
};

const joinNonEmptyLines = (lines: Array<string | false | null | undefined>) => lines.filter(Boolean).join('\n');

interface ChatTemplate {
  id: string;
  title: string;
  description: string;
  text: string;
  recommended?: boolean;
}

export default function OrderDetailPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { orderId } = useParams<{ orderId: string }>();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';
  const [nextStatus, setNextStatus] = useState('');
  const [trackingCode, setTrackingCode] = useState('');

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

  React.useEffect(() => {
    setTrackingCode(order?.my_shipping?.code_tracking || '');
  }, [order?.my_shipping?.code_tracking]);

  const groupedOrderItems = React.useMemo(() => {
    const items = order?.order_item_lists || [];
    if (!items.length) return [];

    const groupedMap = new Map<string, OrderItemDto>();
    for (const item of items) {
      const key = `${item.product_name || ''}|||${item.variant_product || ''}|||${item.price_per_item || 0}|||${item.variant_discount || 0}`;
      const existing = groupedMap.get(key);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + (item.quantity || 0);
        existing.total_price = (existing.total_price || 0) + (item.total_price || 0);
      } else {
        groupedMap.set(key, { ...item });
      }
    }
    return Array.from(groupedMap.values());
  }, [order?.order_item_lists]);

  const customerName = React.useMemo(() => (
    extractBuyerFromNotes(order?.notes) || order?.customer_name || 'kak'
  ), [order?.customer_name, order?.notes]);

  const customerPhone = order?.my_shipping?.my_address?.phone || '';
  const customerWhatsApp = normalizePhoneForWhatsApp(customerPhone);
  const paymentMethod = extractPaymentMethodFromNotes(order?.notes);
  const paymentLabel = getPaymentLabel(paymentMethod);
  const totalText = formatCurrency(order?.total_price || 0);
  const shippingCostText = order?.shipping_cost == null ? 'Belum tersedia' : formatCurrency(order.shipping_cost);
  const orderStatusText = getStatusLabel(orderStatusLabels, order?.status || '-');
  const deliveryTypeText = getStatusLabel(deliveryTypeLabels, order?.delivery_type || '-');
  const courierName = order?.my_shipping?.my_courier?.courier_name || '-';
  const courierService = order?.my_shipping?.my_courier?.service_type || '-';
  const courierEstimate = order?.my_shipping?.my_courier?.estimated_delivery || '-';
  const shippingAddress = order?.my_shipping?.my_address;
  const addressText = joinNonEmptyLines([
    shippingAddress?.name ? `Penerima: ${shippingAddress.name}` : null,
    shippingAddress?.phone ? `HP: ${shippingAddress.phone}` : null,
    shippingAddress?.address ? `Alamat: ${shippingAddress.address}` : null,
  ]);
  const trackingCodeForTemplate = trackingCode.trim() || order?.my_shipping?.code_tracking || '';
  const itemSummary = groupedOrderItems
    .map((item) => {
      const variant = item.variant_product ? ` (${item.variant_product})` : '';
      const qty = item.quantity || 0;
      const subtotal = formatCurrency(item.total_price || 0);
      return `- ${item.product_name || 'Produk'}${variant} x${qty} = ${subtotal}`;
    })
    .join('\n');

  const chatTemplates = React.useMemo<ChatTemplate[]>(() => {
    if (!order) return [];

    const status = String(order.status || '').toLowerCase();
    const deliveryType = String(order.delivery_type || '').toLowerCase();
    const isCod = paymentMethod === 'cod';
    const isCash = paymentMethod === 'cash';
    const isManualQris = paymentMethod === 'qris' || paymentMethod === 'qris_manual';
    const isTransfer = paymentMethod === 'transfer' || paymentMethod === 'transfer_manual' || paymentMethod === 'bank_transfer';
    const orderRef = compactOrderId(order.id);
    const greetingName = customerName && customerName !== '-' ? customerName : 'kak';
    const itemsText = itemSummary || '- Produk sesuai pesanan';
    const templates: ChatTemplate[] = [];
    const orderSummary = joinNonEmptyLines([
      `No. Order: ${orderRef}`,
      `Status: ${orderStatusText}`,
      `Jenis order: ${deliveryTypeText}`,
      `Metode bayar: ${paymentLabel}`,
      `Total: ${totalText}`,
      deliveryType === 'delivery' ? `Ongkir: ${shippingCostText}` : null,
      deliveryType === 'delivery' ? `Kurir: ${courierName} ${courierService !== '-' ? `(${courierService})` : ''}` : null,
      deliveryType === 'delivery' && courierEstimate !== '-' ? `Estimasi: ${courierEstimate}` : null,
    ]);
    const shippingBlock = deliveryType === 'delivery' && addressText
      ? `\n\nData pengiriman:\n${addressText}`
      : '';

    templates.push({
      id: 'order-received',
      title: 'Order masuk',
      description: 'Kirim saat pesanan baru diterima admin.',
      recommended: ['pending', 'processing', 'capture', 'settlement', 'paid'].includes(status),
      text: `Assalamu’alaikum ${greetingName}, pesanan kakak di Toko Herbal Amimum sudah kami terima.\n\n${orderSummary}\n\nProduk:\n${itemsText}${shippingBlock}\n\nPesanan akan kami cek sesuai data di atas ya kak. Jika ada data yang perlu diperbaiki, boleh langsung kabari kami. Terima kasih.`,
    });

    if (isManualQris || isTransfer) {
      templates.push({
        id: 'manual-payment-follow-up',
        title: isManualQris ? 'Follow-up QRIS manual' : 'Follow-up transfer manual',
        description: 'Kirim jika customer belum mengirim bukti pembayaran.',
        recommended: ['pending', 'processing'].includes(status),
        text: `Assalamu’alaikum ${greetingName}, untuk pesanan kakak di Toko Herbal Amimum:\n\n${orderSummary}\n\n${isTransfer ? `Silakan transfer ke rekening resmi toko:\nBank: ${STORE_BANK_ACCOUNT.bank}\nNo. Rekening: ${STORE_BANK_ACCOUNT.number}\nAtas Nama: ${STORE_BANK_ACCOUNT.accountName}` : 'Pembayaran bisa dilakukan melalui QRIS resmi toko.'}\n\nSetelah pembayaran, mohon kirim bukti pembayaran di sini ya kak agar pesanan segera kami proses.`,
      });

      templates.push({
        id: 'payment-confirmed',
        title: 'Pembayaran diterima',
        description: 'Kirim setelah pembayaran manual sudah dicek masuk.',
        text: `Alhamdulillah ${greetingName}, pembayaran pesanan kakak sudah kami terima.\n\n${orderSummary}\n\nProduk:\n${itemsText}\n\nPesanan akan kami siapkan dan packing. Nanti kalau sudah dikirim, kami informasikan nomor resinya ya kak.`,
      });
    }

    if (isCod) {
      templates.push({
        id: 'cod-confirmation',
        title: 'Konfirmasi COD',
        description: 'Kirim untuk mengingatkan pembayaran saat paket diterima.',
        recommended: ['pending', 'processing'].includes(status),
        text: `Assalamu’alaikum ${greetingName}, pesanan kakak akan kami proses dengan metode COD.\n\n${orderSummary}\n\nProduk:\n${itemsText}${shippingBlock}\n\nMohon siapkan pembayaran sebesar ${totalText} saat paket diterima ya kak.`,
      });
    }

    if (isCash || deliveryType === 'pickup') {
      templates.push({
        id: 'pickup-ready',
        title: 'Pickup / bayar di toko',
        description: 'Kirim jika pesanan pickup siap diambil.',
        recommended: deliveryType === 'pickup' && ['processing', 'paid', 'settlement', 'capture'].includes(status),
        text: `Assalamu’alaikum ${greetingName}, pesanan kakak di Toko Herbal Amimum sudah siap diambil.\n\n${orderSummary}\n\nProduk:\n${itemsText}\n\nSilakan konfirmasi jadwal pengambilan terlebih dulu ya kak.`,
      });
    }

    templates.push({
      id: 'packing-update',
      title: 'Sedang dipacking',
      description: 'Kirim saat stok aman dan barang mulai disiapkan.',
      recommended: status === 'processing',
      text: `Assalamu’alaikum ${greetingName}, pesanan kakak sedang kami siapkan dan packing.\n\n${orderSummary}\n\nProduk:\n${itemsText}${shippingBlock}\n\nNanti kalau sudah dikirim, kami informasikan nomor resinya ya kak.`,
    });

    if (deliveryType === 'delivery' && trackingCodeForTemplate) {
      templates.push({
        id: 'tracking-sent',
        title: 'Kirim resi',
        description: 'Muncul otomatis saat No. Resi/Kode Tracking sudah ada.',
        recommended: ['shipped', 'completed'].includes(status),
        text: `Assalamu’alaikum ${greetingName}, pesanan kakak sudah kami kirim.\n\nNo. Order: ${orderRef}\nKurir: ${courierName}${courierService !== '-' ? ` (${courierService})` : ''}\nNo. Resi: ${trackingCodeForTemplate}\nTotal: ${totalText}\n\nProduk:\n${itemsText}${shippingBlock}\n\nSilakan dicek berkala ya kak. Terima kasih sudah berbelanja di Toko Herbal Amimum.`,
      });
    }

    templates.push({
      id: 'cancelled',
      title: 'Pesanan dibatalkan',
      description: 'Gunakan hanya jika customer batal/order tidak dilanjutkan.',
      recommended: ['cancelled', 'failed'].includes(status),
      text: `Baik ${greetingName}, pesanan kakak kami bantu batalkan ya.\n\n${orderSummary}\n\nTerima kasih sudah mengabari. Semoga lain waktu bisa berbelanja lagi di Toko Herbal Amimum.`,
    });

    return templates.sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)));
  }, [courierName, customerName, itemSummary, order, paymentMethod, totalText, trackingCodeForTemplate]);

  const copyChatTemplate = async (template: ChatTemplate) => {
    try {
      await navigator.clipboard.writeText(template.text);
      toast.success(`Template "${template.title}" disalin.`);
    } catch {
      toast.error('Gagal menyalin template. Silakan copy manual dari teks yang tampil.');
    }
  };

  const openWhatsAppTemplate = (template: ChatTemplate) => {
    const encodedText = encodeURIComponent(template.text);
    const target = customerWhatsApp ? `/${customerWhatsApp}` : '';
    window.open(`https://wa.me${target}?text=${encodedText}`, '_blank', 'noopener,noreferrer');
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const payload = {
        status,
        ...(trackingCode.trim() ? { code_tracking: trackingCode.trim() } : {}),
      };
      try {
        const response = await api.patch<UpdateOrderStatusResponse>(`/admin/orders/${orderId}/status`, payload);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<any>;
        const responseStatus = axiosError.response?.status;

        if (responseStatus === 404 || responseStatus === 405) {
          const fallbackResponse = await api.put<UpdateOrderStatusResponse>(`/admin/orders/${orderId}/status`, payload);
          return fallbackResponse.data;
        }

        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Status order berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', orderId] });
      setNextStatus('');
    },
    onError: (error: any) => {
      toast.error(getAdminSafeErrorMessage(error, t('orderDetailPage.updateError')));
    },
  });

  const submitStatusUpdate = () => {
    if (!nextStatus) {
      toast.error(t('orderDetailPage.selectStatusError'));
      return;
    }

    if (nextStatus === 'shipped' && order?.delivery_type === 'delivery' && !trackingCode.trim()) {
      toast.error('Isi No. Resi / Kode Tracking sebelum mengubah status menjadi Dikirim.');
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
              {t('orderDetailPage.back')}
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('orderDetailPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('orderDetailPage.subtitle')}</p>
        </div>
        {order ? (
          <Badge className={`border-none px-3 py-2 rounded-xl ${getStatusStyle(orderStatusStyles, order.status)}`}>
            {getStatusLabel(orderStatusLabels, order.status)}
          </Badge>
        ) : null}
      </div>

      {orderDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('orderDetailPage.loading')}
          </CardContent>
        </Card>
      ) : orderDetailQuery.isError || !order ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            {t('orderDetailPage.loadError')}
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
                <Badge className="bg-slate-100 text-slate-700 border-none">{t('orderDetailPage.adminView')}</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 break-all">{order.id}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('orderDetailPage.customer')}: {extractBuyerFromNotes(order.notes) || order.customer_name || t('paymentsPage.table.unknownCustomer')}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>{t('orderDetailPage.status')}</span>
                  <strong className="text-slate-900 capitalize">{getStatusLabel(orderStatusLabels, order.status)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t('orderDetailPage.deliveryType')}</span>
                  <strong className="text-slate-900 capitalize">{getStatusLabel(deliveryTypeLabels, order.delivery_type)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t('orderDetailPage.totalOrder')}</span>
                  <strong className="text-slate-900">Rp {Number(order.total_price || 0).toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t('orderDetailPage.shippingCost')}</span>
                  <strong className="text-slate-900">{order.shipping_cost == null ? 'Belum tersedia' : `Rp ${Number(order.shipping_cost).toLocaleString('id-ID')}`}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>{t('orderDetailPage.notes')}</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">
                    {sanitizeOrderNotes(order.notes)}
                  </strong>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-900 text-white p-4 text-sm flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><Package2 className="w-4 h-4" />{t('orderDetailPage.totalItems')}</span>
                <strong>{groupedOrderItems.length}</strong>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">{t('orderDetailPage.updateTitle')}</h3>
                  <p className="text-sm text-emerald-700 mt-1">{t('orderDetailPage.updateDescription')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order-status-next">{t('orderDetailPage.newStatus')}</Label>
                  <select
                    id="order-status-next"
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="h-11 rounded-xl border border-emerald-200 bg-white px-3 text-sm text-gray-700 outline-none w-full"
                  >
                    <option value="">{t('orderDetailPage.selectStatus')}</option>
                    {orderStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {getStatusLabel(orderStatusLabels, status)}
                      </option>
                    ))}
                  </select>
                </div>
                {order.delivery_type === 'delivery' && order.my_shipping ? (
                  <div className="space-y-2">
                    <Label htmlFor="order-tracking-code">No. Resi / Kode Tracking</Label>
                    <Input
                      id="order-tracking-code"
                      value={trackingCode}
                      onChange={(event) => setTrackingCode(event.target.value.slice(0, 50))}
                      placeholder="Contoh: JNE123456789"
                      className="h-11 rounded-xl border-emerald-200 bg-white"
                    />
                    <p className="text-xs text-emerald-700">
                      Isi resi saat pesanan dikirim. Resi akan tampil di halaman tracking customer.
                    </p>
                  </div>
                ) : null}
                <Button type="button" onClick={submitStatusUpdate} disabled={updateStatusMutation.isPending} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  {updateStatusMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('orderDetailPage.updating')}</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />{t('orderDetailPage.updateButton')}</>
                  )}
                </Button>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-amber-700 shadow-sm">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950 uppercase tracking-wider">Template Chat Otomatis</h3>
                    <p className="text-sm text-amber-800 mt-1">
                      Pilih template sesuai kondisi order, lalu copy atau buka WhatsApp customer.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/80 px-3 py-2 text-xs text-amber-900">
                  Customer: <strong>{customerName || '-'}</strong> · WA: <strong>{customerPhone || 'belum tersedia'}</strong>
                </div>

                <div className="space-y-3">
                  {chatTemplates.map((template) => (
                    <div key={template.id} className={`rounded-2xl border p-3 ${template.recommended ? 'border-amber-300 bg-white' : 'border-amber-100 bg-white/75'}`}>
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{template.title}</p>
                            {template.recommended ? (
                              <Badge className="border-none bg-amber-100 text-amber-800">Disarankan</Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{template.description}</p>
                        </div>
                        <pre className="max-h-36 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                          {template.text}
                        </pre>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button type="button" variant="outline" className="rounded-xl border-amber-200 bg-white" onClick={() => copyChatTemplate(template)}>
                            <Copy className="w-4 h-4 mr-2" /> Copy
                          </Button>
                          <Button type="button" className="rounded-xl bg-green-600 hover:bg-green-700" onClick={() => openWhatsAppTemplate(template)}>
                            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('orderDetailPage.itemsTitle')}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t('orderDetailPage.itemsSubtitle')}</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 space-y-4">
                {groupedOrderItems.length ? groupedOrderItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900">{item.product_name || '-'}</p>
                        <p className="text-sm text-gray-500">{t('orderDetailPage.variant')}: {item.variant_product || '-'}</p>
                      </div>
                      <Badge className="bg-slate-100 text-slate-700 border-none w-fit">{t('orderDetailPage.qty')} {item.quantity || 0}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-600">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">{t('orderDetailPage.pricePerItem')}</p>
                        <p className="font-semibold text-gray-900">Rp {Number(item.price_per_item || 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">{t('orderDetailPage.variantDiscount')}</p>
                        <p className="font-semibold text-gray-900">{Number(item.variant_discount || 0)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wide">{t('orderDetailPage.subtotal')}</p>
                        <p className="font-semibold text-gray-900">Rp {Number(item.total_price || 0).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                    {t('orderDetailPage.emptyItems')}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{t('orderDetailPage.shippingSnapshot')}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t('orderDetailPage.shippingSubtitle')}</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8">
                {order.my_shipping ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-semibold"><MapPinned className="w-4 h-4" />{t('orderDetailPage.address')}</div>
                      <p>{order.my_shipping.my_address?.name || '-'}</p>
                      <p>{order.my_shipping.my_address?.phone || '-'}</p>
                      <p>{order.my_shipping.my_address?.address || '-'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-semibold"><Truck className="w-4 h-4" />{t('orderDetailPage.courier')}</div>
                      <p>{order.my_shipping.my_courier?.courier_name || '-'}</p>
                      <p>{t('orderDetailPage.service')}: {order.my_shipping.my_courier?.service_type || '-'}</p>
                      <p>{t('orderDetailPage.estimate')}: {order.my_shipping.my_courier?.estimated_delivery || '-'}</p>
                      <p>{t('orderDetailPage.cost')}: {order.my_shipping.my_courier?.cost == null ? 'Belum tersedia' : `Rp ${Number(order.my_shipping.my_courier.cost).toLocaleString('id-ID')}`}</p>
                      <p>No. Resi: {order.my_shipping.code_tracking || 'Belum tersedia'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                    {t('orderDetailPage.emptyShipping')}
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
