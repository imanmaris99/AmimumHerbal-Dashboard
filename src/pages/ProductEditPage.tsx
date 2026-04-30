import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  price?: number | null;
  discount?: number | null;
  discounted_price?: number | null;
}

interface ProductImageItem {
  id: number;
  product_id: string;
  image_url: string;
  image_thumb_url?: string | null;
  image_card_url?: string | null;
  image_detail_url?: string | null;
  position: number;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProductDetailData {
  id: string;
  name: string;
  info?: string | null;
  variants_list?: ProductDetailVariant[];
  description_list?: string[];
  instructions_list?: string[];
  images?: ProductImageItem[];
  price: number;
  min_variant_price?: number | null;
  max_variant_price?: number | null;
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
  const { t } = useTranslation();
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
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [draggingOver, setDraggingOver] = useState(false);
  const [reorderBusy, setReorderBusy] = useState(false);
  const [dragImageId, setDragImageId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    setImages((productDetailQuery.data.images || []).slice().sort((a, b) => a.position - b.position));
  }, [productDetailQuery.data]);

  const updateProductMutation = useMutation({
    mutationFn: async (payload: UpdateProductPayload) => {
      const response = await api.put(`/product/${productId}`, payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || t('productEditPage.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-product-detail', productId] });
      navigate('/catalog');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || t('productEditPage.updateError');
      toast.error(String(message));
    },
  });

  const variantCount = useMemo(() => productDetailQuery.data?.variants_list?.length || 0, [productDetailQuery.data]);
  const summaryDescription = useMemo(() => productDetailQuery.data?.description_list?.[0] || '-', [productDetailQuery.data]);
  const summaryInstruction = useMemo(() => productDetailQuery.data?.instructions_list?.[0] || '-', [productDetailQuery.data]);
  const variantPriceSummary = useMemo(() => {
    const data = productDetailQuery.data;
    if (!data) return '-';

    const minPrice = Number(data.min_variant_price ?? data.price ?? 0);
    const maxPrice = Number(data.max_variant_price ?? data.price ?? 0);

    if (!variantCount) {
      return `Belum ada variant, harga dasar product Rp ${minPrice.toLocaleString('id-ID')}`;
    }

    if (minPrice === maxPrice) {
      return `Semua variant di Rp ${minPrice.toLocaleString('id-ID')}`;
    }

    return `Rp ${minPrice.toLocaleString('id-ID')} - Rp ${maxPrice.toLocaleString('id-ID')}`;
  }, [productDetailQuery.data, variantCount]);

  const refreshDetail = async () => {
    await queryClient.invalidateQueries({ queryKey: ['catalog-product-detail', productId] });
    await productDetailQuery.refetch();
  };

  const uploadFiles = async (files: FileList | File[]) => {
    if (!productId) return;
    const list = Array.from(files);
    if (!list.length) return;

    const maxMb = 5;
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const rejected = list.filter((file) => !allowed.includes(file.type) || file.size > maxMb * 1024 * 1024);
    if (rejected.length) {
      toast.error(`Sebagian file ditolak. Format: JPG/PNG/WEBP, max ${maxMb}MB`);
    }

    const validFiles = list.filter((file) => allowed.includes(file.type) && file.size <= maxMb * 1024 * 1024);
    if (!validFiles.length) return;

    setUploading(true);
    setUploadErrors({});

    let successCount = 0;
    for (const file of validFiles) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        await api.post(`/product/${productId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
            setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
          },
        });
        successCount += 1;
      } catch (error: any) {
        const msg = error?.response?.data?.detail?.message || 'Gagal upload';
        setUploadErrors((prev) => ({ ...prev, [file.name]: String(msg) }));
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} gambar berhasil di-upload`);
      await refreshDetail();
    }
    if (successCount < validFiles.length) {
      toast.error(`${validFiles.length - successCount} gambar gagal. Klik retry untuk ulang file gagal.`);
    }

    setUploading(false);
  };

  const retryFailedUploads = async () => {
    const failedNames = Object.keys(uploadErrors);
    if (!failedNames.length || !fileInputRef.current?.files?.length) return;
    const retries = Array.from(fileInputRef.current.files as FileList).filter((f: File) => failedNames.includes(f.name));
    await uploadFiles(retries as File[]);
  };

  const handleSetPrimary = async (imageId: number) => {
    if (!productId) return;
    const prev = images;
    setImages((curr) => curr.map((img) => ({ ...img, is_primary: img.id === imageId })));
    try {
      await api.patch(`/product/${productId}/images/${imageId}/primary`);
      toast.success('Primary image diperbarui');
      await refreshDetail();
    } catch (error: any) {
      setImages(prev);
      toast.error(String(error?.response?.data?.detail?.message || 'Gagal set primary image'));
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!productId) return;
    if (!window.confirm('Hapus gambar ini?')) return;
    try {
      await api.delete(`/product/${productId}/images/${imageId}`);
      toast.success('Gambar dihapus');
      await refreshDetail();
    } catch (error: any) {
      toast.error(String(error?.response?.data?.detail?.message || 'Gagal hapus gambar'));
    }
  };

  const handleReorder = async (next: ProductImageItem[]) => {
    if (!productId) return;
    const prev = images;
    setImages(next);
    setReorderBusy(true);
    try {
      await api.patch(`/product/${productId}/images/reorder`, { image_ids: next.map((item) => item.id) });
      toast.success('Urutan gambar diperbarui');
      await refreshDetail();
    } catch (error: any) {
      setImages(prev);
      toast.error(String(error?.response?.data?.detail?.message || 'Gagal reorder gambar'));
    } finally {
      setReorderBusy(false);
    }
  };

  const handleDropReorder = (targetId: number) => {
    if (dragImageId == null || dragImageId === targetId) return;
    const from = images.findIndex((img) => img.id === dragImageId);
    const to = images.findIndex((img) => img.id === targetId);
    if (from < 0 || to < 0) return;
    const next = images.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    handleReorder(next);
    setDragImageId(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name?.trim() || '';
    const info = form.info?.trim() || '';
    const description = form.description?.trim() || '';
    const instructions = form.instructions?.trim() || '';
    const price = Number(form.price || 0);
    const weight = Number(form.weight || 0);

    if (!name || !info || !description || !instructions) {
      toast.error(t('productEditPage.validation.required'));
      return;
    }

    if (!price || price < 0) {
      toast.error(t('productEditPage.validation.price'));
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
              {t('productEditPage.back')}
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('productEditPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('productEditPage.subtitle')}</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl w-fit">{t('productEditPage.badge')}</Badge>
      </div>

      {productDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('productEditPage.loading')}
          </CardContent>
        </Card>
      ) : productDetailQuery.isError || !productDetailQuery.data ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            {t('productEditPage.loadError')}
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
                  <span>Range harga variant</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{variantPriceSummary}</strong>
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
                Product ini saat ini terhubung ke <strong>{variantCount}</strong> variant / pack type. Edit product menjaga layer inti katalog, sedangkan harga jual operasional per variant tetap dikelola di modul Variants.
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
                <div className="space-y-3">
                  <Label>Galeri Produk</Label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
                    onDragLeave={() => setDraggingOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDraggingOver(false); uploadFiles(e.dataTransfer.files); }}
                    className={`rounded-2xl border-2 border-dashed p-4 transition ${draggingOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}
                  >
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Upload / Pilih File</Button>
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Ambil dari Kamera</Button>
                      {uploading && <span className="text-sm text-gray-600">Uploading...</span>}
                      {reorderBusy && <span className="text-sm text-gray-600">Menyimpan urutan...</span>}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple capture="environment" className="hidden" onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
                    <p className="text-xs text-gray-500 mt-2">Drag & drop gambar ke area ini atau klik upload. Format: JPG/PNG/WEBP, max 5MB.</p>

                    {Object.keys(uploadProgress).length > 0 && (
                      <div className="mt-3 space-y-1 text-xs text-gray-600">
                        {Object.entries(uploadProgress).map(([name, pct]) => (
                          <div key={name}>{name}: {pct}%</div>
                        ))}
                      </div>
                    )}
                    {Object.keys(uploadErrors).length > 0 && (
                      <div className="mt-3 text-xs text-red-600 space-y-1">
                        {Object.entries(uploadErrors).map(([name, err]) => <div key={name}>{name}: {err}</div>)}
                        <Button type="button" size="sm" variant="outline" onClick={retryFailedUploads}>Retry gagal</Button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {images.map((img, idx) => (
                      <div
                        key={img.id}
                        draggable
                        onDragStart={() => setDragImageId(img.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDropReorder(img.id)}
                        className={`rounded-2xl border p-3 space-y-2 bg-white ${dragImageId === img.id ? 'opacity-60 border-emerald-400' : 'border-gray-200'}`}
                      >
                        <img src={img.image_card_url || img.image_thumb_url || img.image_url} alt={`product-${img.id}`} className="w-full h-40 object-cover rounded-xl" />
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant={img.is_primary ? 'default' : 'outline'} onClick={() => handleSetPrimary(img.id)}>
                            {img.is_primary ? 'Primary' : 'Set Primary'}
                          </Button>
                          <Button type="button" size="sm" variant="outline" disabled={idx === 0} onClick={() => {
                            const next = images.slice();
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            handleReorder(next);
                          }}>↑</Button>
                          <Button type="button" size="sm" variant="outline" disabled={idx === images.length - 1} onClick={() => {
                            const next = images.slice();
                            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                            handleReorder(next);
                          }}>↓</Button>
                          <Button type="button" size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteImage(img.id)}>Delete</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                    <Label htmlFor="edit-product-price-page">Harga dasar product</Label>
                    <Input id="edit-product-price-page" type="number" min="0" value={form.price || ''} onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))} required />
                    <p className="text-xs text-gray-500">Harga ini menjaga layer dasar product. Harga jual utama per pack/variant tetap dikelola di halaman Variants.</p>
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
                  <p className="text-xs text-gray-500">Setelah simpan berhasil, halaman akan kembali ke daftar catalog. Untuk mengubah harga jual per variant, lanjutkan dari modul Variants.</p>
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
