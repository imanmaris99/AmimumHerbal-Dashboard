import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function InventoryMonitorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Monitoring Stok</h1>
        <p className="text-sm text-gray-600 mt-1">
          Monitoring status stok terpusat sedang disiapkan untuk kebutuhan kontrol operasional marketplace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope fase scaffold</CardTitle>
          <CardDescription>
            Struktur halaman disiapkan terlebih dulu agar sinkron dengan modul katalog/variant yang sudah ada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>• Ringkasan stok aman/menipis/habis</p>
          <p>• Filter produk, brand, dan variant</p>
          <p>• Alert threshold minimum per variant</p>
          <p>• Quick action restock/adjust</p>
        </CardContent>
      </Card>
    </div>
  );
}
