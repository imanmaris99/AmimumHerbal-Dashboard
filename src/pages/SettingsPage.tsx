import React from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== 'owner') {
    return <Navigate to="/overview" replace />;
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Owner Settings</h1>
        <p className="text-gray-500 mt-1">Area sensitif untuk owner. Halaman ini disiapkan sebagai landing zone untuk pengaturan strategis berikutnya.</p>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
        <CardContent className="p-8 space-y-4">
          <Badge className="bg-orange-50 text-orange-600 border-none">Owner-only</Badge>
          <h2 className="text-lg font-bold text-gray-900">Role matrix alignment</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Sesuai matrix awal, halaman ini dicadangkan untuk pengaturan yang tidak boleh dibuka admin umum. Saat ini area settings belum dihubungkan ke backend write action agar rollout tetap aman dan bertahap.
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
            <li>Shared internal: overview, orders, payments</li>
            <li>Owner-only: users management, sensitive settings</li>
            <li>Customer tidak memiliki akses ke dashboard internal</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
