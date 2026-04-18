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
- forgot password internal end-to-end via email reset request dan halaman reset password dashboard
- overview live ke dashboard summary
- orders live ke backend admin orders
- payments live ke backend admin payments
- catalog management untuk submit product baru dan dedicated edit page product
- variant / pack type management sesuai struktur BE, termasuk update stock/discount dan upload image
- content management untuk article layer, termasuk create dan dedicated edit page article yang sudah sinkron dengan real article id
- production / brand management untuk relasi katalog dan product category layer, termasuk create dan dedicated edit page production
- users live ke backend admin users dengan dedicated edit page owner-only
- profile/settings internal untuk owner + admin, termasuk edit info, upload foto, dan ganti password
- user management owner-only dengan dedicated edit page untuk edit user lain
- owner-only visibility untuk area sensitif
- topbar/sidebar/help page sudah disejajarkan dengan role matrix internal

## Endpoint backend yang dipakai
- `POST /admin/login`
- `POST /admin/forgot-password`
- `POST /admin/password-reset/confirm`
- `GET /admin/dashboard/summary`
- `GET /admin/orders`
- `GET /admin/payments`
- `GET /admin/users`
- `PATCH /admin/users/{user_id}/status`
- `GET /brand/all`
- `POST /brand/create`
- `PUT /brand/{production_id}`
- `GET /product/all`
- `GET /product/detail/{product_id}`
- `POST /product/create`
- `PUT /product/{product_id}`
- `GET /type/all`
- `POST /type/create`
- `PUT /type/{type_id}`
- `PUT /type/image/{type_id}`
- `DELETE /type/delete/{type_id}`
- `GET /articles/all`
- `POST /articles/create`
- `PUT /articles/update/{article_id}`
- `GET /categories/all` (product category / tag category layer)
- `POST /categories/post` (product category / tag category layer)
- `GET /admin/profile`
- `PUT /admin/edit-info`
- `PUT /admin/edit-photo`
- `PUT /admin/change-password`
- `PUT /admin/users/{user_id}` (owner-only)

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
- Dedicated edit page yang sudah resmi dipakai saat ini:
  - `/users/edit/:userId`
  - `/productions/edit/:productionId`
  - `/content/edit/:articleId`
  - `/catalog/edit/:productId`
- Checklist QA users/settings/catalog/variant/content/production minimum saat ini:
  - owner dan admin bisa login ke dashboard internal
  - `GET /admin/dashboard/summary` harus 200 untuk owner dan admin
  - `GET /admin/orders` harus 200 untuk owner dan admin
  - `GET /admin/payments` harus 200 untuk owner dan admin
  - `GET /admin/profile` harus 200 untuk owner dan admin
  - `GET /admin/users` harus 200 untuk owner dan admin
  - `GET /admin/users/{user_id}` saat ini bisa diakses owner dan admin untuk detail monitoring
  - `PUT /admin/users/{user_id}` tetap owner-only untuk edit user lain
  - admin dan owner bisa mengakses `/catalog` dan `/variants`
  - customer tidak boleh masuk flow internal
  - `POST /product/create` membuat product dengan `product_by_id` valid
  - `POST /type/create` membuat variant dengan `product_id` valid
  - `PUT /type/:type_id` memperbarui stock/discount dengan respons sukses
  - `PUT /type/image/:type_id` menerima file valid untuk upload image variant
  - `GET /articles/all` memberi data monitoring article layer dengan `id` internal yang dipakai dashboard edit
  - `POST /articles/create` membuat article dengan token internal valid
  - `PUT /articles/update/:article_id` memperbarui article dari dashboard internal
  - route edit article harus memakai real article id, bukan display id
  - `GET /categories/all` dan `POST /categories/post` dipakai untuk product category / tag category layer
  - `POST /brand/create` membuat production dengan `herbal_category_id` valid
  - `PUT /brand/:production_id` memperbarui production dari dashboard internal
  - `GET /product/detail/:product_id` dan `PUT /product/:product_id` dipakai dedicated product edit page
  - badge variant di catalog harus merefleksikan variant valid, bukan raw relasi mentah yang masih null-heavy
  - empty state dan loading state frontend tidak boleh crash saat data kosong
- Fokus saat ini adalah menyelesaikan internal operational MVP yang stabil dan siap deploy.
