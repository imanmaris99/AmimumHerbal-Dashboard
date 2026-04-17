# Amimum Herbal Dashboard

Dashboard internal untuk operasional **Toko Herbal Amimum**.

Fokus app ini adalah area internal terpisah dari storefront customer, sesuai keputusan arsitektur awal:
- **frontend customer** untuk publik + customer flow
- **frontend dashboard internal** untuk `admin` dan `owner`

## Stack
- Vite
- React
- TypeScript
- React Router
- Zustand
- TanStack Query
- Axios

## Environment
Buat file `.env` lokal atau set environment di Vercel:

```env
VITE_API_URL="https://amimumprojectbe-production.up.railway.app"
```

## Run local
```bash
npm install
npm run dev
```

## Build production
```bash
npm run build
```

## Role access matrix
Sesuai matrix yang sudah ditetapkan:

### 1. Shared internal (`admin` + `owner`)
Halaman/fitur yang boleh diakses:
- `/overview`
- `/orders`
- `/payments`
- `/catalog`
- `/variants`
- `/content`
- `/productions`

### 2. Owner-only
Halaman/fitur yang hanya boleh diakses owner:
- `/users`
- `/settings`
- aksi sensitif seperti status user owner-controlled

### 3. Customer
- tidak punya akses ke dashboard internal
- customer flow tetap berada di frontend customer terpisah

## Fitur yang sudah live
- login internal via backend
- overview live ke dashboard summary
- orders live ke backend admin orders
- payments live ke backend admin payments
- catalog management awal untuk submit product baru
- variant / pack type management awal sesuai struktur BE
- content management untuk article layer
- production / brand management awal untuk relasi katalog dan product category layer
- users live ke backend admin users
- owner-only visibility untuk area sensitif
- topbar/sidebar sudah disejajarkan dengan role matrix internal

## Endpoint backend yang dipakai
- `POST /admin/login`
- `GET /admin/dashboard/summary`
- `GET /admin/orders`
- `GET /admin/payments`
- `GET /admin/users`
- `PATCH /admin/users/{user_id}/status`
- `GET /brand/all`
- `GET /product/all`
- `POST /product/create`
- `GET /type/all`
- `POST /type/create`
- `PUT /type/{type_id}`
- `PUT /type/image/{type_id}`
- `DELETE /type/delete/{type_id}`
- `GET /articles/all`
- `POST /articles/create`
- `GET /categories/all` (product category / tag category layer)
- `POST /categories/post` (product category / tag category layer)
- `GET /brand/all`
- `POST /brand/create`

## Deploy ke Vercel free
1. Import repo ini ke Vercel
2. Framework preset: **Vite**
3. Set env:
   - `VITE_API_URL=https://amimumprojectbe-production.up.railway.app`
4. Build command:
   - `npm run build`
5. Output directory:
   - `dist`

## Catatan implementasi
- Dashboard ini sengaja dipisah dari frontend customer agar boundary auth, UX, dan security tetap jelas.
- Rollout owner-only write actions dibuat bertahap agar aman dan mudah diaudit.
- Submit product baru mengikuti diagram database utama: `products.product_by_id -> productions.id`, lalu tahap berikutnya melengkapi `pack_types.product_id -> products.id` untuk variant/kemasan/stok.
- Matrix endpoint dashboard harus selalu mengikuti struktur backend: shared internal untuk endpoint dengan `admin_access_required`, owner-only hanya untuk area sensitif yang memang dipisah guard-nya.
- QA dashboard harus memeriksa 3 hal: akses role, kontrak endpoint, dan kesesuaian relasi DB pada payload create/update.
- Checklist QA catalog/variant minimum saat ini:
  - admin dan owner bisa mengakses `/catalog` dan `/variants`
  - customer tidak boleh masuk flow internal
  - `POST /product/create` membuat product dengan `product_by_id` valid
  - `POST /type/create` membuat variant dengan `product_id` valid
  - `PUT /type/:type_id` memperbarui stock/discount dengan respons sukses
  - `PUT /type/image/:type_id` menerima file valid untuk upload image variant
  - `GET /articles/all` memberi data monitoring article layer
  - `POST /articles/create` membuat article dengan token internal valid
  - `GET /categories/all` dan `POST /categories/post` dipakai untuk product category / tag category layer
  - `POST /brand/create` membuat production dengan `herbal_category_id` valid
  - empty state dan loading state frontend tidak boleh crash saat data kosong
- Fokus saat ini adalah menyelesaikan internal operational MVP yang stabil dan siap deploy.
