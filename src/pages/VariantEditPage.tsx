import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Boxes, ImagePlus, Loader2, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VariantItem {
  id: number;
  product?: string;
  product_id?: string;
  name?: string | null;
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

interface UpdateVariantPayload {
  name: string;
  variant: string;
  expiration: string;
  stock: number;
  price: number;
  discount: number;
}

export default function VariantEditPage() {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { variantId } = useParams<{ variantId: string }>();

  const [form, setForm] = useState<UpdateVariantPayload>({
    name: '',
    variant: '',
    expiration: '',
    stock: 0,
    price: 0,
    discount: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  if (user?.role !== 'owner' && user?.role !== 'admin') {
    return <Navigate to="/overview" replace />;
  }

  const variantDetailQuery = useQuery({
    queryKey: ['variant-detail', variantId],
    queryFn: async () => {
      const response = await api.get<VariantResponse>('/type/all');
      const variants = response.data.data ?? [];
      const target = variants.find((item) => String(item.id) === variantId);
      if (!target) {
        throw new Error('Variant not found.');
      }
      return target;
    },
    enabled: !!variantId,
  });

  useEffect(() => {
    if (!variantDetailQuery.data) return;
    setForm({
      name: variantDetailQuery.data.name?.trim() || '',
      variant: variantDetailQuery.data.variant?.trim() || '',
      expiration: variantDetailQuery.data.expiration?.trim() || '',
      stock: Number(variantDetailQuery.data.stock || 0),
      price: Number(variantDetailQuery.data.price || variantDetailQuery.data.discounted_price || 0),
      discount: Number(variantDetailQuery.data.discount || 0),
    });
  }, [variantDetailQuery.data]);

  const invalidateVariantData = () => {
    queryClient.invalidateQueries({ queryKey: ['all-pack-types'] });
    queryClient.invalidateQueries({ queryKey: ['variant-detail', variantId] });
  };

  const updateVariantMutation = useMutation({
    mutationFn: async (payload: UpdateVariantPayload) => {
      const response = await api.put(`/type/${variantId}`, payload);
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || t('variantsPage.messages.updateSuccess'));
      invalidateVariantData();
      navigate('/variants');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || t('variantsPage.messages.updateError');
      toast.error(String(message));
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
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
      setImageFile(null);
      invalidateVariantData();
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || t('variantsPage.messages.imageError');
      toast.error(String(message));
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/type/delete/${variantId}`, {
        data: {
          type_id: Number(variantId),
        },
      });
      return response.data;
    },
    onSuccess: (response: any) => {
      toast.success(response?.message || 'Variant berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['all-pack-types'] });
      navigate('/variants');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      const message = detail?.message || detail || 'Gagal menghapus variant.';
      toast.error(String(message));
    },
  });

  const summaryPrice = useMemo(() => {
    const data = variantDetailQuery.data;
    if (!data) return '-';

    if (typeof data.discounted_price === 'number' && Number(data.discount || 0) > 0) {
      return `Rp ${Number(data.price || 0).toLocaleString('id-ID')} -> Rp ${Number(data.discounted_price).toLocaleString('id-ID')}`;
    }

    return `Rp ${Number(data.price || 0).toLocaleString('id-ID')}`;
  }, [variantDetailQuery.data]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateVariantMutation.mutate(form);
  };

  const handleImageUpload = () => {
    if (!imageFile) {
      toast.error(t('variantsPage.messages.selectImage'));
      return;
    }
    uploadImageMutation.mutate(imageFile);
  };

  const handleDelete = () => {
    const confirmed = window.confirm('Yakin ingin menghapus variant ini? Jika variant masih dipakai cart atau order history, backend akan menolak.');
    if (!confirmed) return;
    deleteVariantMutation.mutate();
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button type="button" variant="outline" className="rounded-xl border-gray-200" onClick={() => navigate('/variants')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Variants
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edit Variant</h1>
          <p className="text-gray-500 mt-1">Halaman edit khusus untuk satu variant agar konteks item yang sedang diubah lebih jelas dan tidak tercampur dengan create flow.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl w-fit">Admin + Owner edit page</Badge>
      </div>

      {variantDetailQuery.isLoading ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-8 flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading variant detail...
          </CardContent>
        </Card>
      ) : variantDetailQuery.isError || !variantDetailQuery.data ? (
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
          <CardContent className="p-8 text-sm text-red-700">
            Gagal memuat data variant. Silakan kembali ke halaman variants dan coba lagi.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 2xl:grid-cols-[0.82fr_1.18fr] gap-6 xl:gap-8 items-start">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                  <Boxes className="w-5 h-5" />
                </div>
                <Badge className="bg-slate-100 text-slate-700 border-none">Variant detail</Badge>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 break-all">{variantDetailQuery.data.name || variantDetailQuery.data.variant || '-'}</h2>
                <p className="text-sm text-gray-500 mt-1">Variant ID: {variantDetailQuery.data.id}</p>
              </div>

              {variantDetailQuery.data.img ? (
                <div className="h-36 rounded-3xl border border-gray-100 bg-white p-3 flex items-center justify-center overflow-hidden shadow-sm">
                  <img
                    src={variantDetailQuery.data.img}
                    alt={variantDetailQuery.data.name || variantDetailQuery.data.variant || 'variant'}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="h-36 rounded-3xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                  No preview image
                </div>
              )}

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Product</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{variantDetailQuery.data.product || '-'}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Current stock</span>
                  <strong className="text-slate-900">{Number(variantDetailQuery.data.stock || 0)}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Current price</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{summaryPrice}</strong>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span>Expiration</span>
                  <strong className="text-slate-900 text-right max-w-[220px]">{variantDetailQuery.data.expiration || '-'}</strong>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
                Edit variant dipisah ke halaman khusus supaya update lebih fokus, dan user langsung tahu item mana yang sedang diubah.
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Form edit variant</h2>
                  <p className="text-sm text-gray-500 mt-1">Terhubung ke endpoint <strong>PUT /type/{'{type_id}'}</strong>.</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="edit-variant-name-page">Pack type name</Label>
                      <Input id="edit-variant-name-page" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-variant-variant-page">Variant</Label>
                      <Input id="edit-variant-variant-page" value={form.variant} onChange={(e) => setForm((prev) => ({ ...prev, variant: e.target.value }))} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="edit-variant-stock-page">Stock</Label>
                      <Input id="edit-variant-stock-page" type="number" min="0" value={form.stock} onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-variant-price-page">Price</Label>
                      <Input id="edit-variant-price-page" type="number" min="0" value={form.price} onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-variant-discount-page">Discount</Label>
                      <Input id="edit-variant-discount-page" type="number" min="0" step="0.1" value={form.discount} onChange={(e) => setForm((prev) => ({ ...prev, discount: Number(e.target.value) }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-variant-expiration-page">Expiration</Label>
                    <Input id="edit-variant-expiration-page" value={form.expiration} onChange={(e) => setForm((prev) => ({ ...prev, expiration: e.target.value }))} required />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                    <p className="text-xs text-gray-500">Setelah update berhasil, halaman akan kembali ke daftar variants.</p>
                    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                      <Button type="button" variant="ghost" className="rounded-xl w-full sm:w-auto" onClick={() => navigate('/variants')}>
                        Cancel
                      </Button>
                      <Button type="submit" className="rounded-xl bg-slate-900 hover:bg-slate-800 w-full sm:w-auto" disabled={updateVariantMutation.isPending}>
                        {updateVariantMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                        ) : (
                          <><Save className="w-4 h-4 mr-2" />Update Variant</>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Update image variant</h2>
                  <p className="text-sm text-gray-500 mt-1">Terhubung ke endpoint <strong>PUT /type/image/{'{type_id}'}</strong>.</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-variant-image-page">Image file</Label>
                  <Input id="edit-variant-image-page" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                </div>
                <Button type="button" onClick={handleImageUpload} disabled={uploadImageMutation.isPending} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                  {uploadImageMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
                  ) : (
                    <><ImagePlus className="w-4 h-4 mr-2" />Upload Image</>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden border border-red-100 bg-red-50">
              <CardHeader className="px-6 sm:px-8 pt-8 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-red-900">Delete variant</h2>
                  <p className="text-sm text-red-700 mt-1">Aksi ini permanen. Backend akan menolak jika variant masih dipakai cart items atau order history.</p>
                </div>
              </CardHeader>
              <CardContent className="px-6 sm:px-8 pb-8">
                <Button type="button" variant="outline" onClick={handleDelete} disabled={deleteVariantMutation.isPending} className="rounded-xl text-red-600 border-red-200 hover:bg-red-100">
                  {deleteVariantMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
                  ) : (
                    <><Trash2 className="w-4 h-4 mr-2" />Delete Variant</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
