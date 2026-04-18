import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FileText, Loader2, PencilLine, Save } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { extractApiErrorMessage } from '@/lib/error';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface UpdateArticlePayload {
  title?: string;
  description?: string;
}

export default function ContentEditPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { articleId } = useParams<{ articleId: string }>();

  const [form, setForm] = useState<UpdateArticlePayload>({
    title: '',
    description: '',
  });

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  const articleDetailQuery = useQuery({
    queryKey: ['content-edit-detail', articleId],
    queryFn: async () => {
      const response = await api.get<ArticleResponse>('/articles/all');
      const articles = response.data.data ?? [];
      const target = articles.find((article) => String(article.id) === articleId);
      if (!target) {
        throw new Error('Article tidak ditemukan.');
      }
      return target;
    },
    enabled: !!articleId,
  });

  useEffect(() => {
    if (!articleDetailQuery.data) return;
    setForm({
      title: articleDetailQuery.data.title,
      description: articleDetailQuery.data.description_list?.join('\n') || '',
    });
  }, [articleDetailQuery.data]);

  const updateArticleMutation = useMutation({
    mutationFn: async (payload: UpdateArticlePayload) => {
      const response = await api.put(`/articles/update/${articleId}`, payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || 'Artikel berhasil diperbarui.');
      queryClient.invalidateQueries({ queryKey: ['content-articles'] });
      queryClient.invalidateQueries({ queryKey: ['content-edit-detail', articleId] });
      navigate('/content');
    },
    onError: (error: any) => {
      toast.error(extractApiErrorMessage(error, 'Gagal memperbarui artikel.'));
    },
  });

  const summaryDescription = useMemo(() => articleDetailQuery.data?.description_list?.[0] || '-', [articleDetailQuery.data]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title?.trim() || '';
    const description = form.description?.trim() || '';

    if (!title || !description) {
      toast.error('Judul article dan description wajib diisi.');
      return;
    }

    updateArticleMutation.mutate({
      title,
      description,
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button type="button" variant="outline" className="rounded-xl border-gray-200" onClick={() => navigate('/content')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Content
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Article</h1>
          <p className="text-gray-500 mt-1">CTA edit sekarang langsung menuju halaman edit article khusus agar flow content lebih fokus dan tidak tercampur dengan create form.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl w-fit">Admin + Owner edit page</Badge>
      </div>

      {articleDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Memuat detail article...
          </CardContent>
        </Card>
      ) : articleDetailQuery.isError || !articleDetailQuery.data ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            Gagal memuat data article. Silakan kembali ke halaman content dan coba lagi.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-[0.8fr_1.2fr] gap-6 xl:gap-8 items-start">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-none">Article layer</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">{articleDetailQuery.data.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Article ID: {articleDetailQuery.data.id} • Display ID: {articleDetailQuery.data.display_id || '-'}</p>
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-start justify-between gap-3">
                  <span>Ringkasan</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{summaryDescription}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Image source</span>
                  <strong className="text-slate-900 text-right break-all max-w-[220px]">{articleDetailQuery.data.img || '-'}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
                Halaman ini fokus untuk edit article. Flow category product tetap berada di modul catalog dan production, tidak dicampur ke article layer.
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Form edit article</h2>
                <p className="text-sm text-gray-500 mt-1">Terhubung ke endpoint <strong>PUT /articles/update/{'{article_id}'}</strong>.</p>
              </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="edit-article-title-page">Article title</Label>
                  <Input
                    id="edit-article-title-page"
                    value={form.title || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Judul article yang diperbarui"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-article-description-page">Description</Label>
                  <textarea
                    id="edit-article-description-page"
                    value={form.description || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Deskripsi article yang diperbarui"
                    className="min-h-[180px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-gray-500">Setelah update berhasil, halaman akan kembali ke daftar article.</p>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                    <Button type="button" variant="ghost" className="rounded-xl w-full sm:w-auto" onClick={() => navigate('/content')}>
                      Batal
                    </Button>
                    <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 w-full sm:w-auto" disabled={updateArticleMutation.isPending}>
                      {updateArticleMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                      ) : (
                        <><Save className="w-4 h-4 mr-2" />Update Article</>
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
