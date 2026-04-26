# Phase 2 Audit — POS & Inventory Integration (Aligned to Existing Dashboard)

## Tujuan
Dokumen ini memastikan implementasi fitur baru (Kasir/POS + Monitoring Stok) **tidak merusak** fondasi dashboard yang sudah berjalan sebelumnya.

## Fondasi Existing yang Dipertahankan
- Routing utama tetap di `src/App.tsx` dengan protected internal routes.
- State management tetap kombinasi `zustand` (auth/session) + `react-query` (server state).
- API client tetap satu pintu di `src/lib/api.ts`.
- UI pattern tetap mengikuti komponen existing (`Card`, `Table`, `Input`, dsb).
- Role access tidak diubah: `owner` + `admin`.

## Integrasi yang Sudah Dilakukan (Phase 2)
### 1) POS / Cashier (`/cashier`)
- Read data live:
  - `GET /product/all`
  - `GET /type/all`
- Fitur aktif:
  - pencarian product/variant
  - add to cart
  - qty guard berbasis stok
  - subtotal kalkulasi
- Fitur write (checkout) masih di-hold (safe mode) sampai endpoint POS dedicated siap.

### 2) Inventory Monitor (`/inventory-monitor`)
- Read data live dari `GET /type/all`.
- Status stok:
  - `safe`
  - `low` (default threshold <= 10)
  - `out`
- Summary card + tabel monitor + filter pencarian aktif.

### 3) Stock Movements (`/stock-movements`)
- Baseline timeline sementara dari snapshot variant (`updated_at`, `stock`) via `GET /type/all`.
- Tujuan: menjaga visibilitas operasional sambil menunggu movement endpoint dedicated di BE.

## Kriteria Safety yang Dipenuhi
- Tidak mengubah endpoint existing yang sudah dipakai modul lama.
- Tidak mengubah struktur auth/session.
- Tidak mengubah role matrix internal.
- Lint & build berhasil.

## Gap API Backend yang Diperlukan untuk Phase 3 (Write + Audit Trail Real)
Agar POS benar-benar operasional end-to-end, backend disarankan menambah endpoint berikut:

1. **POS Checkout**
- `POST /admin/pos/checkout`
- payload: cart items, payment method, cashier info, notes
- behavior: create transaction + reduce stock atomically

2. **Stock Movement Log**
- `GET /admin/inventory/movements`
- filter: date range, product_id, variant_id, movement_type

3. **Stock Adjustment (Manual)**
- `POST /admin/inventory/adjust`
- payload: variant_id, delta, reason, actor

4. **Low Stock Alert Config**
- `PUT /admin/inventory/threshold/{variant_id}`
- payload: min_threshold

## Rekomendasi Implementasi Lanjutan
- Tambahkan service layer khusus `src/lib/pos.ts` dan `src/lib/inventory.ts` agar page tidak memegang mapping API mentah terlalu banyak.
- Tambahkan optimistic UI hanya untuk action non-kritis. Untuk checkout, tetap server-authoritative.
- Tambahkan toast + inline error standardized untuk semua write actions.
- Tambahkan export CSV untuk inventory movements setelah endpoint movement tersedia.

## Status
- Phase 1 (Scaffold): ✅
- Phase 2 (Live Read Integration): ✅
- Phase 3 (Write Flow + Real Movement): ⏳ pending endpoint BE dedicated
