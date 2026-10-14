import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Box, ImageOff, PlusCircle, Search, Layers3, Boxes, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getAdminSafeErrorMessage } from '@/lib/dashboard';
import { validateImageFile } from '@/lib/imageValidation';

interface ProductionItem {
  id: number;
  name: string;
  photo_url?: string | null;
  description_list?: string[];
  category?: string | null;
  created_at: string;
}

interface ProductionResponse {
  status_code: number;
  message: string;
  data: ProductionItem[];
}

interface ProductItem {
  id: string;
  name: string;
  price: number;
  primary_image_url?: string | null;
  gallery_images?: Array<{ id?: number; url?: string; is_primary?: boolean; sort_order?: number }>;
  thumbnail_url?: string | null;
  min_variant_price?: number | null;
  max_variant_price?: number | null;
  created_at: string;
  brand_info?: {
    id?: number;
    name?: string;
    category?: string;
  } | null;
  all_variants?: Array<{
    id: number;
    variant?: string | null;
    stock?: number | null;
    price?: number | null;
    discount?: number | null;
    img?: string | null;
  }>;
}

interface ProductResponse {
  status_code: number;
  message: string;
  data: ProductItem[];
}

interface VariantIndexItem {
  id: number;
  product_id?: string;
}

interface VariantIndexResponse {
  data: VariantIndexItem[];
}

interface ProductReadinessIssue {
  type: 'image' | 'variant' | 'price' | 'brand';
  label: string;
}

interface CreateProductPayload {
  name: string;
  info: string;
  weight: number;
  description: string;
  instruction: string;
  price: number;
  product_by_id: number;
}

interface CreateProductResponse {
  status_code: number;
  message: string;
  data: {
    id: string;
    name: string;
    product_by_id: number;
    price: number;
  };
}

const initialForm: CreateProductPayload = {
  name: '',
  info: '',
  weight: 0,
  description: '',
  instruction: '',
  price: 0,
  product_by_id: 0,
};

export default function CatalogPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [variantFocus, setVariantFocus] = useState<'all' | 'needsVariant' | 'ready'>('all');
  const [form, setForm] = useState<CreateProductPayload>(initialForm);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    data: productionsResponse,
    isLoading: productionsLoading,
    isError: productionsError,
    error: productionsErrorDetail,
    refetch: refetchProductions,
  } = useQuery({
    queryKey: ['catalog-productions'],
    queryFn: async () => {
      const response = await api.get<ProductionResponse>('/brand/all');
      return response.data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const {
    data: productsResponse,
    isLoading: productsLoading,
    isError: productsError,
    error: productsErrorDetail,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['catalog-products'],
    queryFn: async () => {
      try {
        const response = await api.get<ProductResponse>('/product/all', {
          timeout: 15000,
        });
        return response.data;
      } catch (error: any) {
        const status = error?.response?.status;
        if (status !== 404 && status !== 409) throw error;

        // Fallback: tarik produk per production jika endpoint /product/all sedang conflict.
        const brands = await api.get<ProductionResponse>('/brand/all', { timeout: 15000 });
        const brandIds = (brands.data?.data || []).map((b) => b.id);

        const settled = await Promise.allSettled(
          brandIds.map((id) => api.get<ProductResponse>(`/product/production/${id}`, { timeout: 15000 }))
        );

        const merged: ProductItem[] = [];
        for (const item of settled) {
          if (item.status === 'fulfilled') {
            merged.push(...(item.value.data?.data || []));
          }
        }

        const unique = Array.from(new Map(merged.map((p) => [p.id, p])).values());

        return {
          status_code: 200,
          message: unique.length ? 'Loaded from fallback per production' : 'No products available yet',
          data: unique,
        } as ProductResponse;
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const response = await api.post<CreateProductResponse>('/product/create', payload);
      return response.data;
    },
    onSuccess: async (response) => {
      const productId = response?.data?.id;
      if (productId && pendingImages.length > 0) {
        setIsUploadingImages(true);
        try {
          for (const file of pendingImages) {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/product/${productId}/images`, formData, {
              timeout: 60000,
              onUploadProgress: (e) => {
                const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
                setUploadProgress((prev) => ({ ...prev, [file.name]: progress }));
              },
            });
          }
          toast.success('Produk dan galeri gambar berhasil dibuat');
        } catch (error: any) {
          toast.error(getAdminSafeErrorMessage(error, 'Produk berhasil dibuat, tetapi beberapa gambar belum berhasil di-upload. Coba upload ulang dari halaman edit produk.'));
        } finally {
          setIsUploadingImages(false);
          setUploadProgress({});
          setPendingImages([]);
        }
      } else {
        toast.success(response.message || t('catalogPage.errors.createSuccess'));
      }
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
    },
    onError: (error: any) => {
      toast.error(getAdminSafeErrorMessage(error, t('catalogPage.errors.createFailed')));
    },
  });

  const productions = productionsResponse?.data ?? [];
  const products = productsResponse?.data ?? [];

  const { data: variantIndexResponse } = useQuery({
    queryKey: ['catalog-variant-index'],
    queryFn: async () => {
      const response = await api.get<VariantIndexResponse>('/type/all');
      return response.data;
    },
  });

  const normalizedProducts = useMemo(() => {
    const variantRows = variantIndexResponse?.data || [];
    const variantCountByProduct = new Map<string, number>();
    for (const row of variantRows) {
      const pid = String(row.product_id || '');
      if (!pid) continue;
      variantCountByProduct.set(pid, (variantCountByProduct.get(pid) || 0) + 1);
    }

    const resolveImageUrl = (url?: string | null) => {
      if (!url) return '';
      if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
      const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    };

    return products.map((product) => {
      const validVariants = (product.all_variants || []).filter((variant) => {
        return Boolean(
          variant && (
            variant.id ||
            variant.variant ||
            variant.stock != null ||
            variant.discount != null
          )
        );
      });

      const fallbackVariantCount = variantCountByProduct.get(String(product.id)) || 0;
      const normalizedVariants = validVariants.length > 0
        ? validVariants
        : Array.from({ length: fallbackVariantCount }, (_, idx) => ({ id: idx + 1 }));

      const minVariantPrice = Number(product.min_variant_price ?? product.price ?? 0);
      const maxVariantPrice = Number(product.max_variant_price ?? product.price ?? 0);
      const priceSummary = validVariants.length
        ? minVariantPrice === maxVariantPrice
          ? `Rp ${minVariantPrice.toLocaleString('id-ID')}`
          : `Rp ${minVariantPrice.toLocaleString('id-ID')} - Rp ${maxVariantPrice.toLocaleString('id-ID')}`
        : `Rp ${Number(product.price || 0).toLocaleString('id-ID')}`;

      const primaryImageUrl = resolveImageUrl(product.primary_image_url);
      const galleryImages = (product.gallery_images || []).map((img) => ({ ...img, url: resolveImageUrl(img.url) }));
      const variantImageUrl = resolveImageUrl((product.all_variants || []).find((v) => v?.img)?.img || '');
      const thumbnailUrl = primaryImageUrl || galleryImages?.[0]?.url || variantImageUrl || null;
      const readinessIssues: ProductReadinessIssue[] = [];

      if (!thumbnailUrl) readinessIssues.push({ type: 'image', label: 'Belum ada foto utama' });
      if (normalizedVariants.length === 0) readinessIssues.push({ type: 'variant', label: 'Belum ada varian' });
      if (Number(product.price || 0) <= 0 && minVariantPrice <= 0) readinessIssues.push({ type: 'price', label: 'Harga belum valid' });
      if (!product.brand_info?.name) readinessIssues.push({ type: 'brand', label: 'Brand belum terbaca' });

      return {
        ...product,
        primary_image_url: primaryImageUrl,
        gallery_images: galleryImages,
        thumbnail_url: thumbnailUrl,
        validVariants: normalizedVariants,
        minVariantPrice,
        maxVariantPrice,
        priceSummary,
        readinessIssues,
        isMarketplaceReady: readinessIssues.length === 0,
      };
    });
  }, [products, variantIndexResponse?.data]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return normalizedProducts.filter((product) => {
      const productionName = product.brand_info?.name?.toLowerCase() || '';
      const keywordMatch = !keyword || (
        product.name.toLowerCase().includes(keyword) ||
        productionName.includes(keyword) ||
        product.id.toLowerCase().includes(keyword)
      );

      if (!keywordMatch) return false;

      const variantCount = product.validVariants?.length || 0;
      if (variantFocus === 'needsVariant') return variantCount === 0;
      if (variantFocus === 'ready') return variantCount > 0;
      return true;
    });
  }, [normalizedProducts, search, variantFocus]);

  const totalVariants = filteredProducts.reduce((sum, product) => sum + (product.validVariants?.length || 0), 0);
  const productsWithoutImage = normalizedProducts.filter((product) => !product.thumbnail_url).length;
  const productsWithoutVariant = normalizedProducts.filter((product) => (product.validVariants?.length || 0) === 0).length;
  const productsNeedingReview = normalizedProducts.filter((product) => product.readinessIssues.length > 0).length;

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return normalizedProducts.find((item) => item.id === selectedProductId) || null;
  }, [normalizedProducts, selectedProductId]);


  const handleChange = (field: keyof CreateProductPayload, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'weight' || field === 'price' || field === 'product_by_id' ? Number(value) : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const info = form.info.trim();
    const description = form.description.trim();
    const instruction = form.instruction.trim();
    const price = Number(form.price || 0);
    const weight = Number(form.weight || 0);

    if (!form.product_by_id) {
      toast.error(t('catalogPage.errors.selectProduction'));
      return;
    }
    if (!name || !info || !description || !instruction) {
      toast.error('Nama, info singkat, deskripsi, dan instruksi produk wajib diisi.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Harga dasar produk wajib lebih dari Rp0 agar katalog tidak tampil membingungkan.');
      return;
    }
    if (!Number.isFinite(weight) || weight <= 0) {
      toast.error('Berat produk wajib lebih dari 0 gram untuk menjaga kesiapan ongkir.');
      return;
    }

    createProductMutation.mutate({ ...form, name, info, description, instruction, price, weight });
  };

  const handlePendingFiles = (files: FileList | null) => {
    if (!files) return;
    const nextFiles = Array.from(files).filter((file) => validateImageFile(file));
    if (nextFiles.length === 0) return;

    setPendingImages((prev) => [...prev, ...nextFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('catalogPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('catalogPage.subtitle')}</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl">{t('catalogPage.badge')}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><Box className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Visible Products</p><p className="text-2xl font-bold text-gray-900 mt-1">{filteredProducts.length}</p><p className="text-[11px] text-gray-400 mt-2">Produk yang sedang terpantau</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Layers3 className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">DB</span></div><p className="text-sm font-medium text-gray-500 mt-4">Brand / Productions</p><p className="text-2xl font-bold text-gray-900 mt-1">{productions.length}</p><p className="text-[11px] text-gray-400 mt-2">Source relasi untuk product_by_id</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><Boxes className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Flow</span></div><p className="text-sm font-medium text-gray-500 mt-4">Variant Slots</p><p className="text-2xl font-bold text-gray-900 mt-1">{totalVariants}</p><p className="text-[11px] text-gray-400 mt-2">Pack type mengikuti produk setelah submit</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Audit</span></div><p className="text-sm font-medium text-gray-500 mt-4">Perlu Dilengkapi</p><p className="text-2xl font-bold text-gray-900 mt-1">{productsNeedingReview}</p><p className="text-[11px] text-gray-400 mt-2">{productsWithoutImage} tanpa foto • {productsWithoutVariant} tanpa varian</p></CardContent></Card>
      </div>

      {productsNeedingReview > 0 && (
        <Card className="border-none bg-amber-50 shadow-sm rounded-3xl ring-1 ring-amber-100">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                  <ImageOff className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-amber-950">Product readiness warning</p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-800">
                    Ada produk yang belum siap tampil maksimal di marketplace. Prioritaskan upload foto utama, tambah varian/stok, dan cek harga sebelum promosi lebih luas.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs sm:min-w-[320px]">
                <div className="rounded-2xl bg-white px-3 py-2 text-amber-900">
                  <strong className="block text-lg">{productsNeedingReview}</strong>
                  perlu cek
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 text-amber-900">
                  <strong className="block text-lg">{productsWithoutImage}</strong>
                  tanpa foto
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 text-amber-900">
                  <strong className="block text-lg">{productsWithoutVariant}</strong>
                  tanpa varian
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 2xl:grid-cols-[1.1fr_0.9fr] gap-6 xl:gap-8 items-start">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Product submit form</h2>
              <p className="text-sm text-gray-500 mt-1">Nyambung ke tabel <strong>products</strong>, dengan foreign key <strong>product_by_id</strong> ke tabel <strong>productions</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama produk</Label>
                  <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Contoh: Madu Herbal AmImUm" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_by_id">Brand / production</Label>
                  <select id="product_by_id" value={form.product_by_id || ''} onChange={(e) => handleChange('product_by_id', e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none w-full" required>
                    <option value="">Pilih production</option>
                    {productions.map((production) => (
                      <option key={production.id} value={production.id}>{production.name}{production.category ? ` - ${production.category}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="price">Harga dasar product</Label>
                  <Input id="price" type="number" min="0" value={form.price || ''} onChange={(e) => handleChange('price', e.target.value)} placeholder="50000" required />
                  <p className="text-xs text-gray-500">Harga ini dipakai sebagai layer dasar product. Harga jual final per kemasan/variant dilanjutkan di modul Variants.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Berat (gram)</Label>
                  <Input id="weight" type="number" min="0" value={form.weight || ''} onChange={(e) => handleChange('weight', e.target.value)} placeholder="250" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="info">Info singkat</Label>
                <Input id="info" value={form.info} onChange={(e) => handleChange('info', e.target.value)} placeholder="Ringkasan isi, ukuran, atau positioning produk" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <textarea id="description" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Deskripsi produk untuk dashboard dan storefront" className="min-h-[110px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instruction">Instruksi penggunaan</Label>
                <textarea id="instruction" value={form.instruction} onChange={(e) => handleChange('instruction', e.target.value)} placeholder="Aturan pakai, saran konsumsi, atau petunjuk penggunaan" className="min-h-[110px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full" required />
              </div>

              <div className="space-y-3">
                <Label>Galeri gambar (opsional saat create)</Label>
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImages}>Pilih File / Kamera</Button>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple className="hidden" onChange={(e) => handlePendingFiles(e.target.files)} />
                    {isUploadingImages && <span className="text-sm text-gray-600">Mengunggah gambar...</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Format JPG/PNG/WebP maksimal 10MB. Gambar akan di-upload otomatis setelah product berhasil dibuat.</p>

                  {pendingImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {pendingImages.map((file, idx) => (
                        <div key={`${file.name}-${idx}`} className="text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 flex items-center justify-between gap-3">
                          <span className="truncate">{file.name}</span>
                          <div className="flex items-center gap-2">
                            {uploadProgress[file.name] != null && <span>{uploadProgress[file.name]}%</span>}
                            <button type="button" className="text-red-600" onClick={() => removePendingFile(idx)}>Hapus</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2">
                <p className="text-xs text-gray-500 leading-relaxed lg:max-w-xl">Setelah product dibuat, tahap berikutnya secara database adalah melengkapi <strong>pack_types</strong> sebagai variant/kemasan yang terhubung ke <strong>products.id</strong>. Di sana harga jual per variant bisa dibuat lebih presisi.</p>
                <Button type="submit" disabled={createProductMutation.isPending} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {createProductMutation.isPending ? 'Menyimpan...' : 'Simpan Produk Baru'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 border-emerald-100 overflow-hidden p-5 sm:p-8">
            <h3 className="text-lg font-bold text-emerald-900">Matrix submit & edit product</h3>
            <div className="mt-4 space-y-3 text-sm text-emerald-800">
              <p><strong>Admin</strong> dan <strong>owner</strong> boleh submit dan edit product karena endpoint backend memakai <code>admin_access_required</code>.</p>
              <p><strong>Owner</strong> tetap memegang pengawasan strategis, tetapi operasional product management bisa dibantu admin.</p>
              <p><strong>Category</strong> pada flow ini adalah <code>tag_categories</code> yang terhubung ke production/product layer, bukan kategori article/content.</p>
              <p><strong>Harga product</strong> diposisikan sebagai layer dasar katalog. Harga operasional penjualan mengikuti variant/pack type setelah product selesai dibuat.</p>
              <p>Flow database dan endpoint yang dipakai di dashboard:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Pilih <strong>production / brand</strong> dari tabel <code>productions</code></li>
                <li>Buat baris baru di tabel <code>products</code> dengan <code>product_by_id</code> lewat <code>POST /product/create</code></li>
                <li>Lihat detail product lewat <code>GET /product/detail/{'{product_id}'}</code></li>
                <li>Edit product lewat dedicated page yang terhubung ke <code>PUT /product/{'{product_id}'}</code></li>
                <li>Lanjutkan setup varian di tabel <code>pack_types</code> untuk kemasan, stok, dan discount</li>
              </ol>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Existing products</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Pantau produk yang sudah ada sebelum menambah item baru.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama produk, production, atau id..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full pr-24" />
                  {search ? (
                    <Button type="button" variant="ghost" className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-lg px-3 text-xs text-gray-500 hover:text-gray-700" onClick={() => setSearch('')}>
                      Reset
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant={variantFocus === 'all' ? 'default' : 'outline'} className="rounded-xl" onClick={() => setVariantFocus('all')}>
                    Semua Produk
                  </Button>
                  <Button type="button" size="sm" variant={variantFocus === 'needsVariant' ? 'default' : 'outline'} className="rounded-xl" onClick={() => setVariantFocus('needsVariant')}>
                    Butuh Varian
                  </Button>
                  <Button type="button" size="sm" variant={variantFocus === 'ready' ? 'default' : 'outline'} className="rounded-xl" onClick={() => setVariantFocus('ready')}>
                    Sudah Ada Varian
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Menampilkan <strong>{filteredProducts.length}</strong> dari <strong>{normalizedProducts.length}</strong> produk.
                </p>
              </div>
            </CardHeader>
            <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
              {productsLoading ? (
                <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">Memuat data katalog...</div>
              ) : productsError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-8 text-center text-sm text-gray-600 space-y-3">
                  <p>Gagal memuat data katalog. Cek koneksi backend lalu coba lagi.</p>
                  <p className="text-xs text-gray-400">
                    {getAdminSafeErrorMessage(productsErrorDetail, 'Data produk belum bisa dimuat saat ini.')}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      void refetchProductions();
                      void refetchProducts();
                    }}
                  >
                    Muat ulang katalog
                  </Button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">Tidak ada produk yang cocok dengan pencarian saat ini. Coba reset search atau gunakan kata kunci lain.</div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      className={`w-full rounded-3xl bg-white p-4 text-left shadow-[0_8px_22px_rgba(15,23,42,0.06)] ring-1 ring-gray-100 transition hover:bg-gray-50 ${selectedProductId === product.id ? 'ring-emerald-200 bg-emerald-50/40' : ''}`}
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 gap-4">
                          <img
                            src={product.thumbnail_url || 'https://placehold.co/72x72?text=Belum+Ada+Gambar'}
                            alt={product.name}
                            className="h-16 w-16 shrink-0 rounded-2xl border border-gray-100 object-cover bg-gray-50"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.src.includes('placehold.co')) target.src = 'https://placehold.co/72x72?text=Belum+Ada+Gambar';
                            }}
                          />
                          <div className="min-w-0 space-y-1">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Produk Katalog</p>
                            <p className="break-words text-sm font-bold text-gray-900 sm:text-base">{product.name}</p>
                            <p className="break-all text-[11px] font-medium text-gray-400">ID: {product.id}</p>
                            <p className="text-xs text-gray-500">Production: <strong className="text-gray-700">{product.brand_info?.name || '-'}</strong></p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {product.isMarketplaceReady ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">Siap tampil</span>
                              ) : product.readinessIssues.map((issue) => (
                                <span key={`${product.id}-${issue.type}`} className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700 ring-1 ring-amber-100">
                                  {issue.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 lg:min-w-[360px]">
                          <div className="rounded-2xl bg-gray-50 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Harga</p>
                            <p className="mt-1 font-bold text-gray-900">{product.priceSummary}</p>
                            <p className="text-[10px] text-gray-400">{product.validVariants?.length ? 'range variant' : 'harga dasar'}</p>
                          </div>
                          <div className="rounded-2xl bg-gray-50 px-3 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Varian</p>
                            <p className="mt-1 font-bold text-gray-900">{product.validVariants?.length || 0}</p>
                            <p className="text-[10px] text-gray-400">slot aktif</p>
                          </div>
                          <div className="col-span-2 flex items-center sm:col-span-1">
                            <Button type="button" variant="outline" className="w-full rounded-xl" onClick={(e) => { e.stopPropagation(); navigate(`/catalog/edit/${product.id}`); }}>
                              <PencilLine className="w-4 h-4 mr-2" />
                              Edit Produk Ini
                            </Button>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedProduct && (
                <div className="mt-4 mx-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-start gap-4">
                    <img src={selectedProduct.thumbnail_url || 'https://placehold.co/96x96?text=Belum+Ada+Gambar'} alt={selectedProduct.name} className="w-20 h-20 rounded-xl object-cover border border-emerald-100 bg-white" />
                    <div className="space-y-1 text-sm text-emerald-900">
                      <p className="font-bold text-base">{selectedProduct.name}</p>
                      <p>ID: {selectedProduct.id}</p>
                      <p>Production: {selectedProduct.brand_info?.name || '-'}</p>
                      <p>Harga: {selectedProduct.priceSummary}</p>
                      <p>Variant aktif: {selectedProduct.validVariants?.length || 0}</p>
                      {selectedProduct.readinessIssues.length > 0 ? (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <strong>Perlu dilengkapi:</strong> {selectedProduct.readinessIssues.map((issue) => issue.label).join(', ')}. Klik Edit Produk untuk upload foto, lalu lengkapi varian dari modul Variants.
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-emerald-100 bg-white/70 px-3 py-2 text-xs text-emerald-800">
                          Produk ini sudah punya foto, brand, harga, dan varian dasar untuk tampil lebih siap di storefront.
                        </div>
                      )}
                      <div className="pt-2 flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => navigate(`/catalog/edit/${selectedProduct.id}`)}>
                          <PencilLine className="w-4 h-4 mr-2" />
                          Edit Produk
                        </Button>
                      </div>

                      <p className="pt-3 text-xs text-emerald-800">
                        Untuk tambah, update, dan upload varian per product, lanjutkan dari halaman <strong>Edit Produk</strong> pada section <strong>Variant slots aktif</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
