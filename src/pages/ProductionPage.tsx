import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Factory, PlusCircle, Search, Tags, LayoutGrid, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { getAdminSafeErrorMessage } from '@/lib/dashboard';
import { validateImageFile } from '@/lib/imageValidation';

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [brandImageFile, setBrandImageFile] = useState<File | null>(null);
  const [brandImagePreview, setBrandImagePreview] = useState<string>('');
  const [uploadingBrandImage, setUploadingBrandImage] = useState(false);
  const [brandUploadProgress, setBrandUploadProgress] = useState(0);
  const brandImageInputRef = useRef<HTMLInputElement | null>(null);

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
    onSuccess: async (response: any) => {
      const productionId = response?.data?.id;
      if (productionId && brandImageFile) {
        setUploadingBrandImage(true);
        try {
          const formData = new FormData();
          formData.append('file', brandImageFile);
          await api.put(`/brand/logo/${productionId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (e) => {
              const progress = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
              setBrandUploadProgress(progress);
            },
          });
          toast.success('Brand/production dan logo berhasil dibuat');
        } catch (error: any) {
          toast.error(getAdminSafeErrorMessage(error, 'Brand/production berhasil dibuat, tetapi logo belum berhasil di-upload. Coba upload ulang dari halaman edit.'));
        } finally {
          setUploadingBrandImage(false);
          setBrandUploadProgress(0);
        }
      } else {
        toast.success(response?.message || t('productionPage.errors.createSuccess'));
      }

      setCreateForm(initialCreateForm);
      setBrandImageFile(null);
      setBrandImagePreview('');
      setBrandUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ['production-list'] });
      queryClient.invalidateQueries({ queryKey: ['catalog-productions'] });
    },
    onError: (error: any) => {
      toast.error(getAdminSafeErrorMessage(error, t('productionPage.errors.createFailed')));
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

    const name = createForm.name.trim();
    const description = createForm.description.trim();

    if (!createForm.herbal_category_id) {
      toast.error(t('productionPage.errors.selectCategory'));
      return;
    }
    if (!name || !description) {
      toast.error('Nama dan deskripsi brand/production wajib diisi.');
      return;
    }

    createProductionMutation.mutate({ ...createForm, name, description });
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('productionPage.title')}</h1>
          <p className="text-gray-500 mt-1">{t('productionPage.subtitle')}</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl">{t('productionPage.badge')}</Badge>
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
                <Label htmlFor="production-name">Nama brand/production</Label>
                <Input id="production-name" value={createForm.name} onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Contoh: Toko Herbal AmImUm Factory" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="production-category">Kategori produk</Label>
                <select id="production-category" value={createForm.herbal_category_id || ''} onChange={(e) => setCreateForm((prev) => ({ ...prev, herbal_category_id: Number(e.target.value) }))} className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none w-full" required>
                  <option value="">Pilih product category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="production-description">Deskripsi</Label>
                <textarea id="production-description" value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Deskripsi singkat brand/production" className="min-h-[120px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none w-full" required />
              </div>

              <div className="space-y-3">
                <Label>Logo brand / production (opsional)</Label>
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => brandImageInputRef.current?.click()} disabled={uploadingBrandImage}>Pilih File / Kamera</Button>
                    <input ref={brandImageInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!validateImageFile(file)) {
                        e.target.value = '';
                        return;
                      }
                      setBrandImageFile(file);
                      setBrandImagePreview(URL.createObjectURL(file));
                    }} />
                    {uploadingBrandImage && <span className="text-sm text-gray-600">Mengunggah gambar... {brandUploadProgress}%</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Format: image, maksimal 2MB. Logo akan di-upload otomatis setelah production berhasil dibuat.</p>

                  {brandImageFile && (
                    <div className="mt-3 text-xs rounded-lg border border-gray-200 bg-white px-3 py-2 flex items-center justify-between gap-3">
                      <span className="truncate">{brandImageFile.name}</span>
                      <button type="button" className="text-red-600" onClick={() => { setBrandImageFile(null); setBrandImagePreview(''); setBrandUploadProgress(0); }}>Hapus</button>
                    </div>
                  )}

                  {brandImagePreview && <img src={brandImagePreview} alt="brand-preview" className="mt-3 h-20 w-20 object-cover rounded-xl border border-gray-100" />}
                </div>
              </div>

              <Button type="submit" disabled={createProductionMutation.isPending || uploadingBrandImage} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" />
                {createProductionMutation.isPending ? 'Menyimpan...' : 'Simpan Brand/Production'}
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
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari production atau category..." className="pl-10 h-11 bg-gray-50 border-transparent rounded-xl w-full pr-24" />
              {search ? (
                <Button type="button" variant="ghost" className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-lg px-3 text-xs text-gray-500 hover:text-gray-700" onClick={() => setSearch('')}>
                  Reset
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-gray-500">
              Menampilkan <strong>{filteredProductions.length}</strong> dari <strong>{productions.length}</strong> production.
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-5 sm:px-8 pb-6 sm:pb-8">
          {productionsLoading || categoriesLoading ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
              Memuat data brand/production...
            </div>
          ) : filteredProductions.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
              Tidak ada production yang cocok dengan pencarian saat ini. Coba reset search atau gunakan kata kunci lain.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProductions.map((production) => (
                <article
                  key={production.id}
                  className="rounded-3xl bg-white px-4 py-4 shadow-[0_8px_22px_rgba(15,23,42,0.06)] ring-1 ring-gray-100 transition-colors hover:bg-gray-50/70 sm:px-5"
                >
                  <div className="grid grid-cols-[4rem_1fr] gap-4 lg:grid-cols-[4.5rem_minmax(180px,0.8fr)_minmax(160px,0.65fr)_minmax(260px,1.4fr)_auto] lg:items-center">
                    <div className="row-span-2 lg:row-span-1">
                      {production.photo_url ? (
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white p-1 md:h-16 md:w-16">
                          <img
                            src={production.photo_url}
                            alt={production.name}
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-1 text-center text-[10px] font-medium text-gray-400 md:h-16 md:w-16">
                          Belum ada
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Production</p>
                      <h3 className="mt-1 break-words text-sm font-bold leading-5 text-gray-900 dark:text-slate-100 sm:text-base">
                        {production.name}
                      </h3>
                      <p className="mt-1 text-[10px] font-medium text-gray-400 dark:text-slate-400">ID: {production.id}</p>
                    </div>

                    <div className="col-start-2 min-w-0 lg:col-start-auto">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Kategori</p>
                      <p className="mt-1 break-words text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                        {production.category || '-'}
                      </p>
                    </div>

                    <div className="col-span-2 min-w-0 lg:col-span-1">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Deskripsi</p>
                      <p className="mt-1 line-clamp-3 break-words text-sm leading-6 text-gray-600 dark:text-slate-300">
                        {production.description_list?.[0] || '-'}
                      </p>
                    </div>

                    <div className="col-span-2 flex justify-end lg:col-span-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-xl sm:w-auto"
                        onClick={() => navigate(`/productions/edit/${production.id}`)}
                      >
                        <PencilLine className="mr-2 h-4 w-4" />
                        Edit Brand Ini
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="pt-4 text-xs leading-5 text-gray-500">
            Category list diambil dari <code>tag_categories</code> dan dipakai untuk relasi product/production layer. Tampilan ini tidak memakai horizontal scroll agar nama brand tetap terlihat saat admin menekan edit.
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
