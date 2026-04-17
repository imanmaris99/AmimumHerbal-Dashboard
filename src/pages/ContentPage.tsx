import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, FolderTree, PlusCircle, Search, LayoutList, PenSquare } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ArticleItem {
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

interface CategoryItem {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
}

interface CategoryResponse {
  status_code: number;
  message: string;
  data: CategoryItem[];
}

interface CreateCategoryPayload {
  name: string;
  description: string;
}

interface CreateArticlePayload {
  title: string;
  description: string;
  img?: string;
}

const initialCategoryForm: CreateCategoryPayload = {
  name: '',
  description: '',
};

const initialArticleForm: CreateArticlePayload = {
  title: '',
  description: '',
  img: '',
};

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [articleForm, setArticleForm] = useState(initialArticleForm);

  const { data: articlesResponse, isLoading: articlesLoading } = useQuery({
    queryKey: ['content-articles'],
    queryFn: async () => {
      const response = await api.get<ArticleResponse>('/articles/all');
      return response.data;
    },
  });

  const { data: categoriesResponse, isLoading: categoriesLoading } = useQuery({
    queryKey: ['content-categories'],
    queryFn: async () => {
      const response = await api.get<CategoryResponse>('/categories/all');
      return response.data;
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const response = await api.post('/categories/post', payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || 'Kategori baru berhasil dibuat.');
      setCategoryForm(initialCategoryForm);
      queryClient.invalidateQueries({ queryKey: ['content-categories'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || 'Gagal membuat kategori baru.';
      toast.error(String(message));
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
  const categories = categoriesResponse?.data ?? [];

  const filteredArticles = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return articles;

    return articles.filter((article) => article.title.toLowerCase().includes(keyword));
  }, [articles, search]);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categories;

    return categories.filter((category) => category.name.toLowerCase().includes(keyword));
  }, [categories, search]);

  const submitCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createCategoryMutation.mutate(categoryForm);
  };

  const submitArticle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createArticleMutation.mutate(articleForm);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Management</h1>
          <p className="text-gray-500 mt-1">Shared internal module untuk memantau artikel dan kategori, serta mulai mengelola struktur konten internal.</p>
        </div>
        <Badge className="bg-orange-50 text-orange-600 border-none px-3 py-2 rounded-xl">Admin + Owner</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-orange-50 text-orange-600"><FileText className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Articles</p><p className="text-2xl font-bold text-gray-900 mt-1">{articles.length}</p><p className="text-[11px] text-gray-400 mt-2">Artikel yang sudah terdaftar</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-blue-50 text-blue-600"><FolderTree className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Live</span></div><p className="text-sm font-medium text-gray-500 mt-4">Categories</p><p className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</p><p className="text-[11px] text-gray-400 mt-2">Kategori konten dan brand yang tersedia</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-green-50 text-green-600"><LayoutList className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Matrix</span></div><p className="text-sm font-medium text-gray-500 mt-4">Content Layer</p><p className="text-2xl font-bold text-gray-900 mt-1">Shared</p><p className="text-[11px] text-gray-400 mt-2">Admin dan owner sama-sama boleh monitor</p></CardContent></Card>
        <Card className="border-none shadow-sm rounded-3xl"><CardContent className="p-6"><div className="flex items-center justify-between"><div className="p-3 rounded-2xl bg-violet-50 text-violet-600"><PenSquare className="w-5 h-5" /></div><span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Create</span></div><p className="text-sm font-medium text-gray-500 mt-4">Article + Category</p><p className="text-2xl font-bold text-gray-900 mt-1">Active</p><p className="text-[11px] text-gray-400 mt-2">POST /articles/create dan /categories/post sudah tersambung</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create article</h2>
              <p className="text-sm text-gray-500 mt-1">Tersambung ke endpoint backend <strong>POST /articles/create</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
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
              <Button type="submit" disabled={createArticleMutation.isPending} className="rounded-xl bg-orange-500 hover:bg-orange-600">
                <PlusCircle className="w-4 h-4 mr-2" />
                {createArticleMutation.isPending ? 'Submitting...' : 'Submit Article'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="px-8 pt-8 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create content category</h2>
              <p className="text-sm text-gray-500 mt-1">Tersambung ke endpoint backend <strong>POST /categories/post</strong>.</p>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={submitCategory} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category name</Label>
                <Input id="category-name" value={categoryForm.name} onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Contoh: Herbal Edukasi" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">Description</Label>
                <textarea id="category-description" value={categoryForm.description} onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Deskripsi kategori konten" className="min-h-[140px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full" required />
              </div>
              <Button type="submit" disabled={createCategoryMutation.isPending} className="rounded-xl bg-orange-500 hover:bg-orange-600">
                <PlusCircle className="w-4 h-4 mr-2" />
                {createCategoryMutation.isPending ? 'Submitting...' : 'Submit Category'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="px-8 pt-8 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Articles and categories overview</h2>
            <p className="text-sm text-gray-500 mt-1">Pantau isi layer content/public info agar admin dan owner mudah koordinasi.</p>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari article atau category..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-8 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-4 mb-2">Articles</h3>
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                  <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Article</TableHead>
                  <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articlesLoading ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-gray-400 py-8">Loading articles...</TableCell></TableRow>
                ) : filteredArticles.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-gray-400 py-8">Tidak ada article yang cocok.</TableCell></TableRow>
                ) : (
                  filteredArticles.slice(0, 6).map((article, index) => (
                    <TableRow key={`${article.display_id || index}-${article.title}`} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{article.title}</p>
                          <p className="text-[10px] text-gray-400 font-medium">Display ID: {article.display_id || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{article.description_list?.[0] || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 px-4 mb-2">Categories</h3>
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-gray-50 uppercase tracking-wider">
                  <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Category</TableHead>
                  <TableHead className="font-bold text-gray-400 text-[10px] uppercase">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoriesLoading ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-gray-400 py-8">Loading categories...</TableCell></TableRow>
                ) : filteredCategories.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-center text-gray-400 py-8">Tidak ada category yang cocok.</TableCell></TableRow>
                ) : (
                  filteredCategories.slice(0, 6).map((category) => (
                    <TableRow key={category.id} className="group hover:bg-gray-50/50 transition-colors border-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{category.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium">ID: {category.id}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{category.description || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-gray-900 text-white overflow-hidden p-8 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <h3 className="text-lg font-bold">QA structure untuk content layer</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
          <div>
            <p className="font-semibold text-white mb-2">Frontend checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>admin dan owner bisa membuka halaman content</li>
              <li>list articles dan categories tetap aman saat data kosong</li>
              <li>form create article dan create category tidak submit saat field wajib kosong</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-2">Backend-aligned checks</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code>GET /articles/all</code> harus 200</li>
              <li><code>GET /categories/all</code> harus 200</li>
              <li><code>POST /articles/create</code> harus 201 untuk token internal valid</li>
              <li><code>POST /categories/post</code> harus 201 untuk token internal valid</li>
              <li>customer tidak boleh mengakses flow internal content management</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
