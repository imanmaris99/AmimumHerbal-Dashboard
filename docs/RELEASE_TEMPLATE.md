# Release Notes Template

Use this template for every dashboard release.

---

## Release Summary
- **Version**: `vX.Y.Z`
- **Date (UTC)**: `YYYY-MM-DD`
- **Type**: `Feature | Improvement | Fix | Docs`
- **Scope**: `Dashboard Internal`

## Highlights
- 
- 
- 

## What Changed
### Added
- 

### Changed
- 

### Fixed
- 

### Removed
- 

## UX Impact
- Affected pages/routes:
  - 
- User roles impacted:
  - `admin`
  - `owner`

## i18n Impact
- New locale keys:
  - 
- Updated locale keys:
  - 
- Supported languages validated:
  - `id`
  - `en`

## API / Backend Contract Impact
- Endpoint changes:
  - 
- Payload/response contract notes:
  - 
- Backward compatibility:
  - 

## QA Checklist
- [ ] `npm run build` passed
- [ ] Route guard and role matrix validated
- [ ] Empty/loading/error states validated
- [ ] i18n rendering validated for `id` and `en`
- [ ] Major CTA flows tested (view detail, filter, search)

## Risks / Notes
- 

## Rollback Plan
- Previous stable commit/tag:
- Rollback steps:
  1. 
  2. 

## Commits Included
- 
- 
- 

---

### Quick Copy Version

```md
## Release Summary
- Version: vX.Y.Z
- Date (UTC): YYYY-MM-DD
- Type: Feature/Improvement/Fix/Docs

## Highlights
- ...

## What Changed
### Added
- ...

### Changed
- ...

### Fixed
- ...

## QA
- build: pass/fail
- i18n (id/en): pass/fail
- role matrix: pass/fail

## Commits
- ...
```
