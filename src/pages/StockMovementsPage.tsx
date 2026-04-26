import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight } from 'lucide-react';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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
  const { data: productsResponse } = useQuery({
    queryKey: ['movements-products'],
    queryFn: async () => (await api.get<ProductResponse>('/product/all')).data,
  });

  const { data: variantsResponse, isLoading, isError } = useQuery({
    queryKey: ['movements-variants'],
    queryFn: async () => (await api.get<VariantResponse>('/type/all')).data,
  });

  const productLookup = useMemo(() => {
    const rows = productsResponse?.data ?? [];
    return new Map(rows.map((item) => [String(item.id), item.name]));
  }, [productsResponse?.data]);

  const movementRows = useMemo(() => {
    return (variantsResponse?.data ?? [])
      .filter((item): item is VariantItem & { id: number } => typeof item.id === 'number')
      .map((item) => {
        const productName =
          (item.product && item.product.trim()) ||
          (item.product_id ? productLookup.get(String(item.product_id)) : undefined) ||
          '-';
        const variantName = [item.name, item.variant].filter(Boolean).join(' - ') || `Variant #${item.id}`;

        return {
          id: item.id,
          productName,
          variantName,
          stock: Number(item.stock ?? 0),
          updatedAt: item.updated_at,
          movementType: 'snapshot',
          note: 'Baseline snapshot dari endpoint variant (movement API dedicated menyusul).',
        };
      })
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 100);
  }, [variantsResponse?.data, productLookup]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pergerakan Stok</h1>
        <p className="text-sm text-gray-600 mt-1">Integrasi baseline audit sudah aktif. Endpoint movement khusus akan disambungkan di phase BE berikutnya.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ArrowLeftRight className="w-4 h-4" /> Timeline Snapshot Stok</CardTitle>
          <CardDescription>
            Sumber sementara: /type/all (updated_at + stock). Aman sebagai tahap transisi sambil menunggu endpoint stock movement dedicated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-gray-500">Memuat timeline stok...</p>
          ) : isError ? (
            <p className="text-sm text-red-600">Gagal memuat data timeline dari API.</p>
          ) : (
            <div className="overflow-auto rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Stock Snapshot</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.updatedAt ? new Date(row.updatedAt).toLocaleString('id-ID') : '-'}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{row.productName}</div>
                        <div className="text-xs text-gray-500">{row.variantName}</div>
                      </TableCell>
                      <TableCell>{row.stock}</TableCell>
                      <TableCell>{row.movementType}</TableCell>
                      <TableCell className="text-xs text-gray-600">{row.note}</TableCell>
                    </TableRow>
                  ))}
                  {movementRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-gray-500">Belum ada data timeline stok.</TableCell>
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
