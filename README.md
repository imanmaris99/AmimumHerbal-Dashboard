# Dashboard Internal Toko Herbal Amimum

![Amimum Dashboard Cover](docs/screenshots/00-cover-dashboard.png)

Dashboard internal profesional untuk operasional **Owner** dan **Admin** Toko Herbal Amimum.

Aplikasi ini dipisahkan dari storefront customer agar boundary auth, keamanan, dan UX tetap bersih.

---

## ✨ Nilai Produk (Marketplace Value)

- **Internal-first architecture**: khusus operasional internal, bukan publik.
- **Role-aware UX**: akses fitur mengikuti matrix `owner/admin`.
- **Bilingual support**: Bahasa Indonesia & English.
- **Operational modules lengkap**: Overview, Orders/Payments, Catalog, Variants, Content, Production, Users, Settings.
- **Polished auth flow**: Welcome onboarding → Login → Forgot Password → Reset Password.
- **Production-ready deployment**: Vite build, env-based API target, siap deploy ke Vercel/VPS.

---

## 🧱 Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Routing**: React Router
- **State**: Zustand
- **Data fetching/cache**: TanStack Query
- **HTTP client**: Axios
- **UI**: Tailwind utility + UI components
- **Animation**: Motion

---

## 📂 Struktur Modul Utama

- `src/pages/LoginPage.tsx` — halaman login internal
- `src/pages/WelcomePage.tsx` — welcome onboarding sebelum login
- `src/pages/ForgotPasswordPage.tsx` — request reset password
- `src/pages/ResetPasswordPage.tsx` — konfirmasi reset password
- `src/pages/OverviewPage.tsx` — ringkasan KPI operasional
- `src/pages/OrdersPage.tsx` — unified Orders & Payments
- `src/components/dashboard/*` — layout, sidebar, topbar, profile

---

## 🔐 Role & Akses

### Shared Internal (Owner + Admin)
- `/overview`
- `/orders` (unified Orders & Payments)
- `/catalog`
- `/variants`
- `/content`
- `/productions`
- `/cashier`
- `/inventory-monitor`
- `/help`

### Owner-only (sensitif)
- `/users` + edit user
- `/settings` (area kontrol tertentu)

### Customer
- **Tidak punya akses** ke dashboard internal.

---

## 🧭 Alur Tampilan (Flow)

1. **Welcome Screen (`/`)**
   - onboarding ringkas, identitas brand, CTA ke login
2. **Login (`/login`)**
   - email/password internal
3. **Forgot Password (`/forgot-password`)**
   - request instruksi reset via email
4. **Reset Password (`/reset-password`)**
   - submit email + kode + password baru
5. **Dashboard (`/overview`)**
   - KPI utama + ringkasan operasional

---

## 🖼️ Screenshot UI (Professional Showcase)

> Simpan semua screenshot di folder: `docs/screenshots/`
>
> Standar pengambilan screenshot: lihat `docs/screenshots/SCREENSHOT_GUIDE.md`

### Authentication Flow

#### 1) Welcome Screen
![Welcome Screen](docs/screenshots/01-welcome-screen.png)

#### 2) Login Screen
![Login Screen](docs/screenshots/02-login-screen.png)

#### 3) Forgot Password
![Forgot Password](docs/screenshots/03-forgot-password.png)

#### 4) Reset Password
![Reset Password](docs/screenshots/04-reset-password.png)

### Dashboard Flow

#### 5) Overview Dashboard
![Overview](docs/screenshots/05-overview-dashboard.png)

#### 6) Orders & Payments (Unified)
![Orders Payments Unified](docs/screenshots/06-orders-payments-unified.png)

#### 7) Catalog Management
![Catalog Management](docs/screenshots/07-catalog-management.png)

#### 8) Variant Management
![Variant Management](docs/screenshots/08-variant-management.png)

#### 9) Content Management
![Content Management](docs/screenshots/09-content-management.png)

#### 10) Production Management
![Production Management](docs/screenshots/10-production-management.png)

#### 11) Users (Owner-only)
![Users Owner](docs/screenshots/11-users-owner.png)

#### 12) Settings / Profile
![Settings Profile](docs/screenshots/12-settings-profile.png)

> Jika file belum ada, screenshot tinggal ditambahkan dengan nama yang sama agar otomatis tampil di README.

---

## 🌐 Internationalization (i18n)

- Locale files:
  - `src/locales/id.json`
  - `src/locales/en.json`
- Bahasa default mengikuti konfigurasi app
- Semua copy auth & dashboard utama sudah diselaraskan bilingual

---

## 🔌 Endpoint Backend yang Dipakai

### Auth & Profile
- `POST /admin/login`
- `POST /admin/forgot-password`
- `POST /admin/password-reset/confirm`
- `GET /admin/profile`
- `PUT /admin/edit-info`
- `PUT /admin/edit-photo`
- `PUT /admin/change-password`

### Dashboard & Transaksi
- `GET /admin/dashboard/summary`
- `GET /admin/orders`
- `GET /admin/payments`

### User Management
- `GET /admin/users`
- `PUT /admin/users/{user_id}` (owner-only)
- `PATCH /admin/users/{user_id}/status`

### Catalog / Variant
- `GET /product/all`
- `GET /product/detail/{product_id}`
- `POST /product/create`
- `PUT /product/{product_id}`
- `GET /type/all`
- `POST /type/create`
- `PUT /type/{type_id}`
- `PUT /type/image/{type_id}`
- `DELETE /type/delete/{type_id}`

### Content
- `GET /articles/all`
- `POST /articles/create`
- `PUT /articles/update/{article_id}`

### Production / Brand / Category
- `GET /brand/all`
- `POST /brand/create`
- `PUT /brand/{production_id}`
- `GET /categories/all`
- `POST /categories/post`

---

## ⚙️ Environment

Buat file `.env`:

```env
VITE_API_URL="https://api.103-174-114-183.sslip.io"
```

Lihat contoh di `.env.example`.

---

## 🚀 Jalankan Lokal

```bash
npm install
npm run dev
```

Build production:

```bash
npm run build
```

---

## ☁️ Deploy (Vercel)

1. Import repository ke Vercel
2. Framework: **Vite**
3. Set Environment Variable:
   - `VITE_API_URL=https://api.103-174-114-183.sslip.io`
4. Build command: `npm run build`
5. Output directory: `dist`

---

## ✅ QA Checklist Singkat (Minimum)

- Owner/Admin bisa login
- Customer tidak bisa masuk dashboard internal
- Overview summary load tanpa error
- Unified Orders/Payments bekerja
- CRUD utama Catalog/Variant/Content/Production berjalan
- Users & area sensitif mengikuti guard owner-only
- Forgot/Reset password berhasil end-to-end
- Empty/loading/error state tidak crash

---

## 🗂️ Release & Dokumentasi

- Changelog: `docs/CHANGELOG.md`
- Release template: `docs/RELEASE_TEMPLATE.md`

---

## 📌 Catatan Produk

Dashboard ini dibangun sebagai fondasi **internal operational MVP** yang stabil, mudah diekspansi, dan siap dipresentasikan secara profesional ke stakeholder maupun calon partner developer.
