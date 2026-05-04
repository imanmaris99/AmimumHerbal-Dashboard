# Screenshot Guide (Repository Showcase)

Panduan ini memastikan screenshot terlihat konsisten, profesional, dan siap jual untuk README/portfolio.

## 1) Perangkat & Resolusi

Gunakan salah satu standar berikut:

- **Desktop**: 1920x1080 (16:9)
- **Laptop**: 1440x900
- **Mobile**: 1170x2532 (iPhone 12/13 style)

> Untuk flow dashboard, prioritaskan desktop.
> Untuk welcome/login, sertakan 1 versi mobile + 1 desktop jika memungkinkan.

## 2) Browser & Zoom

- Browser: Chrome/Edge terbaru
- Zoom: **100%**
- UI scale OS: default (100%)
- Matikan extension yang mengganggu tampilan

## 3) Data Sebelum Screenshot

Pastikan data terlihat realistis:

- Ada ringkasan KPI (overview)
- Ada beberapa order/payment
- Catalog/variant/content/production tidak kosong
- User list berisi minimal 2-3 data

Hindari data sensitif (email personal penuh, token, dsb).

## 4) Framing & Komposisi

- Ambil fullscreen area aplikasi, hindari crop terlalu sempit
- Pastikan sidebar/topbar terlihat (untuk dashboard pages)
- Hindari popup/tooltip yang tidak relevan
- Pastikan teks tidak blur dan terbaca

## 5) Naming Convention (WAJIB)

Simpan ke folder `docs/screenshots/` dengan nama berikut:

1. `01-welcome-screen.png`
2. `02-login-screen.png`
3. `03-forgot-password.png`
4. `04-reset-password.png`
5. `05-overview-dashboard.png`
6. `06-orders-payments-unified.png`
7. `07-catalog-management.png`
8. `08-variant-management.png`
9. `09-content-management.png`
10. `10-production-management.png`
11. `11-users-owner.png`
12. `12-settings-profile.png`

## 6) Quality Checklist

Sebelum commit screenshot, cek:

- [ ] Resolusi sesuai standar
- [ ] Tidak blur / tidak pecah
- [ ] Tidak ada data rahasia
- [ ] Tampilan sesuai branding terbaru
- [ ] Nama file sudah benar

## 7) Optional (Highly Recommended)

- Tambahkan 1 gambar hero: `00-cover-dashboard.png`
- Gunakan shadow ringan dan margin konsisten jika membuat mockup frame
- Simpan source design/mockup (jika ada) di `docs/screenshots/source/`
