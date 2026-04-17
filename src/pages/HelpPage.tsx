import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function HelpPage() {
  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Help Desk</h1>
        <p className="text-gray-500 mt-1">Ringkasan singkat penggunaan dashboard internal sesuai matrix akses yang sudah kita tetapkan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-2">
            <h2 className="font-bold text-gray-900">Admin + Owner</h2>
            <p className="text-sm text-gray-600">Bisa mengakses overview, orders, dan payments untuk monitoring operasional harian.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-2">
            <h2 className="font-bold text-gray-900">Owner Only</h2>
            <p className="text-sm text-gray-600">Bisa mengakses user management dan settings karena area ini menyentuh kontrol yang lebih sensitif.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl">
          <CardContent className="p-6 space-y-2">
            <h2 className="font-bold text-gray-900">Deploy Notes</h2>
            <p className="text-sm text-gray-600">Gunakan VITE_API_URL ke Railway backend. Dashboard ini target deploy di Vercel free.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
