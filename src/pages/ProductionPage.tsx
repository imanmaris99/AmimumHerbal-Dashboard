import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Factory, PlusCircle, Search, Tags, LayoutGrid, PencilLine } from 'lucide-react';
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

const initialCreateForm: CreateProductionPayload = {
  name: '',
  herbal_category_id: 0,
  description: '',
};

export default function ProductionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createForm, setCreateForm] = useState(initialCreateForm);

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
      setCreateForm(initialCreateForm);
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

    if (!createForm.herbal_category_id) {
      toast.error('Pilih product category terlebih dahulu.');
      return;
    }

    createProductionMutation.mutate(createForm);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Production / Brand Management</h1>
          <p className="text-gray-500 mt-1">Shared internal module untuk mengelola brand/production yang menjadi sumber relasi katalog product. Category pada flow ini adalah category product layer, bukan category article.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl">Admin + Owner</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><Factory className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Productions</p><p className="text-2xl font-bold text-gray-900 mt-1">{productions.length}</p><p className="text-[11px] text-gray-400 mt-2">Brand/production yang sudah terdaftar</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><Tags className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Relation</span></div><p className="text-sm font-medium text-gray-500 mt-4">Categories</p><p className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</p><p className="text-[11px] text-gray-400 mt-2">Target herbal_category_id untuk production</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><LayoutGrid className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Matrix</span></div><p className="text-sm font-medium text-gray-500 mt-4">Production Layer</p><p className="text-2xl font-bold text-gray-900 mt-1">Shared</p><p className="text-[11px] text-gray-400 mt-2">Admin dan owner sama-sama boleh kelola</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><PencilLine className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ops</span></div><p className="text-sm font-medium text-gray-500 mt-4">Create + Edit</p><p className="text-2xl font-bold text-gray-900 mt-1">Active</p><p className="text-[11px] text-gray-400 mt-2">POST /brand/create dan PUT /brand/:production_id</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[0.9fr_1.1fr] gap-6 xl:gap-8 items-start">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create brand / production</h2>
              <p className="text-sm text-gray-500 mt-1">Tersambung ke endpoint backend <strong>POST /brand/create</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={submitProduction} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="production-name">Production name</Label>
                <Input id="production-name" value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Contoh: Herbal Amimum Factory" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="production-category">Product category</Label>
                <select id="production-category" value={createForm.herbal_category_id || ''} onChange={(e) => setCreateForm((prev) => ({ ...prev, herbal_category_id: Number(e.target.value) }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none w-full" required>
                  <option value="">Pilih product category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="production-description">Description</Label>
                <textarea id="production-description" value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Deskripsi singkat brand/production" className="min-h-[120px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full" required />
              </div>
              <Button type="submit" disabled={createProductionMutation.isPending} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" />
                {createProductionMutation.isPending ? 'Submitting...' : 'Submit Production'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 border-emerald-100 overflow-hidden p-5 sm:p-8">
          <h3 className="text-lg font-bold text-emerald-900">Flow edit production sekarang</h3>
          <div className="mt-4 space-y-3 text-sm text-emerald-800">
            <p>CTA <strong>Edit</strong> sekarang langsung menuju halaman edit khusus agar flow create dan edit tidak bercampur.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Buka daftar production di overview</li>
              <li>Klik <strong>Edit</strong> pada row yang dipilih</li>
              <li>Masuk ke page edit production khusus</li>
              <li>Simpan perubahan lalu kembali ke halaman production</li>
            </ol>
            <p className="pt-2 text-[11px] font-semibold text-emerald-900">Pattern ini diselaraskan dengan flow edit user agar UX dashboard lebih konsisten.</p>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Production overview</h2>
            <p className="text-sm text-gray-500 mt-1">Pantau brand/production yang akan dipakai sebagai source relasi product.</p>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari production atau category..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-6 sm:pb-8">
          <div className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Production</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Preview</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Category</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Description</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionsLoading || categoriesLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Loading production data...</TableCell></TableRow>
              ) : filteredProductions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Tidak ada production yang cocok.</TableCell></TableRow>
              ) : (
                filteredProductions.map((production) => (
                  <TableRow key={production.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{production.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">ID: {production.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {production.photo_url ? (
                        <div className="h-12 w-12 md:h-14 md:w-14 rounded-xl border border-gray-100 bg-white p-1 flex items-center justify-center overflow-hidden">
                          <img
                            src={production.photo_url}
                            alt={production.name}
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
                    <TableCell className="text-sm text-gray-600">{production.category || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600">{production.description_list?.[0] || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/productions/edit/${production.id}`)}>
                        <PencilLine className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
          <div className="px-4 pt-4 text-xs text-gray-500">
            Category list diambil dari <code>tag_categories</code> dan dipakai untuk relasi product/production layer.
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-5 sm:p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <h3 className="text-lg font-bold">QA structure untuk production layer</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-white mb-2">Frontend checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>admin dan owner bisa membuka halaman production</li>
              <li>form create production tidak submit saat product category belum dipilih</li>
              <li>CTA edit langsung masuk ke halaman edit production</li>
              <li>list production aman saat data kosong</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Backend-aligned checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>GET /brand/all</code> harus 200</li>
              <li><code>POST /brand/create</code> harus 201 untuk token internal valid</li>
              <li><code>PUT /brand/:production_id</code> harus 200 untuk token internal valid</li>
              <li><code>POST /brand/create</code> harus memakai <code>herbal_category_id</code> valid dari <code>tag_categories</code></li>
              <li>customer tidak boleh mengakses flow internal production management</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
