import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Factory, Loader2, PencilLine, Save, Tags } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

interface UpdateProductionPayload {
  name?: string;
  description?: string;
}

export default function ProductionEditPage() {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { productionId } = useParams<{ productionId: string }>();

  const [form, setForm] = useState<UpdateProductionPayload>({
    name: '',
    description: '',
  });

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  const productionDetailQuery = useQuery({
    queryKey: ['production-edit-detail', productionId],
    queryFn: async () => {
      const response = await api.get<ProductionResponse>('/brand/all');
      const productions = response.data.data ?? [];
      const target = productions.find((production) => String(production.id) === productionId);
      if (!target) {
        throw new Error(t('productionEditPage.notFound'));
      }
      return target;
    },
    enabled: !!productionId,
  });

  useEffect(() => {
    if (!productionDetailQuery.data) return;
    setForm({
      name: productionDetailQuery.data.name,
      description: productionDetailQuery.data.description_list?.join('\n') || '',
    });
  }, [productionDetailQuery.data]);

  const updateProductionMutation = useMutation({
    mutationFn: async (payload: UpdateProductionPayload) => {
      const response = await api.put(`/brand/${productionId}`, payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || t('productionEditPage.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['production-list'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-productions'] });
      queryClient.invalidateQueries({ queryKey: ['production-edit-detail', productionId] });
      navigate('/productions');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || t('productionEditPage.updateError');
      toast.error(String(message));
    },
  });

  const summaryDescription = useMemo(() => productionDetailQuery.data?.description_list?.[0] || '-', [productionDetailQuery.data]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name?.trim() || '';
    const description = form.description?.trim() || '';

    if (!name || !description) {
      toast.error(t('productionEditPage.validation.required'));
      return;
    }

    updateProductionMutation.mutate({
      name,
      description,
    });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button type="button" variant="outline" className="rounded-xl border-gray-200" onClick={() => navigate('/productions')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('productionEditPage.back')}
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('productionEditPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('productionEditPage.subtitle')}</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl w-fit">{t('productionEditPage.badge')}</Badge>
      </div>

      {productionDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('productionEditPage.loading')}
          </CardContent>
        </Card>
      ) : productionDetailQuery.isError || !productionDetailQuery.data ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            {t('productionEditPage.loadError')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-[0.8fr_1.2fr] gap-6 xl:gap-8 items-start">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Factory className="w-5 h-5" />
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-none">Production layer</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">{productionDetailQuery.data.name}</h2>
                <p className="text-sm text-gray-500 mt-1">ID: {productionDetailQuery.data.id}</p>
              </div>

              {productionDetailQuery.data.photo_url ? (
                <div className="h-32 rounded-3xl border border-gray-100 bg-white p-3 flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={productionDetailQuery.data.photo_url}
                    alt={productionDetailQuery.data.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="h-32 rounded-3xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                  No preview image
                </div>
              )}

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2"><Tags className="w-4 h-4" />Category</span>
                  <strong className="text-slate-900 text-right">{productionDetailQuery.data.category || '-'}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Description</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{summaryDescription}</strong>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Form edit production</h2>
                <p className="text-sm text-gray-500 mt-1">Terhubung ke endpoint <strong>PUT /brand/{'{production_id}'}</strong>.</p>
              </div>
            </CardHeader>
            <CardContent className="px-6 sm:px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="edit-production-name-page">Production name</Label>
                  <Input
                    id="edit-production-name-page"
                    value={form.name || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nama production yang diperbarui"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-production-description-page">Description</Label>
                  <textarea
                    id="edit-production-description-page"
                    value={form.description || ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Deskripsi production yang diperbarui"
                    className="min-h-[140px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full"
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-gray-500">Setelah update berhasil, halaman akan kembali ke daftar production.</p>
                  <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                    <Button type="button" variant="ghost" className="rounded-xl w-full sm:w-auto" onClick={() => navigate('/productions')}>
                      Batal
                    </Button>
                    <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 w-full sm:w-auto" disabled={updateProductionMutation.isPending}>
                      {updateProductionMutation.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                      ) : (
                        <><Save className="w-4 h-4 mr-2" />Update Production</>
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
