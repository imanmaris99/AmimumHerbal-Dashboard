import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Factory, PlusCircle, Search, Tags, LayoutGrid } from 'lucide-react';
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

interface CategoryItem {
  id: number;
  name: string;
  description_list?: string[];
  created_at: string;
}

interface CategoryResponse {
  status_code: number;
  message: string;
  data: CategoryItem[];
}

interface CreateProductionPayload {
  name: string;
  herbal_category_id: number;
  description: string;
}

const initialForm: CreateProductionPayload = {
  name: '',
  herbal_category_id: 0,
  description: '',
};

export default function ProductionPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);

  const { data: productionsResponse, isLoading: productionsLoading } = useQuery({
    queryKey: ['production-list'],
    queryFn: async () => {
      const response = await api.get<ProductionResponse>('/brand/all');
      return response.data;
    },
  });

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['production-categories'],
    queryFn: async () => {
      const response = await api.get<CategoryResponse>('/categories/all');
      return response.data;
    },
  });

  const createProductionMutation = useMutation({
    mutationFn: async (payload: CreateProductionPayload) => {
      const response = await api.post('/brand/create', payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || 'Brand / production baru berhasil dibuat.');
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['production-list'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-productions'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || 'Gagal membuat brand / production baru.';
      toast.error(String(message));
    },
  });

  const productions = productionsResponse?.data ?? [];
  const categories = categoriesResponse?.data ?? [];

  const filteredProductions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return productions;

    return productions.filter((production) => {
      return (
        production.name.toLowerCase().includes(keyword) ||
        (production.category || '').toLowerCase().includes(keyword)
      );
    });
  }, [productions, search]);

  const submitProduction = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.herbal_category_id) {
      toast.error('Pilih category terlebih dahulu.');
      return;
    }

    createProductionMutation.mutate(form);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Production / Brand Management</h1>
          <p className="text-gray-500 mt-1">Shared internal module untuk mengelola brand/production yang menjadi sumber relasi katalog product. Category pada flow ini adalah category product layer, bukan category article.</p>
        </div>
        <Badge className="bg-orange-50 text-orange-600 border-none px-3 py-2 rounded-xl">Admin + Owner</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-orange-50 text-orange-600"><Factory className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Productions</p><p className="text-2xl font-bold text-gray-900 mt-1">{productions.length}</p><p className="text-[11px] text-gray-400 mt-2">Brand/production yang sudah terdaftar</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Tags className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Relation</span></div><p className="text-sm font-medium text-gray-500 mt-4">Categories</p><p className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</p><p className="text-[11px] text-gray-400 mt-2">Target herbal_category_id untuk production</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><LayoutGrid className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Matrix</span></div><p className="text-sm font-medium text-gray-500 mt-4">Production Layer</p><p className="text-2xl font-bold text-gray-900 mt-1">Shared</p><p className="text-[11px] text-gray-400 mt-2">Admin dan owner sama-sama boleh kelola</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><PlusCircle className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Create</span></div><p className="text-sm font-medium text-gray-500 mt-4">Create Action</p><p className="text-2xl font-bold text-gray-900 mt-1">Active</p><p className="text-[11px] text-gray-400 mt-2">POST /brand/create sudah tersambung</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create brand / production</h2>
              <p className="text-sm text-gray-500 mt-1">Tersambung ke endpoint backend <strong>POST /brand/create</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={submitProduction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="production-name">Production name</Label>
                <Input id="production-name" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Contoh: Herbal Amimum Factory" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="production-category">Product category</Label>
                <select id="production-category" value={form.herbal_category_id || ''} onChange={(e) => setForm((prev) => ({ ...prev, herbal_category_id: Number(e.target.value) }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none w-full" required>
                  <option value="">Pilih product category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="production-description">Description</Label>
                <textarea id="production-description" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Deskripsi singkat brand/production" className="min-h-[120px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full" required />
              </div>
              <Button type="submit" disabled={createProductionMutation.isPending} className="rounded-xl bg-orange-500 hover:bg-orange-600">
                <PlusCircle className="w-4 h-4 mr-2" />
                {createProductionMutation.isPending ? 'Submitting...' : 'Submit Production'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Production overview</h2>
              <p className="text-sm text-gray-500 mt-1">Pantau brand/production yang akan dipakai sebagai source relasi product.</p>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari production atau category..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-8">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                  <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Production</TableHead>
                  <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Category</TableHead>
                  <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productionsLoading || categoriesLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">Loading production data...</TableCell></TableRow>
                ) : filteredProductions.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">Tidak ada production yang cocok.</TableCell></TableRow>
                ) : (
                  filteredProductions.slice(0, 8).map((production) => (
                    <TableRow key={production.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{production.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">ID: {production.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{production.category || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{production.description_list?.[0] || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="px-4 pt-4 text-xs text-gray-500">
              Category list diambil dari <code>tag_categories</code> dan dipakai untuk relasi product/production layer.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <h3 className="text-lg font-bold">QA structure untuk production layer</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-white mb-2">Frontend checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>admin dan owner bisa membuka halaman production</li>
              <li>form create production tidak submit saat product category belum dipilih</li>
              <li>list production aman saat data kosong</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Backend-aligned checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>GET /brand/all</code> harus 200</li>
              <li><code>POST /brand/create</code> harus 201 untuk token internal valid</li>
              <li><code>POST /brand/create</code> harus memakai <code>herbal_category_id</code> valid dari <code>tag_categories</code></li>
              <li>customer tidak boleh mengakses flow internal production management</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
