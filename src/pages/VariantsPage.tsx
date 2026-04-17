import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Boxes, PackagePlus, Layers3, Search, Archive, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getStatusStyle } from '@/lib/dashboard';

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
  name?: string;
  img?: string | null;
  variant?: string | null;
  expiration?: string | null;
  stock?: number;
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
}

const initialForm: CreateVariantPayload = {
  product_id: '',
  name: '',
  min_amount: 1,
  variant: '',
  expiration: '',
  stock: 0,
};

export default function VariantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CreateVariantPayload>(initialForm);

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
      toast.success(response?.message || 'Variant baru berhasil dibuat.');
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['all-pack-types'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
      queryClient.invalidateQueries({ queryKey: ['variant-products'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || 'Gagal membuat variant baru.';
      toast.error(String(message));
    },
  });

  const products = productsResponse?.data ?? [];
  const variants = variantsResponse?.data ?? [];

  const filteredVariants = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return variants;

    return variants.filter((variant) => {
      return (
        (variant.name || '').toLowerCase().includes(keyword) ||
        (variant.product || '').toLowerCase().includes(keyword) ||
        (variant.variant || '').toLowerCase().includes(keyword)
      );
    });
  }, [variants, search]);

  const totalStock = filteredVariants.reduce((sum, variant) => sum + Number(variant.stock || 0), 0);
  const discountedVariants = filteredVariants.filter((variant) => Number(variant.discount || 0) > 0).length;

  const handleChange = (field: keyof CreateVariantPayload, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'min_amount' || field === 'stock' ? Number(value) : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.product_id) {
      toast.error('Pilih product terlebih dahulu.');
      return;
    }

    createVariantMutation.mutate(form);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Variant / Pack Type Management</h1>
          <p className="text-gray-500 mt-1">Shared internal module untuk admin dan owner mengelola variant setelah product dibuat, sesuai relasi tabel <strong>pack_types</strong> ke <strong>products</strong>.</p>
        </div>
        <Badge className="bg-orange-50 text-orange-600 border-none px-3 py-2 rounded-xl">Admin + Owner</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-orange-50 text-orange-600"><Boxes className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Visible Variants</p><p className="text-2xl font-bold text-gray-900 mt-1">{filteredVariants.length}</p><p className="text-[11px] text-gray-400 mt-2">Variant yang sedang terpantau</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Layers3 className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Relation</span></div><p className="text-sm font-medium text-gray-500 mt-4">Products Ready</p><p className="text-2xl font-bold text-gray-900 mt-1">{products.length}</p><p className="text-[11px] text-gray-400 mt-2">Target foreign key untuk product_id</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><Archive className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Stock</span></div><p className="text-sm font-medium text-gray-500 mt-4">Visible Stock</p><p className="text-2xl font-bold text-gray-900 mt-1">{totalStock}</p><p className="text-[11px] text-gray-400 mt-2">Akumulasi stock variant yang sedang terlihat</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><ShieldCheck className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">QA</span></div><p className="text-sm font-medium text-gray-500 mt-4">Discounted Variants</p><p className="text-2xl font-bold text-gray-900 mt-1">{discountedVariants}</p><p className="text-[11px] text-gray-400 mt-2">Monitoring cepat variant dengan promo</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Variant submit form</h2>
              <p className="text-sm text-gray-500 mt-1">Nyambung ke tabel <strong>pack_types</strong> dengan foreign key <strong>product_id</strong> ke tabel <strong>products</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="product_id">Product</Label>
                  <select id="product_id" value={form.product_id} onChange={(e) => handleChange('product_id', e.target.value)} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none w-full" required>
                    <option value="">Pilih product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}{product.brand_info?.name ? ` - ${product.brand_info.name}` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Pack type name</Label>
                  <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Botol / Sachet / Box" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="variant">Variant</Label>
                  <Input id="variant" value={form.variant} onChange={(e) => handleChange('variant', e.target.value)} placeholder="Original / Mint / Jahe" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_amount">Minimum amount</Label>
                  <Input id="min_amount" type="number" min="1" value={form.min_amount || ''} onChange={(e) => handleChange('min_amount', e.target.value)} placeholder="1" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" min="0" value={form.stock || ''} onChange={(e) => handleChange('stock', e.target.value)} placeholder="100" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">Expiration</Label>
                <Input id="expiration" value={form.expiration} onChange={(e) => handleChange('expiration', e.target.value)} placeholder="12/25/2026 atau format yang dipakai backend" required />
              </div>

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-gray-500 leading-relaxed">Sesuai struktur backend saat ini, create variant memakai endpoint <strong>POST /type/create</strong>. Untuk update stock/discount dan image akan menyusul pada batch lanjutan.</p>
                <Button type="submit" disabled={createVariantMutation.isPending} className="rounded-xl bg-orange-500 hover:bg-orange-600">
                  <PackagePlus className="w-4 h-4 mr-2" />
                  {createVariantMutation.isPending ? 'Submitting...' : 'Submit Variant Baru'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-3xl bg-orange-50 border-orange-100 overflow-hidden p-8">
            <h3 className="text-lg font-bold text-orange-900">Endpoint matrix alignment</h3>
            <div className="mt-4 space-y-3 text-sm text-orange-800">
              <p><strong>Shared internal</strong>: admin dan owner boleh mengakses area ini, karena backend memakai <code>admin_access_required</code>.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><code>GET /type/all</code> untuk monitoring variant</li>
                <li><code>POST /type/create</code> untuk submit variant baru</li>
                <li><code>PUT /type/:type_id</code> untuk update stock/discount, batch berikutnya</li>
                <li><code>PUT /type/image/:type_id</code> untuk upload image, batch berikutnya</li>
                <li><code>DELETE /type/delete/:type_id</code> untuk delete variant, akan diperlakukan hati-hati</li>
              </ul>
              <p>Flow relasi DB yang dipakai: <strong>products.id to pack_types.product_id</strong></p>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Existing variants</h2>
                <p className="text-sm text-gray-500 mt-1">Pantau struktur variant yang sudah ada sebelum menambah pack type baru.</p>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari product, nama variant, atau pack type..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-8">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                    <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Pack</TableHead>
                    <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Product</TableHead>
                    <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Stock</TableHead>
                    <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Discount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variantsLoading || productsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-8">Loading variant data...</TableCell></TableRow>
                  ) : filteredVariants.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-8">Belum ada variant yang cocok dengan filter.</TableCell></TableRow>
                  ) : (
                    filteredVariants.slice(0, 10).map((variant, index) => (
                      <TableRow key={`${variant.id || 'variant'}-${index}`} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{variant.name || '-'}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{variant.variant || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{variant.product || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">
                            {variant.stock || 0} stock
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase ${Number(variant.discount || 0) > 0 ? 'bg-violet-50 text-violet-600' : 'bg-slate-100 text-slate-600'}`}>
                            {Number(variant.discount || 0) > 0 ? `${variant.discount}%` : 'no discount'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <h3 className="text-lg font-bold">QA structure yang harus dipegang</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-white mb-2">Frontend checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>admin login bisa buka halaman variants</li>
              <li>owner login bisa buka halaman variants</li>
              <li>form create variant hanya submit saat product dipilih</li>
              <li>list variant tampil tanpa crash saat data kosong</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Backend-aligned checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>GET /type/all</code> harus 200</li>
              <li><code>POST /type/create</code> harus 201 untuk token internal valid</li>
              <li>customer tidak boleh mengakses flow internal ini</li>
              <li>variant baru harus nyambung ke <code>product_id</code> yang valid</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
