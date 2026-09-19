import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const sharedModules = [
  'Overview: ringkasan operasional toko harian',
  'Orders: cek order masuk, update status, dan input resi resmi',
  'Payments: pantau pembayaran online dan status transaksi',
  'Catalog: tambah/edit produk utama',
  'Variants: tambah/edit varian, harga, stok, kedaluwarsa, dan gambar',
  'Productions: kelola brand/production produk',
  'Content: kelola artikel atau konten pendukung',
  'Cashier: transaksi POS/offline dan cetak nota',
  'Inventory Monitor: pantau stok aman, menipis, dan habis',
];

const ownerModules = [
  'Users: monitoring dan edit akun user lain',
  'Settings: kelola profil internal, foto, dan password sendiri',
  'Aksi sensitif user management tetap owner-controlled',
];

const catalogFlow = [
  'Buat brand/production terlebih dahulu.',
  'Buat produk di Catalog dengan nama, deskripsi, instruksi, berat, dan harga dasar yang valid.',
  'Buat varian di Variants dengan harga lebih dari Rp0, stok nyata, dan kedaluwarsa yang benar.',
  'Cek Inventory Monitor untuk memastikan stok aman sebelum produk dipromosikan.',
  'Jika data belum pasti, jangan dipaksa tampil ke customer.',
];

const orderFlow = [
  'Buka Orders dan cek detail customer, item, alamat, ongkir, total, dan metode pembayaran.',
  'Untuk COD, order valid bisa langsung diproses setelah stok dan alamat aman.',
  'Untuk bayar online, jangan kirim barang sebelum status pembayaran berhasil.',
  'Siapkan barang sesuai item dan jumlah di order.',
  'Setelah barang diserahkan ke kurir, input nomor resi resmi lalu ubah status ke Dikirim.',
];

const dailyChecklist = [
  'Cek order baru dan order Diproses yang belum dikirim.',
  'Cek pembayaran pending/berhasil.',
  'Cek stok menipis atau stok habis.',
  'Pastikan produk/varian baru sudah lengkap sebelum dipromosikan.',
  'Pastikan order terkirim sudah punya resi resmi.',
  'Catat stok yang perlu restock sebelum akhir hari.',
];

const customerTemplates = [
  {
    title: 'Order sedang diproses',
    text: 'Assalamu’alaikum kak, pesanan kakak sudah masuk dan sedang kami proses ya. Jika sudah dikirim, nomor resi akan kami update. Terima kasih kak.',
  },
  {
    title: 'Resi belum tersedia',
    text: 'Assalamu’alaikum kak, pesanan kakak sedang diproses. Nomor resi belum tersedia karena barang belum diserahkan ke kurir. Nanti setelah resi resmi keluar, akan kami update ya kak.',
  },
  {
    title: 'Order sudah dikirim',
    text: 'Assalamu’alaikum kak, pesanan kakak sudah dikirim. No. resi: [ISI RESI]. Silakan cek berkala melalui halaman tracking atau aplikasi kurir terkait. Terima kasih kak.',
  },
  {
    title: 'Pembayaran masih pending',
    text: 'Assalamu’alaikum kak, kami cek pembayaran pesanan kakak masih menunggu penyelesaian. Silakan lanjutkan pembayaran melalui halaman transaksi ya kak. Setelah pembayaran berhasil, pesanan akan kami proses.',
  },
];

const goldenRules = [
  'Kalau data produk belum pasti, jangan dipaksa tampil.',
  'Kalau resi belum resmi, jangan diinput.',
  'Kalau pembayaran online belum berhasil, jangan dikirim.',
  'Kalau stok habis, jangan proses order manual tanpa konfirmasi.',
  'Kalau ragu, konfirmasi owner dulu.',
];

export default function HelpPage() {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panduan Operasional Admin</h1>
          <p className="text-gray-500 mt-1">SOP ringkas dashboard Toko Herbal Amimum untuk owner dan admin: katalog, stok, order, resi, nota, dan balasan customer.</p>
        </div>
        <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-2 rounded-xl w-fit">SOP Owner & Admin</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-bold text-gray-900">Menu Operasional</h2>
            <p className="text-sm text-gray-600">Menu utama yang dipakai untuk menjalankan toko harian.</p>
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

        <Card className="border-none shadow-sm rounded-3xl bg-emerald-50/70">
          <CardContent className="p-6 space-y-3">
            <h2 className="font-bold text-gray-900">Checklist Harian</h2>
            <p className="text-sm text-gray-600">Jalankan checklist ini setiap awal dan akhir operasional.</p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              {dailyChecklist.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 md:p-8 space-y-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Flow Katalog Produk</h2>
              <p className="text-sm text-gray-500 mt-1">Urutan aman sebelum produk dianggap siap dijual di website.</p>
            </div>
            <ol className="space-y-3 text-sm text-gray-700 list-decimal pl-5">
              {catalogFlow.map((item) => <li key={item}>{item}</li>)}
            </ol>
            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-sm text-slate-700">
              Urutan ideal: <strong>Productions → Catalog → Variants → Inventory Monitor → Website Customer</strong>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 md:p-8 space-y-4">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Flow Order & Resi</h2>
              <p className="text-sm text-gray-500 mt-1">Urutan aman dari order masuk sampai customer menerima nomor resi.</p>
            </div>
            <ol className="space-y-3 text-sm text-gray-700 list-decimal pl-5">
              {orderFlow.map((item) => <li key={item}>{item}</li>)}
            </ol>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
              Resi hanya boleh diisi dengan nomor resmi dari kurir. Jangan gunakan ID shipment internal, UUID, catatan sementara, atau kode dummy.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-gray-900 text-white">
        <CardContent className="p-5 sm:p-6 md:p-8 space-y-4">
          <div>
            <h2 className="font-bold text-lg">Rule Emas Admin</h2>
            <p className="text-sm text-gray-300 mt-1">Pegangan cepat saat admin ragu mengambil tindakan.</p>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-200">
            {goldenRules.map((item) => (
              <li key={item} className="rounded-2xl bg-white/5 border border-white/10 p-4">{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-5 sm:p-6 md:p-8 space-y-4">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Template Balasan Customer</h2>
            <p className="text-sm text-gray-500 mt-1">Copy singkat yang bisa dipakai admin saat follow-up order.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerTemplates.map((item) => (
              <div key={item.title} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
