import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { posCheckout, type PaymentMethod } from '@/lib/posInventory';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/store/authStore';

type ProductItem = {
  id: string;
  name: string;
};

type VariantItem = {
  id?: number;
  product_id?: string;
  product?: string;
  name?: string;
  variant?: string | null;
  stock?: number;
  price?: number | null;
  discount?: number | null;
};

interface ProductResponse {
  data: ProductItem[];
}

interface VariantResponse {
  data: VariantItem[];
}

type CartItem = {
  variantId: number;
  productId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  stock: number;
  qty: number;
};

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

export default function CashierPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const user = useAuthStore((state) => state.user);

  const { data: productsResponse } = useQuery({
    queryKey: ['cashier-products'],
    queryFn: async () => {
      const response = await api.get<ProductResponse>('/product/all');
      return response.data;
    },
  });

  const { data: variantsResponse, isLoading: variantsLoading, isError: variantsError } = useQuery({
    queryKey: ['cashier-variants'],
    queryFn: async () => {
      const response = await api.get<VariantResponse>('/type/all');
      return response.data;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User session tidak valid. Silakan login ulang.');

      try {
        return await posCheckout({
          cashier_id: user.id,
          payment_method: paymentMethod,
          notes: notes || undefined,
          items: cart.map((item) => ({
            variant_id: item.variantId,
            qty: item.qty,
            unit_price: item.unitPrice,
            discount: 0,
          })),
        });
      } catch (error: any) {
        const statusCode = error?.response?.status;

        // Compatibility fallback untuk backend yang belum punya endpoint /admin/pos/checkout
        if (statusCode === 404 || statusCode === 405) {
          for (const item of cart) {
            if (!item.productId) {
              throw new Error(`Variant ${item.variantId} tidak punya product_id, checkout tidak bisa dilanjutkan.`);
            }

            // tambah item ke cart user sesuai qty
            for (let i = 0; i < item.qty; i++) {
              await api.post(`/cart/product/${item.productId}/${item.variantId}`, {
                product_id: item.productId,
                variant_id: item.variantId,
              });
            }
          }

          const compatCheckout = await api.post('/orders/checkout');
          return {
            ...compatCheckout.data,
            compatibility_mode: true,
          };
        }

        throw error;
      }
    },
    onSuccess: (response: any) => {
      const trx = response?.data?.transaction_id;
      const isCompat = response?.compatibility_mode;
      if (isCompat) {
        toast.success('Checkout sukses (mode kompatibilitas /orders/checkout).');
      } else {
        toast.success(trx ? `Checkout sukses (${trx})` : 'Checkout POS sukses.');
      }
      setCart([]);
      setNotes('');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        'Checkout gagal. Mohon cek endpoint backend POS/Orders.';
      toast.error(String(message));
    },
  });

  const productLookup = useMemo(() => {
    const rows = productsResponse?.data ?? [];
    return new Map(rows.map((item) => [String(item.id), item.name]));
  }, [productsResponse?.data]);

  const cashierVariants = useMemo(() => {
    const rows = variantsResponse?.data ?? [];

    return rows
      .filter((item): item is VariantItem & { id: number } => typeof item.id === 'number')
      .map((item) => {
        const basePrice = Number(item.price ?? 0);
        const discount = Number(item.discount ?? 0);
        const finalPrice = Math.max(basePrice - discount, 0);

        const productName =
          (item.product && item.product.trim()) ||
          (item.product_id ? productLookup.get(String(item.product_id)) : undefined) ||
          '-';

        const variantName = [item.name, item.variant].filter(Boolean).join(' - ') || `Variant #${item.id}`;

        return {
          id: item.id,
          productId: String(item.product_id || ''),
          productName,
          variantName,
          stock: Number(item.stock ?? 0),
          finalPrice,
        };
      });
  }, [variantsResponse?.data, productLookup]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cashierVariants;

    return cashierVariants.filter((item) => {
      return (
        item.productName.toLowerCase().includes(q) ||
        item.variantName.toLowerCase().includes(q) ||
        String(item.id).includes(q)
      );
    });
  }, [cashierVariants, search]);

  const addToCart = (item: (typeof cashierVariants)[number]) => {
    if (item.stock <= 0) {
      toast.error('Stok variant ini kosong.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((row) => row.variantId === item.id);
      if (existing) {
        if (existing.qty >= existing.stock) {
          toast.error('Qty melebihi stok yang tersedia.');
          return prev;
        }

        return prev.map((row) =>
          row.variantId === item.id
            ? {
                ...row,
                qty: row.qty + 1,
              }
            : row
        );
      }

      return [
        ...prev,
        {
          variantId: item.id,
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName,
          unitPrice: item.finalPrice,
          stock: item.stock,
          qty: 1,
        },
      ];
    });
  };

  const updateQty = (variantId: number, nextQty: number) => {
    setCart((prev) =>
      prev.map((row) => {
        if (row.variantId !== variantId) return row;
        const safeQty = Math.max(1, Math.min(nextQty || 1, row.stock));
        return { ...row, qty: safeQty };
      })
    );
  };

  const removeFromCart = (variantId: number) => {
    setCart((prev) => prev.filter((row) => row.variantId !== variantId));
  };

  const subtotal = cart.reduce((sum, row) => sum + row.unitPrice * row.qty, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kasir (POS)</h1>
        <p className="text-sm text-gray-600 mt-1">Integrasi awal sudah aktif ke data produk/variant live untuk simulasi cart kasir internal.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="w-4 h-4" /> Pilih Variant</CardTitle>
            <CardDescription>Data diambil dari endpoint existing: /product/all dan /type/all</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari produk/variant/id..." />

            {variantsLoading ? (
              <p className="text-sm text-gray-500">Memuat variant...</p>
            ) : variantsError ? (
              <p className="text-sm text-red-600">Gagal memuat data variant dari API.</p>
            ) : (
              <div className="max-h-[460px] overflow-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variant</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Stok</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{item.productName}</div>
                          <div className="text-xs text-gray-500">{item.variantName}</div>
                        </TableCell>
                        <TableCell>{formatRupiah(item.finalPrice)}</TableCell>
                        <TableCell>{item.stock}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" onClick={() => addToCart(item)} disabled={item.stock <= 0}>Tambah</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-sm text-gray-500">Tidak ada variant sesuai pencarian.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Keranjang Kasir</CardTitle>
            <CardDescription>Checkout sudah diwire ke endpoint POS (`/admin/pos/checkout`) dengan fallback error aman.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-[330px] overflow-auto pr-1">
              {cart.map((row) => (
                <div key={row.variantId} className="rounded-xl border p-3">
                  <p className="font-medium text-gray-900 text-sm">{row.productName}</p>
                  <p className="text-xs text-gray-500">{row.variantName}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={row.stock}
                      value={row.qty}
                      onChange={(e) => updateQty(row.variantId, Number(e.target.value))}
                      className="h-9"
                    />
                    <Button variant="outline" size="sm" onClick={() => removeFromCart(row.variantId)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{row.qty} × {formatRupiah(row.unitPrice)}</p>
                </div>
              ))}
              {cart.length === 0 && <p className="text-sm text-gray-500">Keranjang masih kosong.</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
                <option value="qris">QRIS</option>
              </select>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)" />
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              <Button className="w-full mt-3" disabled={cart.length === 0 || checkoutMutation.isPending} onClick={() => checkoutMutation.mutate()}>
                {checkoutMutation.isPending ? 'Memproses...' : 'Checkout POS'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
