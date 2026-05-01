import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingCart, Trash2, ReceiptText, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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

interface AdminOrderItem {
  id: string;
  total_price: number;
  notes?: string | null;
  created_at: string;
  customer_name?: string | null;
}

interface AdminOrderDetailData {
  id: string;
  order_item_lists: Array<{
    id: number;
    product_name?: string | null;
    variant_product?: string | null;
    quantity?: number | null;
    price_per_item?: number | null;
    total_price?: number | null;
  }>;
}

interface AdminOrderDetailResponse {
  status_code: number;
  message: string;
  data: AdminOrderDetailData;
}

interface AdminPaymentInfo {
  id: string;
  order_id: string;
  payment_type?: string | null;
  transaction_status: string;
}

interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T[];
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

type ReceiptItem = CartItem;
type ReceiptData = {
  transactionId: string;
  createdAt: string;
  cashierName: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: ReceiptItem[];
  subtotal: number;
  total: number;
};

const RECEIPT_STORAGE_KEY = 'amimum.pos.receipts.v1';

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

export default function CashierPage() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [receiptHistory, setReceiptHistory] = useState<ReceiptData[]>([]);
  const [receiptQuery, setReceiptQuery] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECEIPT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ReceiptData[];
        setReceiptHistory(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      setReceiptHistory([]);
    }
  }, []);

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

  const { data: backendOrdersResponse } = useQuery({
    queryKey: ['cashier-receipt-history-backend'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AdminOrderItem>>('/admin/orders', {
        params: { limit: 100, skip: 0 },
      });
      return response.data;
    },
  });

  const { data: backendPaymentsResponse } = useQuery({
    queryKey: ['cashier-receipt-payments-backend'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<AdminPaymentInfo>>('/admin/payments', {
        params: { limit: 100, skip: 0 },
      });
      return response.data;
    },
  });

  useEffect(() => {
    const backendOrders = backendOrdersResponse?.data || [];
    if (!backendOrders.length) return;

    const paymentRows = backendPaymentsResponse?.data || [];
    const paymentMap = new Map(paymentRows.map((p) => [String(p.order_id), p]));

    const normalizePaymentMethod = (value?: string | null): PaymentMethod => {
      const v = String(value || '').toLowerCase();
      if (v.includes('qris') || v.includes('gopay') || v.includes('shopeepay') || v.includes('ovo')) return 'qris';
      if (v.includes('bank') || v.includes('transfer') || v.includes('va') || v.includes('permata') || v.includes('bca') || v.includes('bni') || v.includes('bri')) return 'transfer';
      return 'cash';
    };

    const mapped: ReceiptData[] = backendOrders.map((o) => {
      const paymentInfo = paymentMap.get(String(o.id));
      return {
        transactionId: String(o.id),
        createdAt: o.created_at,
        cashierName: o.customer_name || 'Kasir',
        paymentMethod: normalizePaymentMethod(paymentInfo?.payment_type),
        notes: o.notes || undefined,
        items: [],
        subtotal: Number(o.total_price || 0),
        total: Number(o.total_price || 0),
      };
    });

    setReceiptHistory((prev) => {
      const merged = [...mapped, ...prev].reduce<ReceiptData[]>((acc, curr) => {
        if (!acc.find((x) => x.transactionId === curr.transactionId)) acc.push(curr);
        return acc;
      }, []);
      localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(merged.slice(0, 500)));
      return merged.slice(0, 500);
    });
  }, [backendOrdersResponse, backendPaymentsResponse]);

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
      const trx = response?.data?.transaction_id || response?.data?.order_id || `POS-${Date.now()}`;
      const isCompat = response?.compatibility_mode;
      if (isCompat) {
        toast.success('Checkout sukses (mode kompatibilitas /orders/checkout).');
      } else {
        toast.success(trx ? `Checkout sukses (${trx})` : 'Checkout POS sukses.');
      }

      const receiptPayload: ReceiptData = {
        transactionId: String(trx),
        createdAt: new Date().toISOString(),
        cashierName: [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.name || user?.email || 'Cashier',
        paymentMethod,
        notes: notes || undefined,
        items: cart,
        subtotal,
        total: subtotal,
      };

      setLastReceipt(receiptPayload);
      setSelectedReceiptId(receiptPayload.transactionId);
      setReceiptHistory((prev) => {
        const next = [receiptPayload, ...prev].slice(0, 500);
        localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      setCart([]);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['cashier-receipt-history-backend'] });
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

  const handlePrintReceipt = () => {
    const target = document.getElementById('receipt-detail-print-area');
    if (!target) {
      toast.error('Detail nota belum tersedia untuk dicetak.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast.error('Popup diblokir browser. Izinkan pop-up untuk cetak nota.');
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Detail Nota Pembayaran</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; text-align: left; }
        th { background: #f9fafb; }
      </style>
    </head><body>${target.innerHTML}<script>window.print();</script></body></html>`);
    printWindow.document.close();
  };

  const filteredReceipts = useMemo(() => {
    const q = receiptQuery.trim().toLowerCase();
    return receiptHistory.filter((receipt) => {
      const hitQuery = !q
        || receipt.transactionId.toLowerCase().includes(q)
        || receipt.cashierName.toLowerCase().includes(q)
        || String(receipt.paymentMethod).toLowerCase().includes(q);
      const hitDate = !receiptDate || receipt.createdAt.slice(0, 10) === receiptDate;
      return hitQuery && hitDate;
    });
  }, [receiptHistory, receiptQuery, receiptDate]);

  const selectedReceipt = useMemo(() => {
    if (!selectedReceiptId) return lastReceipt;
    return receiptHistory.find((r) => r.transactionId === selectedReceiptId) || lastReceipt;
  }, [receiptHistory, selectedReceiptId, lastReceipt]);

  const { data: selectedOrderDetailResponse } = useQuery({
    queryKey: ['cashier-receipt-order-detail', selectedReceipt?.transactionId],
    queryFn: async () => {
      const response = await api.get<AdminOrderDetailResponse>(`/admin/orders/${selectedReceipt?.transactionId}`);
      return response.data;
    },
    enabled: !!selectedReceipt?.transactionId,
  });

  const selectedReceiptWithItems = useMemo(() => {
    if (!selectedReceipt) return null;
    const orderItems = selectedOrderDetailResponse?.data?.order_item_lists || [];
    if (!orderItems.length) return selectedReceipt;

    const mappedItems: ReceiptItem[] = orderItems.map((item) => ({
      variantId: Number(item.id || 0),
      productId: String(selectedReceipt.transactionId),
      productName: item.product_name || 'Produk',
      variantName: item.variant_product || '-',
      unitPrice: Number(item.price_per_item || 0),
      stock: 0,
      qty: Number(item.quantity || 0),
    }));

    const computedTotal = mappedItems.reduce((sum, row) => sum + (row.unitPrice * row.qty), 0);

    return {
      ...selectedReceipt,
      items: mappedItems,
      subtotal: computedTotal || selectedReceipt.subtotal,
      total: computedTotal || selectedReceipt.total,
    };
  }, [selectedReceipt, selectedOrderDetailResponse]);

  const exportReceiptPdf = (receipt: ReceiptData) => {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Nota ${receipt.transactionId}</title></head><body>
      <h2>Nota Pembayaran</h2>
      <p>No: ${receipt.transactionId}</p>
      <p>Tanggal: ${new Date(receipt.createdAt).toLocaleString('id-ID')}</p>
      <p>Kasir: ${receipt.cashierName}</p>
      <p>Pembayaran: ${String(receipt.paymentMethod).toUpperCase()}</p>
      <hr/>
      ${receipt.items.map((i) => `<div>${i.productName} (${i.variantName}) - ${i.qty} x ${formatRupiah(i.unitPrice)} = ${formatRupiah(i.qty * i.unitPrice)}</div>`).join('')}
      <hr/><h3>Total: ${formatRupiah(receipt.total)}</h3>
      ${receipt.notes ? `<p>Catatan: ${receipt.notes}</p>` : ''}
      <script>window.print();</script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return toast.error('Popup diblokir browser. Izinkan pop-up untuk export PDF.');
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

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

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Nota Kasir</CardTitle>
          <CardDescription>Cek ulang transaksi dengan filter tanggal dan pencarian cepat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Input placeholder="Cari no transaksi/kasir/metode" value={receiptQuery} onChange={(e) => setReceiptQuery(e.target.value)} />
            <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
            <Button variant="outline" onClick={() => { setReceiptQuery(''); setReceiptDate(''); }}>Reset Filter</Button>
          </div>
          <div className="rounded-xl border overflow-auto max-h-[260px]">
            <Table>
              <TableHeader><TableRow><TableHead>Transaksi</TableHead><TableHead>Tanggal</TableHead><TableHead>Kasir</TableHead><TableHead>Total</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredReceipts.map((r) => (
                  <TableRow key={r.transactionId}>
                    <TableCell>{r.transactionId}</TableCell>
                    <TableCell>{new Date(r.createdAt).toLocaleString('id-ID')}</TableCell>
                    <TableCell>{r.cashierName}</TableCell>
                    <TableCell>{formatRupiah(r.total)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedReceiptId(r.transactionId)}>Detail</Button>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/orders/${r.transactionId}`)}>Audit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReceipts.length === 0 && <TableRow><TableCell colSpan={5} className="text-sm text-gray-500">Belum ada data nota.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedReceiptWithItems && (
        <Card id="receipt-detail-print-area" className="print:shadow-none print:border-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ReceiptText className="w-4 h-4" /> Detail Nota Pembayaran</CardTitle>
              <CardDescription>Audit-ready detail transaksi kasir.</CardDescription>
            </div>
            <div className="flex gap-2 print:hidden">
              <Button variant="outline" onClick={handlePrintReceipt}><Printer className="w-4 h-4 mr-2" />Cetak Nota</Button>
              <Button variant="outline" onClick={() => exportReceiptPdf(selectedReceiptWithItems)}>Export PDF</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-bold text-gray-900">Toko Herbal AmImUm</p>
                  <p className="text-xs text-gray-500">Nota Pembayaran Resmi (POS Internal)</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-semibold text-emerald-600">PAID</p>
                </div>
              </div>
              <div className="mt-3 h-px bg-gray-100" />
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm">
                <p><strong>No. Nota:</strong> {selectedReceiptWithItems.transactionId}</p>
                <p><strong>Tanggal:</strong> {new Date(selectedReceiptWithItems.createdAt).toLocaleString('id-ID')}</p>
                <p><strong>Kasir:</strong> {selectedReceiptWithItems.cashierName}</p>
                <p><strong>Metode Bayar:</strong> {String(selectedReceiptWithItems.paymentMethod).toUpperCase()}</p>
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Harga</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader><TableBody>
                {selectedReceiptWithItems.items.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-sm text-gray-500">Detail item belum tersedia pada transaksi ini.</TableCell></TableRow>
                ) : selectedReceiptWithItems.items.map((row) => (
                  <TableRow key={`r-${selectedReceiptWithItems.transactionId}-${row.variantId}`}>
                    <TableCell>{row.productName} <span className="text-xs text-gray-500">({row.variantName})</span></TableCell>
                    <TableCell>{row.qty}</TableCell><TableCell>{formatRupiah(row.unitPrice)}</TableCell><TableCell className="text-right">{formatRupiah(row.unitPrice * row.qty)}</TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </div>

            {selectedReceiptWithItems.notes && <p><strong>Catatan:</strong> {selectedReceiptWithItems.notes}</p>}

            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-2">
              <div className="flex items-center justify-between"><span>Subtotal</span><span>{formatRupiah(selectedReceiptWithItems.subtotal)}</span></div>
              <div className="flex items-center justify-between"><span>Diskon</span><span>{formatRupiah(0)}</span></div>
              <div className="h-px bg-gray-200" />
              <div className="flex items-center justify-between text-base font-bold"><span>Total Bayar</span><span>{formatRupiah(selectedReceiptWithItems.total)}</span></div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Terima kasih telah bertransaksi di Toko Herbal AmImUm.</p>
              <p>Nota ini sah tanpa tanda tangan. Simpan nota untuk kebutuhan komplain/retur sesuai kebijakan toko.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
