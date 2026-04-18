import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, PlusCircle, Search, LayoutList, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ArticleItem {
  id: number;
  display_id?: number;
  title: string;
  img?: string | null;
  description_list?: string[];
}

interface ArticleResponse {
  status_code: number;
  message: string;
  data: ArticleItem[];
}

interface CreateArticlePayload {
  title: string;
  description: string;
  img?: string;
}

const initialArticleForm: CreateArticlePayload = {
  title: '',
  description: '',
  img: '',
};

export default function ContentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [articleForm, setArticleForm] = useState(initialArticleForm);

  const { data: articlesResponse, isLoading: articlesLoading } = useQuery({
    queryKey: ['content-articles'],
    queryFn: async () => {
      const response = await api.get<ArticleResponse>('/articles/all');
      return response.data;
    },
  });

  const createArticleMutation = useMutation({
    mutationFn: async (payload: CreateArticlePayload) => {
      const response = await api.post('/articles/create', payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || 'Artikel baru berhasil dibuat.');
      setArticleForm(initialArticleForm);
      queryClient.invalidateQueries({ queryKey: ['content-articles'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || 'Gagal membuat artikel baru.';
      toast.error(String(message));
    },
  });

  const articles = articlesResponse?.data ?? [];

  const filteredArticles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return articles;

    return articles.filter((article) => article.title.toLowerCase().includes(keyword));
  }, [articles, search]);

  const submitArticle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createArticleMutation.mutate(articleForm);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Management</h1>
          <p className="text-gray-500 mt-1">Shared internal module untuk memantau dan mengelola article layer. Category product dipisahkan ke flow katalog dan production.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl">Admin + Owner</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600"><FileText className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Articles</p><p className="text-2xl font-bold text-gray-900 mt-1">{articles.length}</p><p className="text-[11px] text-gray-400 mt-2">Artikel yang sudah terdaftar</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><LayoutList className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Matrix</span></div><p className="text-sm font-medium text-gray-500 mt-4">Article Layer</p><p className="text-2xl font-bold text-gray-900 mt-1">Shared</p><p className="text-[11px] text-gray-400 mt-2">Admin dan owner sama-sama boleh kelola article</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><PencilLine className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ops</span></div><p className="text-sm font-medium text-gray-500 mt-4">Create + Edit</p><p className="text-2xl font-bold text-gray-900 mt-1">Active</p><p className="text-[11px] text-gray-400 mt-2">POST /articles/create dan PUT /articles/update/:article_id</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-[0.9fr_1.1fr] gap-6 xl:gap-8 items-start">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create article</h2>
              <p className="text-sm text-gray-500 mt-1">Tersambung ke endpoint backend <strong>POST /articles/create</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
            <form onSubmit={submitArticle} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="article-title">Article title</Label>
                <Input id="article-title" value={articleForm.title} onChange={(e) => setArticleForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Contoh: Manfaat Herbal untuk Harian" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-img">Image URL (optional)</Label>
                <Input id="article-img" value={articleForm.img || ''} onChange={(e) => setArticleForm((prev) => ({ ...prev, img: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="article-description">Description</Label>
                <textarea id="article-description" value={articleForm.description} onChange={(e) => setArticleForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Isi atau ringkasan artikel" className="min-h-[140px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full" required />
              </div>
              <Button type="submit" disabled={createArticleMutation.isPending} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" />
                {createArticleMutation.isPending ? 'Submitting...' : 'Submit Article'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-emerald-50 border-emerald-100 overflow-hidden p-5 sm:p-8">
          <h3 className="text-lg font-bold text-emerald-900">Flow edit article sekarang</h3>
          <div className="mt-4 space-y-3 text-sm text-emerald-800">
            <p>CTA <strong>Edit</strong> sekarang langsung menuju halaman edit article khusus agar flow create dan edit tidak bercampur.</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Buka daftar article di overview</li>
              <li>Klik <strong>Edit</strong> pada row yang dipilih</li>
              <li>Masuk ke page edit article khusus</li>
              <li>Simpan perubahan lalu kembali ke halaman content</li>
            </ol>
            <p className="pt-2 text-[11px] font-semibold text-emerald-900">Pattern ini diselaraskan dengan flow edit user dan production agar UX dashboard lebih konsisten.</p>
          </div>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Articles overview</h2>
            <p className="text-sm text-gray-500 mt-1">Pantau article layer untuk kebutuhan edukasi, informasi publik, dan materi konten storefront.</p>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari article..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
          </div>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-6 sm:pb-8">
          <div className="overflow-x-auto">
          <Table className="min-w-[720px]">
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Article</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Summary</TableHead>
                <TableHead className="font-bold text-gray-400 text-[10px] uppercase text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articlesLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">Loading articles...</TableCell></TableRow>
              ) : filteredArticles.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-8">Tidak ada article yang cocok.</TableCell></TableRow>
              ) : (
                filteredArticles.slice(0, 8).map((article, index) => (
                  <TableRow key={`${article.display_id || index}-${article.title}`} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{article.title}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Display ID: {article.display_id || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{article.description_list?.[0] || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" className="rounded-xl" onClick={() => navigate(`/content/edit/${article.id}`)}>
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
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-5 sm:p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <h3 className="text-lg font-bold">QA structure untuk article layer</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-white mb-2">Frontend checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>admin dan owner bisa membuka halaman content</li>
              <li>list articles tetap aman saat data kosong</li>
              <li>form create article tidak submit saat field wajib kosong</li>
              <li>CTA edit langsung masuk ke halaman edit article</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Backend-aligned checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>GET /articles/all</code> harus 200</li>
              <li><code>POST /articles/create</code> harus 201 untuk token internal valid</li>
              <li><code>PUT /articles/update/:article_id</code> harus 200 untuk token internal valid</li>
              <li>customer tidak boleh mengakses flow internal article management</li>
              <li>category product diverifikasi di module catalog/production, bukan di article module</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
