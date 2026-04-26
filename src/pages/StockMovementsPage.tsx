import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StockMovementsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pergerakan Stok</h1>
        <p className="text-sm text-gray-600 mt-1">
          Halaman histori pergerakan stok untuk audit operasional sedang disiapkan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scope fase scaffold</CardTitle>
          <CardDescription>
            Baseline audit trail dibuat dulu sebelum integrasi write-action untuk menjaga keamanan perubahan stok.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>• Timeline stok masuk/keluar/adjust</p>
          <p>• Informasi actor, waktu, dan alasan perubahan</p>
          <p>• Filter rentang waktu dan variant</p>
          <p>• Ekspor laporan movement</p>
        </CardContent>
      </Card>
    </div>
  );
}
