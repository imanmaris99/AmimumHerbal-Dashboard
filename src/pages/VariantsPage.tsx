import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boxes, PackagePlus, Layers3, Search, Archive, ShieldCheck, PencilLine, ImagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ProductItem {
  id: string;
  name: string;
  price: number;
  created_at: string;
  brand_info?: {
    id?: number;
    name?: string;
    category?: string;
  } | null;
}

interface ProductResponse {
  status_code: number;
  message: string;
  data: ProductItem[];
}

interface VariantItem {
  id?: number;
  product?: string;
  product_id?: string;
  name?: string;
  img?: string | null;
  variant?: string | null;
  expiration?: string | null;
  stock?: number;
  price?: number | null;
  discount?: number | null;
  discounted_price?: number | null;
  updated_at: string;
}

interface VariantResponse {
  status_code: number;
  message: string;
  data: VariantItem[];
}

interface CreateVariantPayload {
  product_id: string;
  name: string;
  min_amount: number;
  variant: string;
  expiration: string;
  stock: number;
  price: number;
}

interface UpdateVariantPayload {
  name: string;
  variant: string;
  expiration: string;
  stock: number;
  price: number;
  discount: number;
}

const initialForm: CreateVariantPayload = {
  product_id: '',
  name: '',
  min_amount: 1,
  variant: '',
  expiration: '',
  stock: 0,
  price: 0,
};

const initialUpdateForm: UpdateVariantPayload = {
  name: '',
  variant: '',
  expiration: '',
  stock: 0,
  price: 0,
  discount: 0,
};

export default function VariantsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CreateVariantPayload>(initialForm);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState<UpdateVariantPayload>(initialUpdateForm);
  const [imageVariantId, setImageVariantId] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['variant-products'],
    queryFn: async () => {
      const response = await api.get<ProductResponse>('/product/all');
      return response.data;
    },
  });

  const { data: variantsResponse, isLoading: variantsLoading } = useQuery({
    queryKey: ['all-pack-types'],
    queryFn: async () => {
      const response = await api.get<VariantResponse>('/type/all');
      return response.data;
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: async (payload: CreateVariantPayload) => {
      const response = await api.post('/type/create', payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || t('variantsPage.messages.createSuccess'));
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['all-pack-types'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      queryClient.invalidateQueries({ queryKey: ['variant-products'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || t('variantsPage.messages.createError');
      toast.error(String(message));
    },
  });

  const uploadVariantImageMutation = useMutation({
    mutationFn: async ({ variantId, file }: { variantId: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.put(`/type/image/${variantId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || t('variantsPage.messages.imageSuccess'));
      setImageVariantId(null);
      setImageFile(null);
      queryClient.invalidateQueries({ queryKey: ['all-pack-types'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || t('variantsPage.messages.imageError');
      toast.error(String(message));
    },
  });

  const products = productsResponse?.data ?? [];
  const variants = variantsResponse?.data ?? [];

  const productLookup = useMemo(() => {
    return new Map(products.map((product) => [String(product.id), product]));
  }, [products]);

  const enrichedVariants = useMemo(() => {
    return variants.map((variant) => {
      const matchedProduct = variant.product_id ? productLookup.get(String(variant.product_id)) : undefined;
      const resolvedProductName =
        typeof variant.product === 'string' && variant.product.trim().length > 0
          ? variant.product
          : matchedProduct?.name || '-';

      const resolvedPackName = variant.name?.trim() || variant.variant?.trim() || '-';

      return {
        ...variant,
        resolvedProductName,
        resolvedPackName,
      };
    });
  }, [variants, productLookup]);

  const filteredVariants = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return enrichedVariants;

    return enrichedVariants.filter((variant) => {
      return (
        (variant.resolvedPackName || '').toLowerCase().includes(keyword) ||
        (variant.resolvedProductName || '').toLowerCase().includes(keyword) ||
        (variant.variant || '').toLowerCase().includes(keyword)
      );
    });
  }, [enrichedVariants, search]);

  const totalStock = filteredVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  const discountedVariants = filteredVariants.filter((variant) => Number(variant.discount || 0) > 0).length;

  const handleChange = (field: keyof CreateVariantPayload, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'min_amount' || field === 'stock' || field === 'price' ? Number(value) : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.product_id) {
      toast.error(t('variantsPage.messages.selectProduct'));
      return;
    }

    createVariantMutation.mutate(form);
  };

  const startEditing = (variant: VariantItem) => {
    if (!variant.id) {
      toast.error(t('variantsPage.messages.invalidUpdateId'));
      return;
    }

    navigate(`/variants/edit/${variant.id}`);
  };

  const openImageFlow = (variant: VariantItem) => {
    if (!variant.id) {
      toast.error(t('variantsPage.messages.invalidImageId'));
      return;
    }

    setImageVariantId(variant.id);
    setImageFile(null);
  };

  const submitImageUpload = () => {
    if (!imageVariantId || !imageFile) {
      toast.error(t('variantsPage.messages.selectImage'));
      return;
    }

    uploadVariantImageMutation.mutate({
      variantId: imageVariantId,
      file: imageFile,
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('variantsPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('variantsPage.subtitle')}</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl">{t('variantsPage.badge')}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><Boxes className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">{t('variantsPage.summary.visibleVariants')}</p><p className="text-2xl font-bold text-gray-900 mt-1">{filteredVariants.length}</p><p className="text-[11px] text-gray-400 mt-2">{t('variantsPage.summary.visibleVariantsHelper')}</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Layers3 className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Relation</span></div><p className="text-sm font-medium text-gray-500 mt-4">{t('variantsPage.summary.productsReady')}</p><p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p><p className="text-[11px] text-gray-400 mt-2">{t('variantsPage.summary.productsReadyHelper')}</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><Archive className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stock</span></div><p className="text-sm font-medium text-gray-500 mt-4">{t('variantsPage.summary.visibleStock')}</p><p className="text-2xl font-bold text-gray-900 mt-1">{totalStock}</p><p className="text-[11px] text-gray-400 mt-2">{t('variantsPage.summary.visibleStockHelper')}</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><ShieldCheck className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">QA</span></div><p className="text-sm font-medium text-gray-500 mt-4">{t('variantsPage.summary.discountedVariants')}</p><p className="text-2xl font-bold text-gray-900 mt-1">{discountedVariants}</p><p className="text-[11px] text-gray-400 mt-2">{t('variantsPage.summary.discountedVariantsHelper')}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6 xl:gap-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('variantsPage.form.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('variantsPage.form.subtitle')}</p>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="product_id">{t('variantsPage.form.product')}</Label>
                  <select id="product_id" value={form.product_id} onChange={(e) => handleChange('product_id', e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none w-full" required>
                    <option value="">{t('variantsPage.form.selectProduct')}</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}{product.brand_info?.name ? ` - ${product.brand_info.name}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">{t('variantsPage.form.packTypeName')}</Label>
                  <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Botol / Sachet / Box" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="variant">{t('variantsPage.form.variant')}</Label>
                  <Input id="variant" value={form.variant} onChange={(e) => handleChange('variant', e.target.value)} placeholder="Original / Mint / Jahe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_amount">{t('variantsPage.form.minimumAmount')}</Label>
                  <Input id="min_amount" type="number" min="1" value={form.min_amount || ''} onChange={(e) => handleChange('min_amount', e.target.value)} placeholder="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">{t('variantsPage.form.stock')}</Label>
                  <Input id="stock" type="number" min="0" value={form.stock || ''} onChange={(e) => handleChange('stock', e.target.value)} placeholder="100" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">{t('variantsPage.form.price')}</Label>
                  <Input id="price" type="number" min="0" value={form.price || ''} onChange={(e) => handleChange('price', e.target.value)} placeholder="25000" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">{t('variantsPage.form.expiration')}</Label>
                <Input id="expiration" value={form.expiration} onChange={(e) => handleChange('expiration', e.target.value)} placeholder={t('variantsPage.form.expirationPlaceholder')} required />
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2">
                <p className="text-xs text-gray-500 leading-relaxed">{t('variantsPage.form.helper')}</p>
                <Button type="submit" disabled={createVariantMutation.isPending} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                  <PackagePlus className="w-4 h-4 mr-2" />
                  {createVariantMutation.isPending ? 'Submitting...' : 'Submit Variant Baru'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 border-emerald-100 overflow-hidden p-5 sm:p-8">
            <h3 className="text-lg font-bold text-emerald-900">Endpoint matrix alignment</h3>
            <div className="mt-4 space-y-3 text-sm text-emerald-800">
              <p><strong>Shared internal</strong>: admin dan owner boleh mengakses area ini, karena backend memakai <code>admin_access_required</code>.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>GET /type/all</code> untuk monitoring variant</li>
                <li><code>POST /type/create</code> untuk submit variant baru</li>
                <li><code>PUT /type/:type_id</code> aktif untuk update stock/discount</li>
                <li><code>PUT /type/image/:type_id</code> aktif untuk upload image variant</li>
                <li><code>DELETE /type/delete/:type_id</code> tetap dipetakan sebagai delete flow sensitif</li>
              </ul>
              <p>Flow relasi DB yang dipakai: <strong>products.id to pack_types.product_id</strong></p>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Operational action panels</h2>
                <p className="text-sm text-gray-500 mt-1">Panel cepat untuk edit stock/discount dan upload image variant.</p>
              </div>
            </CardHeader>
            <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8 space-y-6">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
                Klik <strong>Edit</strong> pada variant yang dipilih untuk masuk ke halaman edit khusus. Ini bikin konteks update lebih jelas dan tidak tercampur dengan create flow.
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('variantsPage.actions.uploadTitle')}</h3>
                {imageVariantId ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="variant-image">{t('variantsPage.actions.imageFile')}</Label>
                      <Input id="variant-image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <Button onClick={submitImageUpload} disabled={uploadVariantImageMutation.isPending} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                        <ImagePlus className="w-4 h-4 mr-2" />
                        {uploadVariantImageMutation.isPending ? t('variantsPage.actions.uploading') : t('variantsPage.actions.upload')}
                      </Button>
                      <Button variant="outline" onClick={() => { setImageVariantId(null); setImageFile(null); }} className="rounded-xl">
                        {t('variantsPage.actions.cancel')}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">{t('variantsPage.actions.uploadEmpty')}</p>
                )}
                {imageVariantId ? (
                  <p className="text-xs text-blue-600 font-medium">{t('variantsPage.actions.imageTarget')}: {imageVariantId}</p>
                ) : null}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 space-y-2">
                <p>{t('variantsPage.actions.deleteFlow')}</p>
                <p>{t('variantsPage.actions.deleteEndpoint')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{t('variantsPage.table.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('variantsPage.table.subtitle')}</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('variantsPage.table.searchPlaceholder')} className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full pr-24" />
              {search ? (
                <Button type="button" variant="ghost" className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-lg px-3 text-xs text-gray-500 hover:text-gray-700" onClick={() => setSearch('')}>
                  {t('variantsPage.table.reset')}
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-gray-500">
              {t('variantsPage.table.showing', { visible: filteredVariants.length, total: enrichedVariants.length })}
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-6 sm:pb-8">
          <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Pack</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Preview</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Product</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Stock</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Price</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Discount</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Expiry</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Image</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variantsLoading || productsLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center text-gray-400 py-8">Loading variant data...</TableCell></TableRow>
              ) : filteredVariants.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-gray-400 py-8">Tidak ada variant yang cocok dengan pencarian saat ini. Coba reset search atau gunakan kata kunci lain.</TableCell></TableRow>
              ) : (
                filteredVariants.map((variant, index) => (
                  <TableRow key={`${variant.id || 'variant'}-${index}`} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{variant.resolvedPackName}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{variant.variant || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {variant.img ? (
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl border border-gray-100 bg-white p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={variant.img}
                            alt={variant.resolvedPackName}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] font-medium text-gray-400 text-center px-1">
                          No img
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{variant.resolvedProductName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">
                        {variant.stock || 0} stock
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {typeof variant.price === 'number'
                            ? `Rp ${Number(variant.price).toLocaleString('id-ID')}`
                            : '-'}
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {typeof variant.discounted_price === 'number'
                            ? `setelah diskon: Rp ${Number(variant.discounted_price).toLocaleString('id-ID')}`
                            : 'harga variant'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${Number(variant.discount || 0) > 0 ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-600'}`}>
                        {Number(variant.discount || 0) > 0 ? `${variant.discount}%` : 'no discount'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{variant.expiration || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{variant.img ? 'Available' : 'No image'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center justify-end gap-2 min-w-[220px]">
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => startEditing(variant)}>
                          <PencilLine className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => openImageFlow(variant)}>
                          <ImagePlus className="w-4 h-4 mr-1" /> Image
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl text-red-500" disabled>
                          <Trash2 className="w-4 h-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-5 sm:p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <h3 className="text-lg font-bold">QA structure yang harus dipegang</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-white mb-2">Frontend checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>admin login bisa buka halaman variants</li>
              <li>owner login bisa buka halaman variants</li>
              <li>form create variant hanya submit saat product dipilih</li>
              <li>create variant wajib mengirim harga variant</li>
              <li>edit detail variant hanya aktif jika variant dipilih</li>
              <li>upload image hanya aktif jika variant dipilih dan file tersedia</li>
              <li>button delete tetap nonaktif sampai flow aman dibuka</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Backend-aligned checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>GET /type/all</code> harus 200</li>
              <li><code>POST /type/create</code> harus 201 untuk token internal valid</li>
              <li><code>PUT /type/:type_id</code> harus 200 untuk update detail variant</li>
              <li><code>PUT /type/image/:type_id</code> harus sukses untuk file valid</li>
              <li>customer tidak boleh mengakses flow internal ini</li>
              <li>variant baru harus nyambung ke <code>product_id</code> yang valid</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
