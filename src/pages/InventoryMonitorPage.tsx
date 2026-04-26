import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, Boxes, PackageCheck, Search } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { setVariantThreshold } from '@/lib/posInventory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

type ProductItem = { id: string; name: string };
type VariantItem = {
  id?: number;
  product_id?: string;
  product?: string;
  name?: string;
  variant?: string | null;
  stock?: number;
  updated_at?: string;
};

interface ProductResponse { data: ProductItem[] }
interface VariantResponse { data: VariantItem[] }

const LOW_STOCK_THRESHOLD = 10;

export default function InventoryMonitorPage() {
  const [search, setSearch] = useState('');
  const [thresholdDrafts, setThresholdDrafts] = useState<Record<number, number>>({});

  const { data: productsResponse } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => (await api.get<ProductResponse>('/product/all')).data,
  });

  const { data: variantsResponse, isLoading, isError } = useQuery({
    queryKey: ['inventory-variants'],
    queryFn: async () => (await api.get<VariantResponse>('/type/all')).data,
  });

  const thresholdMutation = useMutation({
    mutationFn: async ({ variantId, threshold }: { variantId: number; threshold: number }) => {
      return setVariantThreshold(variantId, threshold);
    },
    onSuccess: () => {
      toast.success('Threshold stok berhasil disimpan.');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        'Endpoint threshold belum tersedia di backend. Lanjut pakai threshold default dulu.';
      toast.error(String(message));
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

        const threshold = thresholdDrafts[item.id] ?? LOW_STOCK_THRESHOLD;

        let stockStatus: 'safe' | 'low' | 'out' = 'safe';
        if (stock <= 0) stockStatus = 'out';
        else if (stock <= threshold) stockStatus = 'low';

        return {
          id: item.id,
          productName,
          variantName,
          stock,
          threshold,
          updatedAt: item.updated_at,
          stockStatus,
        };
      });
  }, [variantsResponse?.data, productLookup, thresholdDrafts]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoring Stok</h1>
        <p className="text-sm text-gray-600 mt-1">Integrasi aktif ke endpoint variant live + draft threshold per variant (siap disambung penuh saat endpoint backend aktif).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Stok Aman</span><PackageCheck className="w-4 h-4 text-emerald-600" /></div><p className="text-2xl font-bold mt-2">{summary.safe}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Stok Menipis</span><AlertTriangle className="w-4 h-4 text-amber-600" /></div><p className="text-2xl font-bold mt-2">{summary.low}</p></CardContent></Card>
        <Card><CardContent className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">Stok Habis</span><Boxes className="w-4 h-4 text-rose-600" /></div><p className="text-2xl font-bold mt-2">{summary.out}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="w-4 h-4" /> Daftar Stok Variant</CardTitle>
          <CardDescription>Threshold default: ≤ {LOW_STOCK_THRESHOLD}. Bisa override per variant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari product/variant/id..." />

          {isLoading ? (
            <p className="text-sm text-gray-500">Memuat data stok...</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Gagal memuat data stok dari API.</p>
          ) : (
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Update Terakhir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">{row.productName}</div>
                        <div className="text-xs text-gray-500">{row.variantName}</div>
                      </TableCell>
                      <TableCell>{row.stock}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            className="h-8 w-20"
                            type="number"
                            min={0}
                            value={thresholdDrafts[row.id] ?? LOW_STOCK_THRESHOLD}
                            onChange={(e) =>
                              setThresholdDrafts((prev) => ({
                                ...prev,
                                [row.id]: Number(e.target.value || LOW_STOCK_THRESHOLD),
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              thresholdMutation.mutate({
                                variantId: row.id,
                                threshold: thresholdDrafts[row.id] ?? LOW_STOCK_THRESHOLD,
                              })
                            }
                            disabled={thresholdMutation.isPending}
                          >
                            Simpan
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.stockStatus === 'safe' && <span className="text-emerald-700">Aman</span>}
                        {row.stockStatus === 'low' && <span className="text-amber-700">Menipis</span>}
                        {row.stockStatus === 'out' && <span className="text-rose-700">Habis</span>}
                      </TableCell>
                      <TableCell>{row.updatedAt ? new Date(row.updatedAt).toLocaleString('id-ID') : '-'}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-gray-500">Tidak ada data stok sesuai filter.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
