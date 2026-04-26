import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CashierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kasir (POS)</h1>
        <p className="text-sm text-gray-600 mt-1">
          Modul kasir internal sedang disiapkan. Halaman ini menjadi pondasi untuk alur cart, checkout, dan sinkronisasi stok.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope fase scaffold</CardTitle>
          <CardDescription>
            Implementasi dilakukan bertahap agar aman terhadap dashboard yang sudah live sebelumnya.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>• Product search dan pemilihan variant</p>
          <p>• Cart kasir + hitung subtotal/total</p>
          <p>• Checkout dan metode pembayaran</p>
          <p>• Posting transaksi + update stok atomik</p>
        </CardContent>
      </Card>
    </div>
  );
}
