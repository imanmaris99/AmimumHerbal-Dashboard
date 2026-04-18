import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Box, Boxes, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductDetailVariant {
  id: number;
  variant?: string | null;
  stock?: number | null;
  discount?: number | null;
  discounted_price?: number | null;
}

interface ProductDetailData {
  id: string;
  name: string;
  info?: string | null;
  variants_list?: ProductDetailVariant[];
  description_list?: string[];
  instructions_list?: string[];
  price: number;
  is_active: boolean;
  company?: string | null;
  created_at: string;
  updated_at: string;
}

interface ProductDetailResponse {
  status_code: number;
  message: string;
  data: ProductDetailData;
}

interface UpdateProductPayload {
  name?: string;
  info?: string;
  weight?: number;
  description?: string;
  instructions?: string;
  price?: number;
}

export default function ProductEditPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productId } = useParams<{ productId: string }>();

  const [form, setForm] = useState<UpdateProductPayload>({
    name: '',
    info: '',
    weight: 0,
    description: '',
    instructions: '',
    price: 0,
  });

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  const productDetailQuery = useQuery({
    queryKey: ['catalog-product-detail', productId],
    queryFn: async () => {
      const response = await api.get<ProductDetailResponse>(`/product/detail/${productId}`);
      return response.data.data;
    },
    enabled: !!productId,
  });

  useEffect(() => {
    if (!productDetailQuery.data) return;
    setForm({
      name: productDetailQuery.data.name,
      info: productDetailQuery.data.info || '',
      weight: 0,
      description: productDetailQuery.data.description_list?.join('\n') || '',
      instructions: productDetailQuery.data.instructions_list?.join('\n') || '',
      price: Number(productDetailQuery.data.price || 0),
    });
  }, [productDetailQuery.data]);

  const updateProductMutation = useMutation({
    mutationFn: async (payload: UpdateProductPayload) => {
      const response = await api.put(`/product/${productId}`, payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || 'Product berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-product-detail', productId] });
      navigate('/catalog');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || 'Gagal memperbarui product.';
      toast.error(String(message));
    },
  });

  const variantCount = useMemo(() => productDetailQuery.data?.variants_list?.length || 0, [productDetailQuery.data]);
  const summaryDescription = useMemo(() => productDetailQuery.data?.description_list?.[0] || '-', [productDetailQuery.data]);
  const summaryInstruction = useMemo(() => productDetailQuery.data?.instructions_list?.[0] || '-', [productDetailQuery.data]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name?.trim() || '';
    const info = form.info?.trim() || '';
    const description = form.description?.trim() || '';
    const instructions = form.instructions?.trim() || '';
    const price = Number(form.price || 0);
    const weight = Number(form.weight || 0);

    if (!name || !info || !description || !instructions) {
      toast.error('Nama, info, deskripsi, dan instruksi wajib diisi.');
      return;
    }

    if (!price || price < 0) {
      toast.error('Harga product harus valid.');
      return;
    }

    updateProductMutation.mutate({
      name,
      info,
      weight,
      description,
      instructions,
      price,
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button type="button" variant="outline" className="rounded-xl border-gray-200" onClick={() => navigate('/catalog')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Catalog
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Product</h1>
          <p className="text-gray-500 mt-1">Halaman edit product khusus agar flow submit dan update product tidak bercampur, sekaligus memaksimalkan endpoint product yang sudah tersedia di backend.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl w-fit">Admin + Owner edit page</Badge>
      </div>

      {productDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat detail product...
          </CardContent>
        </Card>
      ) : productDetailQuery.isError || !productDetailQuery.data ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            Gagal memuat data product. Silakan kembali ke halaman catalog dan coba lagi.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-[0.8fr_1.2fr] gap-6 xl:gap-8 items-start">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Box className="w-5 h-5" />
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-none">Product layer</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 break-words">{productDetailQuery.data.name}</h2>
                <p className="text-sm text-gray-500 break-all mt-1">ID: {productDetailQuery.data.id}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Status</span>
                  <strong className="text-slate-900">{productDetailQuery.data.is_active ? 'Active' : 'Inactive'}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Company</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{productDetailQuery.data.company || '-'}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Ringkasan deskripsi</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{summaryDescription}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Ringkasan instruksi</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{summaryInstruction}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
                Product ini saat ini terhubung ke <strong>{variantCount}</strong> variant / pack type. Edit product menjaga layer inti, sedangkan pengelolaan variant tetap dilanjutkan di modul Variants.
              </div>

              <div className="rounded-2xl bg-slate-900 text-white p-4 text-sm flex items-center justify-between gap-3">
                <span className="flex items-center gap-2"><Boxes className="w-4 h-4" />Variant slots aktif</span>
                <strong>{variantCount}</strong>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Form edit product</h2>
                <p className="text-sm text-gray-500 mt-1">Terhubung ke endpoint <strong>GET /product/detail/{'{product_id}'}</strong> dan <strong>PUT /product/{'{product_id}'}</strong>.</p>
              </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="edit-product-name-page">Nama product</Label>
                    <Input id="edit-product-name-page" value={form.name || ''} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nama product" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-product-info-page">Info singkat</Label>
                    <Input id="edit-product-info-page" value={form.info || ''} onChange={(e) => setForm((prev) => ({ ...prev, info: e.target.value }))} placeholder="Info singkat product" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="edit-product-price-page">Harga dasar</Label>
                    <Input id="edit-product-price-page" type="number" min="0" value={form.price || ''} onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-product-weight-page">Berat (gram)</Label>
                    <Input id="edit-product-weight-page" type="number" min="0" value={form.weight || ''} onChange={(e) => setForm((prev) => ({ ...prev, weight: Number(e.target.value) }))} placeholder="Masukkan berat jika diperlukan" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-product-description-page">Deskripsi</Label>
                  <textarea
                    id="edit-product-description-page"
                    value={form.description || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="min-h-[140px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full"
                    placeholder="Deskripsi product"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-product-instructions-page">Instruksi penggunaan</Label>
                  <textarea
                    id="edit-product-instructions-page"
                    value={form.instructions || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                    className="min-h-[140px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full"
                    placeholder="Instruksi penggunaan"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-gray-500">Setelah simpan berhasil, halaman akan kembali ke daftar catalog.</p>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                    <Button type="button" variant="ghost" className="rounded-xl w-full sm:w-auto" onClick={() => navigate('/catalog')}>
                      Batal
                    </Button>
                    <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 w-full sm:w-auto" disabled={updateProductMutation.isPending}>
                      {updateProductMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                      ) : (
                        <><Save className="w-4 h-4 mr-2" />Update Product</>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
