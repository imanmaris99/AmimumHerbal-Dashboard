# Release Notes

## Release Summary
- **Version**: `v0.1.0`
- **Date (UTC)**: `2026-04-28`
- **Type**: `Feature + Improvement + Docs`
- **Scope**: `Dashboard Internal`

## Highlights
- Unified **Orders & Payments** into a single operational page (`/orders`) with tab-based navigation.
- Preserved backward compatibility by redirecting legacy `/payments` route to `/orders`.
- Finalized bilingual support (**Bahasa Indonesia + English**) for the unified transaction experience.
- Upgraded project documentation with changelog and standardized release template.

## What Changed
### Added
- Unified transaction page architecture on `/orders`:
  - Orders tab
  - Payments tab
- New i18n namespace for unified page copy:
  - `ordersPageUnified.title`
  - `ordersPageUnified.subtitle`
  - `ordersPageUnified.tabs.orders`
  - `ordersPageUnified.tabs.payments`
- Professional documentation assets:
  - `docs/CHANGELOG.md`
  - `docs/RELEASE_TEMPLATE.md`

### Changed
- `/payments` now redirects to `/orders` for compatibility with existing links/bookmarks.
- Sidebar navigation simplified by removing duplicated Payments menu item.
- Unified page labels now consistently connected to locale dictionaries (`id`, `en`).
- README expanded with:
  - Unified Orders & Payments UX section
  - i18n section
  - release management section

### Fixed
- Consistency gap between unified UI copy and localization system.
- Potential user confusion from separate menu entries for related transaction modules.

## UX Impact
- **Affected routes/pages**:
  - `/orders` (major UX update)
  - `/payments` (redirect behavior)
- **Impacted roles**:
  - `admin`
  - `owner`

## i18n Impact
- New locale keys introduced under `ordersPageUnified.*` in:
  - `src/locales/id.json`
  - `src/locales/en.json`
- Existing locale namespaces reused:
  - `ordersPage.*`
  - `paymentsPage.*`
- Language validation target:
  - `id`
  - `en`

## API / Backend Contract Impact
- No backend endpoint contract changes.
- Existing endpoints remain active and consumed by unified frontend flow:
  - `GET /admin/orders`
  - `GET /admin/payments`
- Compatibility strategy:
  - frontend route redirect only (no API migration required)

## QA Checklist (Release Gate)
- [x] `npm run build` passed
- [x] Role matrix preserved (`admin` + `owner` shared internal scope)
- [x] Empty/loading/error states render correctly on unified tables
- [x] i18n keys resolved for `id` and `en`
- [x] Major CTA flows validated:
  - search & status filtering
  - open order detail
  - open payment detail

## Risks / Notes
- Unified page combines two previously separate contexts; future pagination strategy should be monitored if transaction volume grows significantly.
- Additional UI microcopy harmonization can still be done in future minor release for stronger tone consistency.

## Rollback Plan
- **Previous stable baseline**: commit before unified-page rollout.
- **Rollback steps**:
  1. Revert commits below in reverse order if needed.
  2. Restore separate `/payments` page routing and sidebar entry.
  3. Run `npm run build` and smoke test role-based access.

## Commits Included
- `9bd408e` — refactor(dashboard): unify orders and payments into single page
- `0360ffa` — feat(i18n): keep unified orders-payments page bilingual
- `293c72a` — docs(dashboard): professionalize unified orders-payments and i18n documentation
- `ac2aa2f` — docs(release): add changelog and professional release notes template
