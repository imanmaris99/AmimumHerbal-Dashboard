import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Box, PlusCircle, Search, Layers3, PackagePlus, Boxes } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

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
    discount?: number | null;
  }>;
}

interface ProductResponse {
  status_code: number;
  message: string;
  data: ProductItem[];
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<CreateProductPayload>(initialForm);

  const { data: productionsResponse, isLoading: productionsLoading } = useQuery({
    queryKey: ['catalog-productions'],
    queryFn: async () => {
      const response = await api.get<ProductionResponse>('/brand/all');
      return response.data;
    },
  });

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['catalog-products'],
    queryFn: async () => {
      const response = await api.get<ProductResponse>('/product/all');
      return response.data;
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload: CreateProductPayload) => {
      const response = await api.post<CreateProductResponse>('/product/create', payload);
      return response.data;
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Produk baru berhasil dibuat.');
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || 'Gagal membuat produk baru.';
      toast.error(String(message));
    },
  });

  const productions = productionsResponse?.data ?? [];
  const products = productsResponse?.data ?? [];

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((product) => {
      const productionName = product.brand_info?.name?.toLowerCase() || '';
      return (
        product.name.toLowerCase().includes(keyword) ||
        productionName.includes(keyword) ||
        product.id.toLowerCase().includes(keyword)
      );
    });
  }, [products, search]);

  const totalVariants = filteredProducts.reduce((sum, product) => sum + (product.all_variants?.length || 0), 0);

  const handleChange = (field: keyof CreateProductPayload, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: field === 'weight' || field === 'price' || field === 'product_by_id' ? Number(value) : value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.product_by_id) {
      toast.error('Pilih brand/production terlebih dahulu.');
      return;
    }

    createProductMutation.mutate(form);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Catalog Management</h1>
          <p className="text-gray-500 mt-1">Shared internal module untuk admin dan owner mengelola submit product baru berdasarkan relasi database yang sudah ditetapkan.</p>
        </div>
        <Badge className="bg-orange-50 text-orange-600 border-none px-3 py-2 rounded-xl">Admin + Owner</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-orange-50 text-orange-600"><Box className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Visible Products</p><p className="text-2xl font-bold text-gray-900 mt-1">{filteredProducts.length}</p><p className="text-[11px] text-gray-400 mt-2">Produk yang sedang terpantau</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Layers3 className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">DB</span></div><p className="text-sm font-medium text-gray-500 mt-4">Brand / Productions</p><p className="text-2xl font-bold text-gray-900 mt-1">{productions.length}</p><p className="text-[11px] text-gray-400 mt-2">Source relasi untuk product_by_id</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><Boxes className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Flow</span></div><p className="text-sm font-medium text-gray-500 mt-4">Variant Slots</p><p className="text-2xl font-bold text-gray-900 mt-1">{totalVariants}</p><p className="text-[11px] text-gray-400 mt-2">Pack type mengikuti produk setelah submit</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><PackagePlus className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Matrix</span></div><p className="text-sm font-medium text-gray-500 mt-4">Submit Product</p><p className="text-2xl font-bold text-gray-900 mt-1">Enabled</p><p className="text-[11px] text-gray-400 mt-2">Shared internal, write action terkontrol</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Product submit form</h2>
              <p className="text-sm text-gray-500 mt-1">Nyambung ke tabel <strong>products</strong>, dengan foreign key <strong>product_by_id</strong> ke tabel <strong>productions</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama produk</Label>
                  <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Contoh: Madu Herbal Amimum" required />
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
                  <Label htmlFor="price">Harga dasar</Label>
                  <Input id="price" type="number" min="0" value={form.price || ''} onChange={(e) => handleChange('price', e.target.value)} placeholder="50000" required />
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

              <div className="flex items-center justify-between gap-4 pt-2">
                <p className="text-xs text-gray-500 leading-relaxed">Setelah product dibuat, tahap berikutnya secara database adalah melengkapi <strong>pack_types</strong> sebagai variant/kemasan yang terhubung ke <strong>products.id</strong>.</p>
                <Button type="submit" disabled={createProductMutation.isPending} className="rounded-xl bg-orange-500 hover:bg-orange-600">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {createProductMutation.isPending ? 'Submitting...' : 'Submit Product Baru'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card className="border-none shadow-sm rounded-3xl bg-orange-50 border-orange-100 overflow-hidden p-8">
            <h3 className="text-lg font-bold text-orange-900">Matrix submit product</h3>
            <div className="mt-4 space-y-3 text-sm text-orange-800">
              <p><strong>Admin</strong> dan <strong>owner</strong> boleh submit product baru karena endpoint backend memakai <code>admin_access_required</code>.</p>
              <p><strong>Owner</strong> tetap memegang pengawasan strategis, tetapi operasional submit product boleh dibantu admin.</p>
              <p><strong>Category</strong> pada flow ini adalah <code>tag_categories</code> yang terhubung ke production/product layer, bukan kategori article/content.</p>
              <p>Flow database yang dipakai di form ini:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Pilih <strong>production / brand</strong> dari tabel <code>productions</code></li>
                <li>Buat baris baru di tabel <code>products</code> dengan <code>product_by_id</code></li>
                <li>Lanjutkan setup varian di tabel <code>pack_types</code> untuk kemasan/stok/discount</li>
              </ol>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-8 pt-8 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Existing products</h2>
                  <p className="text-sm text-gray-500 mt-1">Pantau produk yang sudah ada sebelum menambah item baru.</p>
                </div>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama produk, production, atau id..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-8">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                    <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Product</TableHead>
                    <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Production</TableHead>
                    <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Price</TableHead>
                    <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Variants</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsLoading || productionsLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-8">Loading catalog data...</TableCell></TableRow>
                  ) : filteredProducts.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-gray-400 py-8">Belum ada product yang cocok dengan filter.</TableCell></TableRow>
                  ) : (
                    filteredProducts.slice(0, 8).map((product) => (
                      <TableRow key={product.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">{product.id}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{product.brand_info?.name || '-'}</TableCell>
                        <TableCell className="font-bold text-gray-900">Rp {Number(product.price || 0).toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] py-0.5 rounded-lg px-2 uppercase">
                            {product.all_variants?.length || 0} variants
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
    </div>
  );
}
