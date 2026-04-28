# Changelog

All notable changes to **AmImUm Herbal Dashboard** are documented in this file.

Format follows a simplified Keep a Changelog style.

## [Unreleased]

## [2026-04-28] - Unified Orders & Payments + i18n refinement

### Added
- Unified transaction monitoring experience in `/orders` with tab separation:
  - Orders tab
  - Payments tab
- New i18n namespace for unified page:
  - `ordersPageUnified.title`
  - `ordersPageUnified.subtitle`
  - `ordersPageUnified.tabs.orders`
  - `ordersPageUnified.tabs.payments`
- Professional documentation section in `README.md`:
  - Unified Orders & Payments (Current UX)
  - Internationalization (i18n)

### Changed
- Route `/payments` now redirects to `/orders` to preserve backward compatibility.
- Sidebar navigation simplified by removing duplicate Payments menu entry.
- Unified page text labels updated to remain bilingual (Bahasa Indonesia + English).
- Table labels/loading/error/empty/detail CTA on unified page aligned with locale dictionaries.

### Build / Validation
- Production build verified successful after refactor and documentation updates.

### Commits
- `9bd408e` — refactor(dashboard): unify orders and payments into single page
- `0360ffa` — feat(i18n): keep unified orders-payments page bilingual
- `293c72a` — docs(dashboard): professionalize unified orders-payments and i18n documentation
