import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, PlusCircle, Search, LayoutList, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getAdminSafeErrorMessage } from '@/lib/dashboard';

interface ArtikelItem {
  id: number;
  display_id?: number;
  title: string;
  img?: string | null;
  description_list?: string[];
}

interface ArtikelResponse {
  status_code: number;
  message: string;
  data: ArtikelItem[];
}

interface CreateArtikelPayload {
  title: string;
  description: string;
  img?: string;
}

const initialArtikelForm: CreateArtikelPayload = {
  title: '',
  description: '',
  img: '',
};

export default function ContentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [articleForm, setArtikelForm] = useState(initialArtikelForm);

  const { data: articlesResponse, isLoading: articlesLoading } = useQuery({
    queryKey: ['content-articles'],
    queryFn: async () => {
      const response = await api.get<ArtikelResponse>('/articles/all');
      return response.data;
    },
  });

  const createArtikelMutation = useMutation({
    mutationFn: async (payload: CreateArtikelPayload) => {
      const response = await api.post('/articles/create', payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || 'Artikel baru berhasil dibuat.');
      setArtikelForm(initialArtikelForm);
      queryClient.invalidateQueries({ queryKey: ['content-articles'] });
    },
    onError: (error: any) => {
      toast.error(getAdminSafeErrorMessage(error, 'Gagal membuat artikel baru.'));
    },
  });

  const articles = articlesResponse?.data ?? [];

  const filteredArtikel = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return articles;

    return articles.filter((article) => article.title.toLowerCase().includes(keyword));
  }, [articles, search]);

  const submitArtikel = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = articleForm.title.trim();
    const description = articleForm.description.trim();
    const img = articleForm.img?.trim() || '';

    if (!title || !description) {
      toast.error('Judul dan deskripsi artikel wajib diisi.');
      return;
    }

    createArtikelMutation.mutate({ title, description, img });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Konten</h1>
          <p className="text-gray-500 mt-1">Modul internal untuk memantau dan mengelola artikel. Kategori produk tetap dipisahkan ke flow katalog dan production.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl">Admin + Owner</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><FileText className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Artikel</p><p className="text-2xl font-bold text-gray-900 mt-1">{articles.length}</p><p className="text-[11px] text-gray-400 mt-2">Artikel yang sudah terdaftar</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><LayoutList className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Matrix</span></div><p className="text-sm font-medium text-gray-500 mt-4">Layer Artikel</p><p className="text-2xl font-bold text-gray-900 mt-1">Shared</p><p className="text-[11px] text-gray-400 mt-2">Admin dan owner sama-sama boleh kelola artikel</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><PencilLine className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ops</span></div><p className="text-sm font-medium text-gray-500 mt-4">Buat + Edit</p><p className="text-2xl font-bold text-gray-900 mt-1">Aktif</p><p className="text-[11px] text-gray-400 mt-2">POST /articles/create dan PUT /articles/update/:article_id</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[0.9fr_1.1fr] gap-6 xl:gap-8 items-start">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Buat artikel</h2>
              <p className="text-sm text-gray-500 mt-1">Tersambung ke endpoint backend <strong>POST /articles/create</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={submitArtikel} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="article-title">Judul artikel</Label>
                <Input id="article-title" value={articleForm.title} onChange={(e) => setArtikelForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Contoh: Manfaat Herbal untuk Harian" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-img">URL gambar (opsional)</Label>
                <Input id="article-img" value={articleForm.img || ''} onChange={(e) => setArtikelForm((prev) => ({ ...prev, img: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-description">Deskripsi</Label>
                <textarea id="article-description" value={articleForm.description} onChange={(e) => setArtikelForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Isi atau ringkasan artikel" className="min-h-[140px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full" required />
              </div>
              <Button type="submit" disabled={createArtikelMutation.isPending} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" />
                {createArtikelMutation.isPending ? 'Menyimpan...' : 'Simpan Artikel'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 border-emerald-100 overflow-hidden p-5 sm:p-8">
          <h3 className="text-lg font-bold text-emerald-900">Flow edit artikel sekarang</h3>
          <div className="mt-4 space-y-3 text-sm text-emerald-800">
            <p>CTA <strong>Edit</strong> sekarang langsung menuju halaman edit artikel khusus agar flow buat dan edit tidak bercampur.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Buka daftar artikel di overview</li>
              <li>Klik <strong>Edit</strong> pada row yang dipilih</li>
              <li>Masuk ke halaman edit artikel khusus</li>
              <li>Simpan perubahan lalu kembali ke halaman content</li>
            </ol>
            <p className="pt-2 text-[11px] font-semibold text-emerald-900">Pattern ini diselaraskan dengan flow edit user dan production agar UX dashboard lebih konsisten.</p>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">Artikel overview</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Pantau layer artikel untuk kebutuhan edukasi, informasi publik, dan materi konten storefront.</p>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari artikel..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
          </div>
        </CardHeader>
        <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
          {articlesLoading ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">Memuat artikel...</div>
          ) : filteredArtikel.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">Tidak ada artikel yang cocok.</div>
          ) : (
            <div className="space-y-3">
              {filteredArtikel.slice(0, 8).map((article, index) => (
                <div key={`${article.display_id || index}-${article.title}`} className="rounded-3xl bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ring-1 ring-gray-100">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">Artikel Konten</p>
                      <p className="break-words text-sm font-bold text-gray-900 sm:text-base">{article.title}</p>
                      <p className="text-[11px] font-medium text-gray-400">ID: {article.id} • Display ID: {article.display_id || '-'}</p>
                      <p className="line-clamp-3 text-xs leading-relaxed text-gray-500">{article.description_list?.[0] || '-'}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto] lg:min-w-[360px]">
                      <div className="rounded-2xl bg-gray-50 px-3 py-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Sumber gambar</p>
                        <p className="mt-1 break-all font-medium text-gray-700">{article.img || 'Belum ada gambar'}</p>
                      </div>
                      <div className="flex items-center">
                        <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => navigate(`/content/edit/${article.id}`)}>
                          <PencilLine className="w-4 h-4 mr-2" />
                          Edit Artikel Ini
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-5 sm:p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <h3 className="text-lg font-bold">QA structure untuk layer artikel</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-white mb-2">Frontend checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>admin dan owner bisa membuka halaman content</li>
              <li>list artikel tetap aman saat data kosong</li>
              <li>form buat artikel tidak submit saat field wajib kosong</li>
              <li>CTA edit langsung masuk ke halaman edit artikel</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Backend-aligned checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>GET /articles/all</code> harus 200</li>
              <li><code>POST /articles/create</code> harus 201 untuk token internal valid</li>
              <li><code>PUT /articles/update/:article_id</code> harus 200 untuk token internal valid</li>
              <li>customer tidak boleh mengakses flow internal manajemen artikel</li>
              <li>kategori produk diverifikasi di modul catalog/production, bukan di modul artikel</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
