import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeftRight } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { adjustStock, getStockMovements } from '@/lib/posInventory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
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

export default function StockMovementsPage() {
  const [variantId, setVariantId] = useState('');
  const [delta, setDelta] = useState('0');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');

  const { data: productsResponse } = useQuery({
    queryKey: ['movements-products'],
    queryFn: async () => (await api.get<ProductResponse>('/product/all')).data,
  });

  const { data: variantsResponse, isLoading: variantsLoading } = useQuery({
    queryKey: ['movements-variants'],
    queryFn: async () => (await api.get<VariantResponse>('/type/all')).data,
  });

  const movementQuery = useQuery({
    queryKey: ['stock-movements-real'],
    queryFn: async () => {
      try {
        const response = await getStockMovements({ page: 1, limit: 100 });
        return { mode: 'real' as const, rows: response.data.items };
      } catch {
        return { mode: 'fallback' as const, rows: [] as any[] };
      }
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async () => {
      return adjustStock({
        variant_id: Number(variantId),
        delta: Number(delta),
        reason,
        reference: reference || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Adjust stok berhasil diproses.');
      movementQuery.refetch();
      setDelta('0');
      setReason('');
      setReference('');
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.detail?.message ||
        error?.response?.data?.detail ||
        'Endpoint adjust stock belum tersedia di backend.';
      toast.error(String(message));
    },
  });

  const productLookup = useMemo(() => {
    const rows = productsResponse?.data ?? [];
    return new Map(rows.map((item) => [String(item.id), item.name]));
  }, [productsResponse?.data]);

  const fallbackRows = useMemo(() => {
    return (variantsResponse?.data ?? [])
      .filter((item): item is VariantItem & { id: number } => typeof item.id === 'number')
      .map((item) => {
        const productName =
          (item.product && item.product.trim()) ||
          (item.product_id ? productLookup.get(String(item.product_id)) : undefined) ||
          '-';
        const variantName = [item.name, item.variant].filter(Boolean).join(' - ') || `Variant #${item.id}`;

        return {
          id: `snapshot-${item.id}`,
          variant_id: item.id,
          productName,
          variantName,
          movement_type: 'snapshot',
          delta: 0,
          stock_after: Number(item.stock ?? 0),
          reason: 'Baseline snapshot dari /type/all',
          created_at: item.updated_at || new Date().toISOString(),
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 100);
  }, [variantsResponse?.data, productLookup]);

  const rows = movementQuery.data?.mode === 'real' ? movementQuery.data.rows : fallbackRows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pergerakan Stok</h1>
        <p className="text-sm text-gray-600 mt-1">Jika endpoint movement backend sudah aktif, data akan tampil real-time. Jika belum, halaman pakai fallback snapshot aman.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Adjust Stok Manual</CardTitle>
          <CardDescription>Write-action siap, akan aktif penuh setelah endpoint backend `POST /admin/inventory/adjust` tersedia.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input placeholder="Variant ID" value={variantId} onChange={(e) => setVariantId(e.target.value)} />
          <Input placeholder="Delta (+/-)" value={delta} onChange={(e) => setDelta(e.target.value)} />
          <Input placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Input placeholder="Reference (opsional)" value={reference} onChange={(e) => setReference(e.target.value)} />
          <Button
            onClick={() => adjustMutation.mutate()}
            disabled={!variantId || !reason || adjustMutation.isPending}
          >
            {adjustMutation.isPending ? 'Memproses...' : 'Submit Adjust'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Timeline Movement</CardTitle>
          <CardDescription>
            Mode data saat ini: <strong>{movementQuery.data?.mode === 'real' ? 'REAL API' : 'FALLBACK SNAPSHOT'}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {variantsLoading || movementQuery.isLoading ? (
            <p className="text-sm text-gray-500">Memuat timeline stok...</p>
          ) : (
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Variant ID</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Delta</TableHead>
                    <TableHead>Stock After</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row: any) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '-'}</TableCell>
                      <TableCell>{row.variant_id}</TableCell>
                      <TableCell>{row.movement_type}</TableCell>
                      <TableCell>{row.delta ?? '-'}</TableCell>
                      <TableCell>{row.stock_after ?? '-'}</TableCell>
                      <TableCell className="text-xs text-gray-600">{row.reason || '-'}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-gray-500">Belum ada data movement.</TableCell>
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
