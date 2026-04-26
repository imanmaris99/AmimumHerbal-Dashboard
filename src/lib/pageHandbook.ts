export interface PageHandbookEntry {
  key: string;
  title: string;
  purpose: string;
  primaryUsers: string;
  usageFlow: string[];
  notes?: string[];
}

const handbookEntries: Array<{ match: RegExp; entry: PageHandbookEntry }> = [
  {
    match: /^\/overview$/,
    entry: {
      key: 'overview',
      title: 'Ringkasan Utama',
      purpose: 'Membaca kesehatan operasional harian secara cepat.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Cek KPI utama', 'Pantau ringkasan order/payment', 'Lanjutkan investigasi ke halaman Orders/Payments'],
    },
  },
  {
    match: /^\/orders(\/.*)?$/,
    entry: {
      key: 'orders',
      title: 'Manajemen Pesanan',
      purpose: 'Monitoring order dan kontrol status fulfilment.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Cari/filter order', 'Buka detail order', 'Update status sesuai kondisi operasional'],
      notes: ['Pastikan update status sesuai kondisi real agar audit order konsisten.'],
    },
  },
  {
    match: /^\/payments(\/.*)?$/,
    entry: {
      key: 'payments',
      title: 'Monitoring Pembayaran',
      purpose: 'Audit status transaksi pembayaran dan fraud watch.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Filter payment berdasarkan status', 'Baca detail transaksi', 'Validasi anomali ke order terkait'],
    },
  },
  {
    match: /^\/catalog(\/.*)?$/,
    entry: {
      key: 'catalog',
      title: 'Manajemen Katalog',
      purpose: 'Create/edit produk utama sebelum pengelolaan varian.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Tambah produk baru', 'Pastikan production/brand valid', 'Lanjutkan pengelolaan harga/stok detail di Variants'],
    },
  },
  {
    match: /^\/variants(\/.*)?$/,
    entry: {
      key: 'variants',
      title: 'Manajemen Varian',
      purpose: 'Kelola stock, discount, dan properti jual per pack type.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Pilih produk target', 'Create/update varian', 'Kelola stock/discount/image per varian'],
    },
  },
  {
    match: /^\/productions(\/.*)?$/,
    entry: {
      key: 'productions',
      title: 'Manajemen Production / Brand',
      purpose: 'Mengatur master data production/brand untuk relasi produk.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Create/update production', 'Pastikan category mapping valid', 'Gunakan sebagai source product_by_id pada katalog'],
    },
  },
  {
    match: /^\/content(\/.*)?$/,
    entry: {
      key: 'content',
      title: 'Manajemen Konten',
      purpose: 'Kelola artikel internal/public content layer.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Buat artikel baru', 'Edit artikel existing via page edit', 'Pastikan id artikel sesuai data backend'],
    },
  },
  {
    match: /^\/users(\/.*)?$/,
    entry: {
      key: 'users',
      title: 'Manajemen Pengguna',
      purpose: 'Monitoring user internal/pelanggan dan kontrol akun sensitif.',
      primaryUsers: 'Owner (aksi sensitif), Admin (monitoring sesuai hak akses)',
      usageFlow: ['Cari akun user', 'Buka halaman edit bila dibutuhkan', 'Jalankan aksi sensitif sesuai matriks role'],
    },
  },
  {
    match: /^\/settings$/,
    entry: {
      key: 'settings',
      title: 'Pengaturan',
      purpose: 'Konfigurasi area sensitif dashboard internal.',
      primaryUsers: 'Owner',
      usageFlow: ['Update info profil internal', 'Kelola kredensial/setting sensitif', 'Pastikan perubahan terdokumentasi'],
    },
  },
  {
    match: /^\/cashier$/,
    entry: {
      key: 'cashier',
      title: 'Kasir (POS)',
      purpose: 'Transaksi kasir internal berbasis varian produk.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Cari varian produk', 'Tambah ke cart + atur qty', 'Pilih metode bayar dan checkout'],
      notes: ['Jika endpoint POS backend belum aktif, sistem akan menampilkan fallback error yang aman.'],
    },
  },
  {
    match: /^\/inventory-monitor$/,
    entry: {
      key: 'inventory-monitor',
      title: 'Monitoring Stok',
      purpose: 'Kontrol status stok aman/menipis/habis per varian.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Cek summary status stok', 'Filter varian target', 'Atur threshold per varian'],
    },
  },
  {
    match: /^\/stock-movements$/,
    entry: {
      key: 'stock-movements',
      title: 'Pergerakan Stok',
      purpose: 'Audit perubahan stok (timeline + manual adjustment).',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Review timeline movement', 'Lakukan adjust manual bila perlu', 'Pantau histori perubahan secara periodik'],
      notes: ['Saat endpoint movement belum aktif, halaman memakai fallback snapshot data varian.'],
    },
  },
  {
    match: /^\/help$/,
    entry: {
      key: 'help',
      title: 'Help',
      purpose: 'Referensi operasional dashboard dan alignment backend.',
      primaryUsers: 'Admin & Owner',
      usageFlow: ['Baca guideline usage', 'Cek endpoint alignment', 'Gunakan untuk QA checklist cepat'],
    },
  },
];

const fallbackEntry: PageHandbookEntry = {
  key: 'general',
  title: 'Handbook Halaman',
  purpose: 'Panduan operasional singkat sesuai konteks halaman aktif.',
  primaryUsers: 'Admin & Owner',
  usageFlow: ['Gunakan menu sidebar untuk memilih modul', 'Klik ikon handbook di topbar untuk melihat panduan'],
};

export function getPageHandbook(pathname: string): PageHandbookEntry {
  return handbookEntries.find((item) => item.match.test(pathname))?.entry ?? fallbackEntry;
}
