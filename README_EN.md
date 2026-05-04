# Amimum Herbal Internal Dashboard

![Amimum Dashboard Cover](docs/screenshots/00-cover-dashboard.png)

A professional internal operations dashboard for **Owner** and **Admin** teams of Amimum Herbal.

This app is intentionally separated from the public storefront to keep authentication boundaries, security posture, and internal UX clean.

---

## ✨ Product Value

- **Internal-first architecture** for operational workflows
- **Role-aware access** with owner/admin boundaries
- **Bilingual-ready implementation** (Indonesian + English)
- **Complete operations modules** (overview, transactions, catalog, users, content, production)
- **Polished auth journey** (Welcome → Login → Forgot Password → Reset Password)
- **Production deployment ready** via Vite + env-based API target

---

## 🧱 Tech Stack

- React + TypeScript + Vite
- React Router
- Zustand
- TanStack Query
- Axios
- Tailwind-style utility UI components

---

## 🔐 Role Access Matrix

### Shared Internal (Owner + Admin)
- Overview
- Unified Orders & Payments
- Catalog
- Variants
- Content
- Production
- Cashier
- Inventory monitor
- Help

### Owner-only
- Users management
- Sensitive settings/actions

### Customer
- No access to internal dashboard routes

---

## 🧭 UX Flow

1. Welcome screen (`/`)
2. Login (`/login`)
3. Forgot password (`/forgot-password`)
4. Reset password (`/reset-password`)
5. Internal dashboard (`/overview`)

---

## 🖼️ Screenshots

All screenshots should be placed in: `docs/screenshots/`

- `01-welcome-screen.png`
- `02-login-screen.png`
- `03-forgot-password.png`
- `04-reset-password.png`
- `05-overview-dashboard.png`
- `06-orders-payments-unified.png`
- `07-catalog-management.png`
- `08-variant-management.png`
- `09-content-management.png`
- `10-production-management.png`
- `11-users-owner.png`
- `12-settings-profile.png`

For screenshot standards, see:
- `docs/screenshots/SCREENSHOT_GUIDE.md`

---

## ⚙️ Environment

Create `.env`:

```env
VITE_API_URL="https://api.103-174-114-183.sslip.io"
```

---

## 🚀 Local Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

---

## ☁️ Deployment (Vercel)

1. Import repository to Vercel
2. Framework preset: **Vite**
3. Add env var:
   - `VITE_API_URL=https://api.103-174-114-183.sslip.io`
4. Build command: `npm run build`
5. Output directory: `dist`

---

## ✅ QA Minimum Checklist

- Owner/Admin can log in successfully
- Unauthorized/customer users cannot access internal routes
- Overview summary loads without crash
- Unified Orders/Payments works
- Core create/update flows are functional (catalog, variants, content, production)
- Owner-only guards are enforced
- Forgot/reset password flow works end-to-end

---

## 📌 Notes

This dashboard is built as a stable, scalable internal operational MVP — suitable for real business use and professional repository showcase.
