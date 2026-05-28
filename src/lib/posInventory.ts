import api from './api';

export type PaymentMethod = 'cash' | 'transfer' | 'qris';

export interface PosCheckoutItemPayload {
  variant_id: number;
  product_id?: string;
  qty: number;
  unit_price: number;
  discount: number;
}

export interface PosCheckoutPayload {
  cashier_id: string;
  payment_method: PaymentMethod;
  notes?: string;
  subtotal?: number;
  discount_total?: number;
  final_total?: number;
  items: PosCheckoutItemPayload[];
}

export interface StockMovementItem {
  id: string;
  variant_id: number;
  product_id?: string;
  movement_type: 'in' | 'out' | 'adjust' | 'sale' | 'return' | 'snapshot';
  delta: number;
  stock_before?: number;
  stock_after?: number;
  actor_id?: string;
  reason?: string;
  reference?: string;
  created_at: string;
}

export interface StockMovementListResponse {
  items: StockMovementItem[];
  page: number;
  limit: number;
  total: number;
}

export async function posCheckout(payload: PosCheckoutPayload) {
  try {
    // 1. Coba panggil endpoint resmi POS checkout terlebih dahulu
    const response = await api.post('/admin/pos/checkout', payload);
    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    // Jika backend mengembalikan 404 atau 405, berarti endpoint /admin/pos/checkout belum ada.
    // Kita gunakan fallback compatibility mode (cart checkout).
    if (status === 404 || status === 405) {
      const cartOps: Array<() => Promise<unknown>> = [];

      for (const item of payload.items) {
        if (!item.product_id) {
          throw new Error(`Variant ${item.variant_id} tidak punya product_id, checkout tidak bisa dilanjutkan.`);
        }

        for (let i = 0; i < item.qty; i++) {
          cartOps.push(() => api.post(`/cart/product/${item.product_id}/${item.variant_id}`, {
            product_id: item.product_id,
            variant_id: item.variant_id,
          }));
        }
      }

      const concurrency = 5;
      for (let i = 0; i < cartOps.length; i += concurrency) {
        const chunk = cartOps.slice(i, i + concurrency);
        await Promise.all(chunk.map((run) => run()));
      }

      const response = await api.post('/orders/checkout', {
        notes: payload.notes,
        payment_method: payload.payment_method,
      });

      return {
        ...response.data,
        compatibility_mode: true,
      };
    }
    // Jika error lain (seperti 400 bad request, 409 out of stock), lempar kembali
    throw error;
  }
}

export async function getStockMovements(params: {
  from?: string;
  to?: string;
  variant_id?: number;
  product_id?: string;
  movement_type?: string;
  page?: number;
  limit?: number;
}) {
  const response = await api.get('/admin/inventory/movements', { params });
  return response.data as { data: StockMovementListResponse };
}

export async function adjustStock(payload: {
  variant_id: number;
  delta: number;
  reason: string;
  reference?: string;
}) {
  const response = await api.post('/admin/inventory/adjust', payload);
  return response.data;
}

export async function setVariantThreshold(variantId: number, minThreshold: number) {
  const response = await api.put(`/admin/inventory/threshold/${variantId}`, {
    min_threshold: minThreshold,
  });
  return response.data;
}
