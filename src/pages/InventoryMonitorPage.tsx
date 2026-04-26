import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Boxes, PackageCheck, Search, ArrowLeftRight } from 'lucide-react';
import api from '@/lib/api';
import { getStockMovements } from '@/lib/posInventory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ProductItem = { id: string; name: string };
type VariantItem = {
  id?: number;
  product_id?: string;
  product?: string;
  name?: string;
  variant?: string | null;
  img?: string | null;
  stock?: number;
  updated_at?: string;
};

interface ProductResponse { data: ProductItem[] }
interface VariantResponse { data: VariantItem[] }

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryMonitorPage() {
  const [search, setSearch] = useState('');

  const { data: productsResponse } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => (await api.get<ProductResponse>('/product/all')).data,
  });

  const { data: variantsResponse, isLoading, isError } = useQuery({
    queryKey: ['inventory-variants'],
    queryFn: async () => (await api.get<VariantResponse>('/type/all')).data,
  });

  const movementQuery = useQuery({
    queryKey: ['inventory-movements'],
    queryFn: async () => {
      try {
        const response = await getStockMovements({ page: 1, limit: 50 });
        return { mode: 'real' as const, rows: response.data.items };
      } catch {
        return { mode: 'fallback' as const, rows: [] as any[] };
      }
    },
  });

  const productLookup = useMemo(() => {
    const rows = productsResponse?.data ?? [];
    return new Map(rows.map((item) => [String(item.id), item.name]));
  }, [productsResponse?.data]);

  const rows = useMemo(() => {
    return (variantsResponse?.data ?? [])
      .filter((item): item is VariantItem & { id: number } => typeof item.id === 'number')
      .map((item) => {
        const stock = Number(item.stock ?? 0);
        const productName =
          (item.product && item.product.trim()) ||
          (item.product_id ? productLookup.get(String(item.product_id)) : undefined) ||
          '-';
        const variantName = [item.name, item.variant].filter(Boolean).join(' - ') || `Variant #${item.id}`;

        let stockStatus: 'safe' | 'low' | 'out' = 'safe';
        if (stock <= 0) stockStatus = 'out';
        else if (stock <= LOW_STOCK_THRESHOLD) stockStatus = 'low';

        return {
          id: item.id,
          productName,
          variantName,
          stock,
          imageUrl: item.img || null,
          updatedAt: item.updated_at,
          stockStatus,
        };
      });
  }, [variantsResponse?.data, productLookup]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((item) => {
      return (
        item.productName.toLowerCase().includes(q) ||
        item.variantName.toLowerCase().includes(q) ||
        String(item.id).includes(q)
      );
    });
  }, [rows, search]);

  const summary = useMemo(() => {
    const safe = filtered.filter((row) => row.stockStatus === 'safe').length;
    const low = filtered.filter((row) => row.stockStatus === 'low').length;
    const out = filtered.filter((row) => row.stockStatus === 'out').length;
    return { safe, low, out };
  }, [filtered]);

  const movementRows = useMemo(() => {
    if (movementQuery.data?.mode === 'real') return movementQuery.data.rows;

    return filtered
      .map((item) => ({
        id: `snapshot-${item.id}`,
        created_at: item.updatedAt || new Date().toISOString(),
        variant_id: item.id,
        movement_type: 'snapshot',
        delta: 0,
        stock_after: item.stock,
        reason: 'Fallback snapshot dari data variant',
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30);
  }, [movementQuery.data, filtered]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Stok & Pergerakan</h1>
        <p className="text-sm text-gray-600 mt-1">
          Halaman terpadu ala marketplace untuk memantau stok dan histori pergerakan dalam satu alur yang jelas.
          Perubahan stok tetap dilakukan di halaman Variants agar konsisten.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Stok Aman</span><PackageCheck className="w-4 h-4 text-emerald-600" /></div><p className="text-2xl font-bold mt-2">{summary.safe}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Stok Menipis</span><AlertTriangle className="w-4 h-4 text-amber-600" /></div><p className="text-2xl font-bold mt-2">{summary.low}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Stok Habis</span><Boxes className="w-4 h-4 text-rose-600" /></div><p className="text-2xl font-bold mt-2">{summary.out}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="w-4 h-4" /> Produk & Status Stok</CardTitle>
          <CardDescription>Tampilan visual produk + status stok agar monitoring lebih mudah dipahami tim operasional.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari product/variant/id..." />

          {isLoading ? (
            <p className="text-sm text-gray-500">Memuat data stok...</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Gagal memuat data stok dari API.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <div key={item.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.variantName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">No Img</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{item.productName}</p>
                      <p className="text-xs text-gray-500 truncate">{item.variantName}</p>
                      <p className="text-xs text-gray-500 mt-1">Variant ID: {item.id}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">Stock: <span className="font-semibold text-gray-900">{item.stock}</span></p>
                    {item.stockStatus === 'safe' && <span className="text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700">Aman</span>}
                    {item.stockStatus === 'low' && <span className="text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700">Menipis</span>}
                    {item.stockStatus === 'out' && <span className="text-xs px-2 py-1 rounded-lg bg-rose-50 text-rose-700">Habis</span>}
                  </div>

                  <p className="text-[11px] text-gray-500 mt-2">
                    Update: {item.updatedAt ? new Date(item.updatedAt).toLocaleString('id-ID') : '-'}
                  </p>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-gray-500">Tidak ada data stok sesuai filter.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Histori Pergerakan Stok</CardTitle>
          <CardDescription>
            Mode data: <strong>{movementQuery.data?.mode === 'real' ? 'REAL API' : 'FALLBACK SNAPSHOT'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>Stock After</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementRows.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-'}</TableCell>
                    <TableCell>{row.variant_id}</TableCell>
                    <TableCell>{row.movement_type}</TableCell>
                    <TableCell>{row.delta ?? '-'}</TableCell>
                    <TableCell>{row.stock_after ?? '-'}</TableCell>
                    <TableCell className="text-xs text-gray-600">{row.reason || '-'}</TableCell>
                  </TableRow>
                ))}
                {movementRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-sm text-gray-500">Belum ada data movement.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
