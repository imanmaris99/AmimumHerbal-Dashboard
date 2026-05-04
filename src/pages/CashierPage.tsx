import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingCart, Trash2, ReceiptText, Printer, History } from 'lucide-react';
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
  brand_info?: {
    id?: number;
    name?: string;
    category?: string;
  } | null;
};

type VariantItem = {
  id?: number;
  product_id?: string;
  product?: string;
  name?: string;
  variant?: string | null;
  img?: string | null;
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
  customer_email?: string | null;
}

interface AdminOrderInfoDetail {
  customer_name?: string | null;
  notes?: string | null;
  created_at?: string;
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

type DiscountType = 'amount' | 'percent';

type CartItem = {
  variantId: number;
  productId: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  stock: number;
  qty: number;
  discountType: DiscountType;
  discountInput: number;
  discountValue: number;
};

type ReceiptItem = CartItem;
type ReceiptData = {
  transactionId: string;
  createdAt: string;
  cashierName: string;
  buyerName?: string;
  buyerEmail?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  items: ReceiptItem[];
  subtotal: number;
  total: number;
};

const RECEIPT_STORAGE_KEY = 'amimum.pos.receipts.v1';
const RECEIPT_DELETED_IDS_KEY = 'amimum.pos.receipts.deleted.v1';
const BT_PRINTER_DEVICE_ID_KEY = 'amimum.pos.btPrinterDeviceId.v1';

const formatRupiah = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

export default function CashierPage() {
  const [search, setSearch] = useState('');
  const [selectedProducer, setSelectedProducer] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [stockView, setStockView] = useState<'all' | 'low'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [receiptHistory, setReceiptHistory] = useState<ReceiptData[]>([]);
  const [receiptQuery, setReceiptQuery] = useState('');
  const [receiptDate, setReceiptDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedReceiptId, setSelectedReceiptId] = useState<string>('');
  const [deletedReceiptIds, setDeletedReceiptIds] = useState<string[]>([]);
  const [printPaper, setPrintPaper] = useState<'58' | '80'>('58');
  const [isBtPrinting, setIsBtPrinting] = useState(false);
  const [showReceiptHistory, setShowReceiptHistory] = useState(false);
  const [checkoutStartedAt, setCheckoutStartedAt] = useState<number | null>(null);
  const [checkoutElapsedSec, setCheckoutElapsedSec] = useState(0);
  const receiptDetailRef = useRef<HTMLDivElement | null>(null);
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

      const deletedRaw = localStorage.getItem(RECEIPT_DELETED_IDS_KEY);
      if (deletedRaw) {
        const parsedDeleted = JSON.parse(deletedRaw) as string[];
        setDeletedReceiptIds(Array.isArray(parsedDeleted) ? parsedDeleted : []);
      }
    } catch {
      setReceiptHistory([]);
      setDeletedReceiptIds([]);
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

    // Source of truth: backend orders.
    // If backend is empty (e.g. DB reset), clear cached local receipt history.
    if (!backendOrders.length) {
      setReceiptHistory([]);
      setDeletedReceiptIds([]);
      localStorage.removeItem(RECEIPT_STORAGE_KEY);
      localStorage.removeItem(RECEIPT_DELETED_IDS_KEY);
      if (selectedReceiptId) setSelectedReceiptId('');
      return;
    }

    const paymentRows = backendPaymentsResponse?.data || [];
    const paymentMap = new Map(paymentRows.map((p) => [String(p.order_id), p]));

    const normalizePaymentMethod = (value?: string | null): PaymentMethod => {
      const v = String(value || '').toLowerCase();
      if (v.includes('qris') || v.includes('gopay') || v.includes('shopeepay') || v.includes('ovo')) return 'qris';
      if (v.includes('bank') || v.includes('transfer') || v.includes('va') || v.includes('permata') || v.includes('bca') || v.includes('bni') || v.includes('bri')) return 'transfer';
      return 'cash';
    };

    const mapped: ReceiptData[] = backendOrders
      .filter((o) => !deletedReceiptIds.includes(String(o.id)))
      .map((o) => {
      const paymentInfo = paymentMap.get(String(o.id));
      return {
        transactionId: String(o.id),
        createdAt: o.created_at,
        cashierName: 'Kasir Toko',
        buyerName: 'Pembeli',
        buyerEmail: undefined,
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

      // Heuristic cleanup: remove local POS-* placeholder rows when backend order likely already exists.
      const cleaned = merged.filter((row) => {
        if (!String(row.transactionId).startsWith('POS-')) return true;

        const rowTime = new Date(row.createdAt).getTime();
        const hasBackendTwin = merged.some((candidate) => {
          if (candidate.transactionId === row.transactionId) return false;
          if (String(candidate.transactionId).startsWith('POS-')) return false;

          const candidateTime = new Date(candidate.createdAt).getTime();
          const sameTotal = Number(candidate.total || 0) === Number(row.total || 0);
          const closeTime = Math.abs(candidateTime - rowTime) <= 5 * 60 * 1000;
          return sameTotal && closeTime;
        });

        return !hasBackendTwin;
      });

      localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(cleaned.slice(0, 500)));
      return cleaned.slice(0, 500);
    });
  }, [backendOrdersResponse, backendPaymentsResponse, deletedReceiptIds, selectedReceiptId]);

  useEffect(() => {
    if (!checkoutStartedAt) {
      setCheckoutElapsedSec(0);
      return;
    }
    const timer = window.setInterval(() => {
      setCheckoutElapsedSec(Math.max(0, Math.floor((Date.now() - checkoutStartedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [checkoutStartedAt]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User session tidak valid. Silakan login ulang.');

      try {
        const stockMap = new Map(cashierVariants.map((v) => [v.id, Number(v.stock ?? 0)]));
        const invalidStockRow = cart.find((item) => {
          const latestStock = stockMap.get(item.variantId);
          return latestStock === undefined || latestStock < item.qty;
        });

        if (invalidStockRow) {
          const latest = stockMap.get(invalidStockRow.variantId);
          throw new Error(
            `Stok tidak cukup untuk ${invalidStockRow.productName} (${invalidStockRow.variantName}). ` +
            `Tersedia ${latest ?? 0}, diminta ${invalidStockRow.qty}. Silakan sesuaikan qty.`
          );
        }

        const posNotes = [`POS Buyer: ${buyerName.trim()}`];
        if (notes.trim()) posNotes.push(`Catatan: ${notes.trim()}`);

        return await posCheckout({
          cashier_id: user.id,
          payment_method: paymentMethod,
          notes: posNotes.join(' | '),
          items: cart.map((item) => ({
            variant_id: item.variantId,
            product_id: item.productId,
            qty: item.qty,
            unit_price: item.unitPrice,
            discount: Number(item.qty > 0 ? (item.discountValue / item.qty) : 0),
          })),
        });
      } catch (error: any) {
        throw error;
      }
    },
    onMutate: () => {
      setCheckoutStartedAt(Date.now());
    },
    onSuccess: (response: any) => {
      const trx = response?.data?.transaction_id || response?.data?.order_id || response?.data?.id || `POS-${Date.now()}`;
      toast.success(trx ? `Checkout sukses (${trx})` : 'Checkout POS sukses.');

      const receiptPayload: ReceiptData = {
        transactionId: String(trx),
        createdAt: new Date().toISOString(),
        cashierName: [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.name || user?.email || 'Cashier',
        buyerName: buyerName.trim() || 'Pelanggan POS',
        paymentMethod,
        notes: notes || undefined,
        items: cart,
        subtotal,
        total: grandTotal,
      };

      setLastReceipt(receiptPayload);
      setSelectedReceiptId(receiptPayload.transactionId);
      setShowReceiptHistory(false);
      setReceiptHistory((prev) => {
        const next = [receiptPayload, ...prev].slice(0, 500);
        localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(next));
        return next;
      });

      setCart([]);
      setNotes('');
      setBuyerName('');
      queryClient.invalidateQueries({ queryKey: ['cashier-receipt-history-backend'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-variants'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-products'] });
      setCheckoutStartedAt(null);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        'Checkout gagal. Mohon cek endpoint backend POS/Orders.';
      toast.error(String(message));
      setCheckoutStartedAt(null);
    },
    onSettled: () => {
      setCheckoutStartedAt(null);
    },
  });

  const productLookup = useMemo(() => {
    const rows = productsResponse?.data ?? [];
    return new Map(rows.map((item) => [String(item.id), item]));
  }, [productsResponse?.data]);

  const cashierVariants = useMemo(() => {
    const rows = variantsResponse?.data ?? [];

    return rows
      .filter((item): item is VariantItem & { id: number } => typeof item.id === 'number')
      .map((item) => {
        const basePrice = Number(item.price ?? 0);
        const discount = Number(item.discount ?? 0);
        const finalPrice = Math.max(basePrice - discount, 0);

        const productObj = item.product_id ? productLookup.get(String(item.product_id)) : undefined;
        const productName =
          (item.product && item.product.trim()) ||
          productObj?.name ||
          '-';

        const variantName = [item.name, item.variant].filter(Boolean).join(' - ') || `Variant #${item.id}`;

        return {
          id: item.id,
          productId: String(item.product_id || ''),
          productName,
          producerName: (productObj?.brand_info?.name || '').trim() || 'Tanpa Produsen',
          categoryName: (productObj?.brand_info?.category || '').trim() || 'Umum',
          variantName,
          img: item.img || null,
          stock: Number(item.stock ?? 0),
          finalPrice,
        };
      });
  }, [variantsResponse?.data, productLookup]);

  const producerOptions = useMemo(() => {
    return Array.from(new Set(cashierVariants
      .map((i) => i.producerName)
      .filter((x) => Boolean(x && x.trim() && x !== '-')))).sort();
  }, [cashierVariants]);
  const productOptions = useMemo(() => {
    return Array.from(new Set(cashierVariants
      .filter((i) => (selectedProducer === 'all' || i.producerName === selectedProducer))
      .map((i) => i.productName)
      .filter(Boolean))).sort();
  }, [cashierVariants, selectedProducer]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return cashierVariants.filter((item) => {
      const hitHierarchy =
        (selectedProducer === 'all' || item.producerName === selectedProducer) &&
        (selectedProduct === 'all' || item.productName === selectedProduct);

      const hitSearch = !q ||
        item.productName.toLowerCase().includes(q) ||
        item.variantName.toLowerCase().includes(q) ||
        String(item.id).includes(q);

      const hitStock = stockView === 'all' ? true : item.stock <= 10;
      return hitHierarchy && hitSearch && hitStock;
    });
  }, [cashierVariants, search, selectedProducer, selectedProduct, stockView]);

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
          discountType: 'amount',
          discountInput: 0,
          discountValue: 0,
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

  const updateItemDiscount = (variantId: number, discountInput: number) => {
    setCart((prev) => prev.map((row) => {
      if (row.variantId !== variantId) return row;
      const rawInput = Math.max(0, Number(discountInput || 0));
      const safeInput = row.discountType === 'percent' ? Math.min(rawInput, 100) : rawInput;
      const lineSubtotal = row.unitPrice * row.qty;
      const discountValue = row.discountType === 'percent'
        ? Math.max(0, Math.min((lineSubtotal * safeInput) / 100, lineSubtotal))
        : Math.max(0, Math.min(safeInput, lineSubtotal));
      return { ...row, discountInput: safeInput, discountValue };
    }));
  };

  const updateItemDiscountType = (variantId: number, discountType: DiscountType) => {
    setCart((prev) => prev.map((row) => {
      if (row.variantId !== variantId) return row;
      const lineSubtotal = row.unitPrice * row.qty;
      const discountValue = discountType === 'percent'
        ? Math.max(0, Math.min((lineSubtotal * row.discountInput) / 100, lineSubtotal))
        : Math.max(0, Math.min(row.discountInput, lineSubtotal));
      return { ...row, discountType, discountValue };
    }));
  };

  const subtotal = cart.reduce((sum, row) => sum + row.unitPrice * row.qty, 0);
  const totalDiscount = cart.reduce((sum, row) => sum + row.discountValue, 0);
  const grandTotal = Math.max(subtotal - totalDiscount, 0);

  const buildInvoiceHtml = (receipt: ReceiptData) => {
    const rows = receipt.items.map((i) => `
      <tr>
        <td>${i.productName} <span class="muted">(${i.variantName})</span></td>
        <td class="text-right">${formatRupiah(i.unitPrice)}</td>
        <td class="text-center">${i.qty}</td>
        <td class="text-right">${formatRupiah(i.qty * i.unitPrice)}</td>
      </tr>
    `).join('');

    return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${receipt.transactionId}</title>
      <style>
        :root { --text:#111827; --muted:#6b7280; --line:#d1d5db; }
        @page { size: 80mm auto; margin: 4mm; }
        body { font-family: Inter, Arial, Helvetica, sans-serif; color:var(--text); margin:0; }
        .wrap { width: 72mm; margin:0 auto; font-size:11px; line-height:1.35; }
        .top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px; }
        h1 { margin:0; font-size:22px; letter-spacing:0.8px; }
        .brand { text-align:right; }
        .brand .title { font-size:13px; font-weight:700; }
        hr { border:none; border-top:1px solid var(--line); margin:6px 0; }
        .meta { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:4px; }
        .meta b { display:block; margin-bottom:2px; font-size:10px; }
        .muted { color:var(--muted); }
        table { width:100%; border-collapse:collapse; margin-top:6px; }
        th, td { border-bottom:1px solid var(--line); padding:4px 2px; font-size:10px; }
        th { text-align:left; font-weight:700; }
        .text-right { text-align:right; }
        .text-center { text-align:center; }
        .sum { margin-top:8px; }
        .sum-row { display:flex; justify-content:space-between; margin:2px 0; font-size:11px; }
        .total { font-weight:800; font-size:16px; margin-top:2px; }
        .footer { margin-top:10px; font-weight:700; font-size:10px; text-align:center; }
      </style>
    </head><body><div class="wrap">
      <div class="top">
        <h1>INVOICE</h1>
        <div class="brand"><div class="title">Toko Herbal AmImUm</div><div>POS Internal</div></div>
      </div>
      <hr/>
      <div class="meta">
        <div>
          <b>KEPADA</b>
          <div>${receipt.buyerName || 'Pelanggan POS'}</div>
          <div><b style="margin-top:4px">KASIR</b>${receipt.cashierName}</div>
        </div>
        <div class="text-right">
          <b>TANGGAL</b><div>${new Date(receipt.createdAt).toLocaleString('id-ID')}</div>
          <b style="margin-top:4px">NO INVOICE</b><div>${receipt.transactionId}</div>
          <b style="margin-top:4px">METODE</b><div>${String(receipt.paymentMethod).toUpperCase()}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>KETERANGAN</th><th class="text-right">HARGA</th><th class="text-center">JML</th><th class="text-right">TOTAL</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4">Detail item belum tersedia</td></tr>'}</tbody>
      </table>
      <div class="sum">
        <div class="sum-row"><span>SUBTOTAL</span><b>${formatRupiah(receipt.subtotal)}</b></div>
        <div class="sum-row"><span>PAJAK</span><b>${formatRupiah(0)}</b></div>
        <div class="sum-row total"><span>TOTAL</span><span>${formatRupiah(receipt.total)}</span></div>
      </div>
      ${receipt.notes ? `<div class="muted" style="margin-top:6px">Catatan: ${receipt.notes}</div>` : ''}
      <div class="footer">TERIMAKASIH ATAS PEMBELIAN ANDA</div>
    </div><script>window.print();</script></body></html>`;
  };

  const handlePrintReceipt = () => {
    if (!selectedReceiptWithItems) {
      toast.error('Detail nota belum tersedia untuk dicetak.');
      return;
    }
    const printWindow = window.open('', '_blank', 'width=960,height=760');
    if (!printWindow) {
      toast.error('Popup diblokir browser. Izinkan pop-up untuk cetak nota.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildInvoiceHtml(selectedReceiptWithItems));
    printWindow.document.close();
  };

  const buildReceiptPlainText = (receipt: ReceiptData) => {
    const width = printPaper === '58' ? 32 : 42;
    const line = '-'.repeat(width);
    const leftCol = printPaper === '58' ? 18 : 26;
    const qtyCol = printPaper === '58' ? 3 : 4;
    const priceCol = width - leftCol - qtyCol;

    const center = (text: string) => {
      const t = text.slice(0, width);
      const pad = Math.max(0, Math.floor((width - t.length) / 2));
      return `${' '.repeat(pad)}${t}`;
    };

    const right = (text: string, len: number) => text.length >= len ? text.slice(0, len) : `${' '.repeat(len - text.length)}${text}`;
    const money = (n: number) => Math.round(n).toLocaleString('id-ID');

    const fit = (text: string, len: number) => {
      if (text.length <= len) return `${text}${' '.repeat(len - text.length)}`;
      return `${text.slice(0, Math.max(0, len - 1))}…`;
    };

    const wrapName = (text: string, len: number) => {
      const chunks: string[] = [];
      let rest = text.trim();
      while (rest.length > len) {
        chunks.push(rest.slice(0, len));
        rest = rest.slice(len);
      }
      chunks.push(rest);
      return chunks;
    };

    const itemRows = receipt.items.length
      ? receipt.items.map((i) => {
        const name = `${i.productName} (${i.variantName})`;
        const subtotal = money(i.qty * i.unitPrice);
        const wrapped = wrapName(name, leftCol);
        const first = `${fit(wrapped[0] || '', leftCol)}${right(String(i.qty), qtyCol)}${right(subtotal, priceCol)}`;
        const cont = wrapped.slice(1).map((part) => `${fit(part, leftCol)}${' '.repeat(qtyCol)}${' '.repeat(priceCol)}`);
        return [first, ...cont].join('\n');
      }).join('\n')
      : fit('Detail item belum tersedia', width);

    const sumRow = (label: string, value: number) => {
      const v = `Rp${money(value)}`;
      const head = `${label}${' '.repeat(Math.max(1, width - label.length - v.length))}`;
      return `${head}${v}`;
    };

    return [
      center('TOKO HERBAL AMIMUM'),
      center('NOTA PEMBAYARAN'),
      line,
      `No   : ${receipt.transactionId}`,
      `Tgl  : ${new Date(receipt.createdAt).toLocaleString('id-ID')}`,
      `Kasir: ${receipt.cashierName}`,
      `Cust : ${receipt.buyerName || 'Pelanggan POS'}`,
      `Bayar: ${String(receipt.paymentMethod).toUpperCase()}`,
      line,
      `${fit('ITEM', leftCol)}${right('QTY', qtyCol)}${right('TOTAL', priceCol)}`,
      line,
      itemRows,
      line,
      sumRow('Subtotal', receipt.subtotal),
      sumRow('Diskon', 0),
      sumRow('TOTAL', receipt.total),
      line,
      center('Terima kasih'),
      '\n\n\n',
    ].join('\n');
  };

  const getPrinterCharacteristic = async (device: any) => {
    const server = await device.gatt?.connect();
    if (!server) throw new Error('Gagal konek ke printer Bluetooth.');

    const candidateServices: Array<number | string> = [0xFFE0, 0x18F0, 'battery_service'];
    for (const serviceId of candidateServices) {
      try {
        const svc = await server.getPrimaryService(serviceId);
        const chars = await svc.getCharacteristics();
        const c = chars.find((x) => x.properties.writeWithoutResponse || x.properties.write);
        if (c) return { server, characteristic: c };
      } catch {
        // continue
      }
    }
    throw new Error('Karakteristik write printer tidak ditemukan.');
  };

  const writeChunks = async (characteristic: any, bytes: Uint8Array) => {
    const chunkSize = 140;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
    }
  };

  const buildEscPosBytes = (receipt: ReceiptData) => {
    const encoder = new TextEncoder();
    const text = buildReceiptPlainText(receipt);
    const init = new Uint8Array([0x1b, 0x40]);
    const alignCenter = new Uint8Array([0x1b, 0x61, 0x01]);
    const alignLeft = new Uint8Array([0x1b, 0x61, 0x00]);
    const boldOn = new Uint8Array([0x1b, 0x45, 0x01]);
    const boldOff = new Uint8Array([0x1b, 0x45, 0x00]);
    const normalSize = new Uint8Array([0x1d, 0x21, 0x00]);
    const bigSize = new Uint8Array([0x1d, 0x21, 0x11]);
    const feedAndCut = new Uint8Array([0x1b, 0x64, 0x04, 0x1d, 0x56, 0x00]);

    const payload = encoder.encode(text);
    const out = new Uint8Array(
      init.length + alignCenter.length + boldOn.length + bigSize.length +
      alignLeft.length + boldOff.length + normalSize.length + payload.length + feedAndCut.length
    );
    let o = 0;
    out.set(init, o); o += init.length;
    out.set(alignCenter, o); o += alignCenter.length;
    out.set(boldOn, o); o += boldOn.length;
    out.set(bigSize, o); o += bigSize.length;
    out.set(alignLeft, o); o += alignLeft.length;
    out.set(boldOff, o); o += boldOff.length;
    out.set(normalSize, o); o += normalSize.length;
    out.set(payload, o); o += payload.length;
    out.set(feedAndCut, o);
    return out;
  };

  const resolveBluetoothPrinter = async () => {
    const nav = navigator as any;
    const storedId = localStorage.getItem(BT_PRINTER_DEVICE_ID_KEY);
    if (storedId && typeof nav.bluetooth.getDevices === 'function') {
      const trusted = await nav.bluetooth.getDevices();
      const found = trusted.find((d) => d.id === storedId);
      if (found) return found;
    }

    const picked = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [0xFFE0, 0x18F0],
    });
    localStorage.setItem(BT_PRINTER_DEVICE_ID_KEY, picked.id);
    return picked;
  };

  const handleBluetoothPrint = async () => {
    if (!selectedReceiptWithItems) {
      toast.error('Detail nota belum tersedia untuk dicetak.');
      return;
    }
    if (!('bluetooth' in navigator)) {
      toast.error('Perangkat/browser ini belum mendukung Web Bluetooth. Gunakan Cetak Nota biasa.');
      return;
    }

    setIsBtPrinting(true);
    try {
      const device = await resolveBluetoothPrinter();
      const { server, characteristic } = await getPrinterCharacteristic(device);
      const bytes = buildEscPosBytes(selectedReceiptWithItems);
      await writeChunks(characteristic, bytes);
      try { server.disconnect(); } catch {}
      toast.success(`Nota Bluetooth terkirim (${printPaper}mm) ke ${device.name || 'printer'} .`);
    } catch (error: any) {
      toast.error(error?.message || 'Gagal cetak Bluetooth. Pastikan printer menyala dan sudah pairing.');
    } finally {
      setIsBtPrinting(false);
    }
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
      discountType: 'amount',
      discountInput: 0,
      discountValue: 0,
    }));

    const computedTotal = mappedItems.reduce((sum, row) => sum + (row.unitPrice * row.qty), 0);

    return {
      ...selectedReceipt,
      items: mappedItems,
      subtotal: computedTotal || selectedReceipt.subtotal,
      total: computedTotal || selectedReceipt.total,
    };
  }, [selectedReceipt, selectedOrderDetailResponse]);

  useEffect(() => {
    if (!selectedReceiptWithItems) return;
    receiptDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [selectedReceiptWithItems?.transactionId]);

  const exportReceiptPdf = (receipt: ReceiptData) => {
    const w = window.open('', '_blank');
    if (!w) return toast.error('Popup diblokir browser. Izinkan pop-up untuk export PDF.');
    w.document.open();
    w.document.write(buildInvoiceHtml(receipt));
    w.document.close();
  };

  const clearReceiptHistory = () => {
    const ok = window.confirm('Hapus semua riwayat nota kasir dari dashboard ini? Tindakan ini tidak bisa dibatalkan.');
    if (!ok) return;

    const allIds = receiptHistory.map((r) => r.transactionId);
    const nextDeleted = Array.from(new Set([...deletedReceiptIds, ...allIds]));

    setReceiptHistory([]);
    setLastReceipt(null);
    setSelectedReceiptId('');
    setDeletedReceiptIds(nextDeleted);
    localStorage.setItem(RECEIPT_DELETED_IDS_KEY, JSON.stringify(nextDeleted));
    localStorage.removeItem(RECEIPT_STORAGE_KEY);
    toast.success('Riwayat nota kasir berhasil dihapus.');
  };

  const deleteSingleReceipt = (transactionId: string) => {
    const ok = window.confirm(`Hapus riwayat nota ${transactionId} dari dashboard ini?`);
    if (!ok) return;

    const nextDeleted = Array.from(new Set([...deletedReceiptIds, transactionId]));
    const nextHistory = receiptHistory.filter((r) => r.transactionId !== transactionId);

    setDeletedReceiptIds(nextDeleted);
    setReceiptHistory(nextHistory);
    localStorage.setItem(RECEIPT_DELETED_IDS_KEY, JSON.stringify(nextDeleted));
    localStorage.setItem(RECEIPT_STORAGE_KEY, JSON.stringify(nextHistory));

    if (selectedReceiptId === transactionId) setSelectedReceiptId('');
    toast.success(`Riwayat ${transactionId} dihapus.`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Kasir (POS)</h1>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Integrasi awal sudah aktif ke data produk/variant live untuk simulasi cart kasir internal.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Search className="w-4 h-4" /> Pilih Variant</CardTitle>
            <CardDescription>Data diambil dari endpoint existing: /product/all dan /type/all</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama produk..." />
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={stockView === 'all' ? 'default' : 'outline'} className="h-11" onClick={() => setStockView('all')}>Semua</Button>
              <Button type="button" variant={stockView === 'low' ? 'default' : 'outline'} className="h-11" onClick={() => setStockView('low')}>Menipis</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select value={selectedProducer} onChange={(e) => { setSelectedProducer(e.target.value); setSelectedProduct('all'); }} className="h-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-gray-700 dark:text-slate-200 outline-none">
                <option value="all">Semua Produsen</option>
                {producerOptions.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="h-10 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-gray-700 dark:text-slate-200 outline-none">
                <option value="all">Semua Produk</option>
                {productOptions.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
              <Button type="button" variant="outline" className="dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700/50" onClick={() => { setSelectedProducer('all'); setSelectedProduct('all'); setSearch(''); }}>Reset Filter</Button>
            </div>

            {variantsLoading ? (
              <p className="text-sm text-gray-500">Memuat variant...</p>
            ) : variantsError ? (
              <p className="text-sm text-red-600">Gagal memuat data variant dari API.</p>
            ) : (
              <div className="max-h-[520px] overflow-auto rounded-xl border p-3 space-y-3 bg-gray-50/60">
                {filtered.map((item) => {
                  const low = item.stock <= 10;
                  const empty = item.stock <= 0;
                  return (
                    <div key={item.id} className="rounded-2xl border bg-white p-3 sm:p-4 flex items-center gap-3">
                      <img
                        src={item.img || 'https://placehold.co/56x56?text=No+Image'}
                        alt={item.variantName}
                        className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.src.includes('placehold.co')) target.src = 'https://placehold.co/56x56?text=No+Image';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-lg font-semibold text-gray-900 leading-tight truncate">{item.productName}</p>
                        <p className="text-sm text-gray-500 truncate">{item.variantName}</p>
                        <div className="mt-1 flex items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-900">Stok: {item.stock}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${empty ? 'bg-red-100 text-red-700' : low ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{empty ? 'Habis' : low ? 'Menipis' : 'Aman'}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-700 mt-0.5">{formatRupiah(item.finalPrice)}</p>
                      </div>
                      <Button className="h-11 px-5 rounded-xl" onClick={() => addToCart(item)} disabled={item.stock <= 0}>Tambah</Button>
                    </div>
                  );
                })}
                {filtered.length === 0 && <p className="text-sm text-gray-500">Tidak ada variant sesuai pencarian.</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Keranjang Kasir</CardTitle>
            <CardDescription>Checkout kasir terhubung ke endpoint POS `/admin/pos/checkout`.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 max-h-[330px] overflow-auto pr-1">
              {cart.map((row) => (
                <div key={row.variantId} className="rounded-xl border dark:border-slate-700 p-3">
                  <p className="font-medium text-gray-900 dark:text-slate-100 text-sm">{row.productName}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">{row.variantName}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={row.stock}
                      value={row.qty}
                      onChange={(e) => updateQty(row.variantId, Number(e.target.value))}
                      className="h-9"
                    />
                    <select
                      value={row.discountType}
                      onChange={(e) => updateItemDiscountType(row.variantId, e.target.value as DiscountType)}
                      className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 outline-none"
                    >
                      <option value="amount">Rp</option>
                      <option value="percent">%</option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      max={row.discountType === 'percent' ? 100 : row.unitPrice * row.qty}
                      value={row.discountInput}
                      onChange={(e) => updateItemDiscount(row.variantId, Number(e.target.value))}
                      className="h-9"
                      placeholder={row.discountType === 'percent' ? 'Diskon % per baris' : 'Diskon Rp per baris'}
                    />
                    <Button variant="outline" size="sm" onClick={() => removeFromCart(row.variantId)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{row.qty} × {formatRupiah(row.unitPrice)} • Diskon baris {row.discountType === 'percent' ? `${row.discountInput}%` : formatRupiah(row.discountInput || 0)} (efektif {formatRupiah(row.discountValue || 0)})</p>
                </div>
              ))}
              {cart.length === 0 && <p className="text-sm text-gray-500">Keranjang masih kosong.</p>}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="Nama pelanggan (wajib)" disabled={checkoutMutation.isPending} />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
                  disabled={checkoutMutation.isPending}
                >
                  <option value="cash">Cash</option>
                  <option value="transfer">Transfer</option>
                  <option value="qris">QRIS</option>
                </select>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)" disabled={checkoutMutation.isPending} />
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Diskon</span>
                <span className="font-semibold text-emerald-600">- {formatRupiah(totalDiscount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="font-bold">Grand Total</span>
                <span className="font-bold">{formatRupiah(grandTotal)}</span>
              </div>
              <Button className="w-full mt-3" disabled={cart.length === 0 || checkoutMutation.isPending || !buyerName.trim()} onClick={() => checkoutMutation.mutate()}>
                {checkoutMutation.isPending ? 'Memproses...' : 'Checkout POS'}
              </Button>
              {checkoutMutation.isPending && (
                <p className="mt-2 text-xs text-amber-700">
                  Transaksi sedang dikirim ke server, mohon tunggu… ({checkoutElapsedSec} detik)
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Riwayat Nota Kasir</CardTitle>
              <CardDescription>Cek ulang transaksi dengan filter tanggal dan pencarian cepat.</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowReceiptHistory((v) => !v)}>
              {showReceiptHistory ? 'Sembunyikan Riwayat' : 'Tampilkan Riwayat'}
            </Button>
          </div>
        </CardHeader>
        {showReceiptHistory && (
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <Input placeholder="Cari no transaksi/kasir/metode" value={receiptQuery} onChange={(e) => setReceiptQuery(e.target.value)} />
              <Input type="date" value={receiptDate} onChange={(e) => setReceiptDate(e.target.value)} />
              <Button variant="outline" onClick={() => { setReceiptQuery(''); setReceiptDate(new Date().toISOString().slice(0, 10)); }}>Reset Filter</Button>
              <Button variant="destructive" onClick={clearReceiptHistory} className="flex items-center gap-2">
                <History className="w-4 h-4" /> Hapus Riwayat
              </Button>
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
                          <Button size="sm" variant="destructive" onClick={() => deleteSingleReceipt(r.transactionId)}>
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReceipts.length === 0 && <TableRow><TableCell colSpan={5} className="text-sm text-gray-500">Belum ada data nota.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>

      {selectedReceiptWithItems && (
        <div ref={receiptDetailRef}>
        <Card id="receipt-detail-print-area" className="print:shadow-none print:border-none overflow-hidden">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ReceiptText className="w-4 h-4" /> Detail Nota Pembayaran</CardTitle>
              <CardDescription>Audit-ready detail transaksi kasir.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 print:hidden items-center">
              <select
                value={printPaper}
                onChange={(e) => setPrintPaper(e.target.value as '58' | '80')}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none"
                title="Lebar kertas"
              >
                <option value="58">58mm</option>
                <option value="80">80mm</option>
              </select>
              <Button variant="outline" onClick={handleBluetoothPrint} disabled={isBtPrinting}>
                <Printer className="w-4 h-4 mr-2" />{isBtPrinting ? 'Mengirim...' : 'Print Bluetooth'}
              </Button>
              <Button
                variant="outline"
                onClick={() => { localStorage.removeItem(BT_PRINTER_DEVICE_ID_KEY); toast.success('Pairing printer direset. Print berikutnya akan pilih device lagi.'); }}
              >Reset Pairing</Button>
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
              <div className="hidden sm:block overflow-x-auto">
                <Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Harga</TableHead><TableHead className="text-right">Subtotal</TableHead></TableRow></TableHeader><TableBody>
                  {selectedReceiptWithItems.items.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-sm text-gray-500">Detail item belum tersedia pada transaksi ini.</TableCell></TableRow>
                  ) : selectedReceiptWithItems.items.map((row) => (
                    <TableRow key={`r-${selectedReceiptWithItems.transactionId}-${row.variantId}`}>
                      <TableCell className="max-w-[220px] truncate">{row.productName} <span className="text-xs text-gray-500">({row.variantName})</span></TableCell>
                      <TableCell>{row.qty}</TableCell><TableCell>{formatRupiah(row.unitPrice)}</TableCell><TableCell className="text-right">{formatRupiah(row.unitPrice * row.qty)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody></Table>
              </div>

              <div className="sm:hidden divide-y">
                {selectedReceiptWithItems.items.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">Detail item belum tersedia pada transaksi ini.</div>
                ) : selectedReceiptWithItems.items.map((row) => (
                  <div key={`m-${selectedReceiptWithItems.transactionId}-${row.variantId}`} className="p-3 space-y-1">
                    <p className="font-medium text-gray-900 leading-snug">{row.productName} <span className="text-xs text-gray-500">({row.variantName})</span></p>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>Qty: {row.qty}</span>
                      <span>Harga: {formatRupiah(row.unitPrice)}</span>
                    </div>
                    <div className="text-right text-sm font-semibold text-gray-900">Subtotal: {formatRupiah(row.unitPrice * row.qty)}</div>
                  </div>
                ))}
              </div>
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
        </div>
      )}
    </div>
  );
}
