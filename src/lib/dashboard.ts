export const orderStatusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  paid: 'bg-emerald-50 text-emerald-600',
  capture: 'bg-emerald-50 text-emerald-600',
  settlement: 'bg-emerald-50 text-emerald-600',
  processing: 'bg-blue-50 text-blue-600',
  shipped: 'bg-cyan-50 text-cyan-600',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-rose-50 text-rose-600',
  failed: 'bg-red-50 text-red-600',
  refund: 'bg-violet-50 text-violet-600',
};

export const orderStatusLabels: Record<string, string> = {
  pending: 'Menunggu bayar',
  paid: 'Pembayaran berhasil',
  capture: 'Pembayaran berhasil',
  settlement: 'Pembayaran berhasil',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  failed: 'Gagal',
  refund: 'Refund',
};

export const paymentStatusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-600',
  settlement: 'bg-emerald-50 text-emerald-600',
  expire: 'bg-slate-100 text-slate-600',
  cancel: 'bg-rose-50 text-rose-600',
  deny: 'bg-red-50 text-red-600',
  refund: 'bg-violet-50 text-violet-600',
  capture: 'bg-blue-50 text-blue-600',
  authorize: 'bg-blue-50 text-blue-600',
  challenge: 'bg-amber-50 text-amber-700',
  partial_refund: 'bg-violet-50 text-violet-600',
};

export const paymentStatusLabels: Record<string, string> = {
  pending: 'Menunggu bayar',
  settlement: 'Settlement',
  capture: 'Pembayaran berhasil',
  authorize: 'Diotorisasi',
  challenge: 'Perlu review',
  expire: 'Kedaluwarsa',
  cancel: 'Dibatalkan',
  deny: 'Ditolak',
  refund: 'Refund',
  partial_refund: 'Refund sebagian',
};

export const deliveryTypeLabels: Record<string, string> = {
  delivery: 'Kirim ke alamat',
  pickup: 'Ambil di toko',
};

export const userRoleStyles: Record<string, string> = {
  owner: 'bg-emerald-50 text-emerald-600',
  admin: 'bg-blue-50 text-blue-600',
  customer: 'bg-gray-100 text-gray-600',
};

export const userStatusStyles = {
  active: 'bg-green-50 text-green-600',
  inactive: 'bg-red-50 text-red-500',
};

export function getStatusStyle(map: Record<string, string>, value?: string | null, fallback = 'bg-gray-100 text-gray-600') {
  if (!value) return fallback;
  return map[value.toLowerCase()] || fallback;
}

export function getStatusLabel(map: Record<string, string>, value?: string | null, fallback = 'Belum tersedia') {
  if (!value) return fallback;
  return map[value.toLowerCase()] || value.replace(/_/g, ' ');
}

export function sanitizeOrderNotes(notes?: string | null) {
  const cleaned = String(notes || '')
    .replace(/\[(?:PAYMENT|POS_SUBTOTAL|POS_DISCOUNT|POS_TOTAL):[^\]]*\]\s*\|?\s*/gi, '')
    .replace(/\[?POS_BUYER\]?\s*:\s*[^|\[\n\r]+\|?\s*/gi, '')
    .trim();

  return cleaned || '-';
}

export function getAdminSafeErrorMessage(error: any, fallback: string) {
  const status = error?.response?.status;
  if (status === 401 || status === 403) return 'Sesi admin perlu diperbarui. Silakan login ulang.';
  if (status === 404) return 'Data admin tidak ditemukan atau sudah berubah. Muat ulang halaman lalu coba lagi.';
  if (status === 400 || status === 422) return 'Data belum valid. Periksa input lalu coba lagi.';
  if (status && status >= 500) return 'Layanan admin belum bisa memproses permintaan. Coba lagi beberapa saat lagi.';

  const message = String(error?.message || '').toLowerCase();
  if (message.includes('network') || message.includes('timeout') || message.includes('failed to fetch')) {
    return 'Koneksi ke layanan admin sedang bermasalah. Coba lagi beberapa saat lagi.';
  }

  return fallback;
}
