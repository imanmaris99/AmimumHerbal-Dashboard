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
  for (const item of payload.items) {
    if (!item.product_id) {
      throw new Error(`Variant ${item.variant_id} tidak punya product_id, checkout tidak bisa dilanjutkan.`);
    }

    for (let i = 0; i < item.qty; i++) {
      await api.post(`/cart/product/${item.product_id}/${item.variant_id}`, {
        product_id: item.product_id,
        variant_id: item.variant_id,
      });
    }
  }

  const response = await api.post('/orders/checkout');
  return {
    ...response.data,
    compatibility_mode: true,
  };
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
