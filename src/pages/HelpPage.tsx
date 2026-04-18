import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const sharedModules = [
  'Overview untuk ringkasan operasional live',
  'Orders untuk monitoring dan update status pesanan',
  'Payments untuk monitoring transaksi dan pembayaran',
  'Catalog untuk create dan edit product inti',
  'Variants untuk pack type, stok, discount, dan image variant',
  'Productions untuk create dan edit brand / production layer',
  'Content untuk create dan edit article layer',
];

const ownerModules = [
  'Users untuk monitoring dan edit user lain',
  'Settings untuk kelola profil internal sendiri, foto, dan password',
  'Aksi sensitif user management tetap owner-controlled',
];

const editFlows = [
  { module: 'Users', route: '/users/edit/:userId', note: 'Owner-only edit user lain' },
  { module: 'Productions', route: '/productions/edit/:productionId', note: 'Dedicated page edit production' },
  { module: 'Content', route: '/content/edit/:articleId', note: 'Dedicated page edit article dengan real article id' },
  { module: 'Catalog', route: '/catalog/edit/:productId', note: 'Dedicated page edit product sesuai contract backend' },
];

const deployNotes = [
  'Dashboard target deploy di Vercel free',
  'Backend source of truth tetap Railway',
  'Gunakan VITE_API_URL ke https://amimumprojectbe-production.up.railway.app',
  'SPA rewrite harus aktif lewat vercel.json',
];

export default function HelpPage() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Help Desk</h1>
          <p className="text-gray-500 mt-1">Ringkasan operasional dashboard internal yang sudah diselaraskan dengan matrix role, endpoint backend, dan flow edit dedicated page.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl w-fit">Owner + Admin guide</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-bold text-gray-900">Shared Internal</h2>
            <p className="text-sm text-gray-600">Area yang boleh dipakai <strong>admin</strong> dan <strong>owner</strong> untuk operasional harian.</p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              {sharedModules.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-bold text-gray-900">Owner Only</h2>
            <p className="text-sm text-gray-600">Area dengan kontrol lebih sensitif yang tetap dikunci untuk owner.</p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              {ownerModules.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-bold text-gray-900">Deploy Notes</h2>
            <p className="text-sm text-gray-600">Catatan penting supaya dashboard live tetap sinkron dengan backend.</p>
            <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
              {deployNotes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-4">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Dedicated edit flow yang sudah resmi</h2>
            <p className="text-sm text-gray-500 mt-1">Pattern edit sekarang dipisahkan ke halaman khusus supaya create dan update tidak bercampur dalam satu layar.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editFlows.map((item) => (
              <div key={item.route} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-900">{item.module}</h3>
                  <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-200">{item.route}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-2">{item.note}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-gray-900 text-white">
        <CardContent className="p-6 md:p-8 space-y-4">
          <div>
            <h2 className="font-bold text-lg">Operational reminders</h2>
            <p className="text-sm text-gray-300 mt-1">Acuan singkat saat melakukan QA atau troubleshooting di dashboard internal.</p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-200">
            <li className="rounded-2xl bg-white/5 border border-white/10 p-4">Jika update gagal, cek apakah route edit memakai <strong>real id</strong>, bukan display id atau label tampilan.</li>
            <li className="rounded-2xl bg-white/5 border border-white/10 p-4">Untuk issue artikel, source of truth update sekarang adalah <strong>GET /articles/all</strong> + <strong>PUT /articles/update/{'{article_id}'}</strong>.</li>
            <li className="rounded-2xl bg-white/5 border border-white/10 p-4">Product dan category image jangan dipaksa tampil kalau backend contract resmi belum menyediakannya.</li>
            <li className="rounded-2xl bg-white/5 border border-white/10 p-4">Jika Vercel route bermasalah, cek <strong>vercel.json</strong>, env <strong>VITE_API_URL</strong>, dan CORS backend Railway.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
