# Franchise Merchant Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first franchise, merchant, and region foundation so later product, product-pool, order, settlement, and data-scope features have stable business subjects.

**Architecture:** This branch introduces pure domain catalogs and API read endpoints before write workflows. Prisma receives the franchise, merchant, and region model shell. The implementation deliberately does not reintroduce shop/store as a core subject.

**Tech Stack:** NestJS, TypeScript, Prisma, Jest, OpenAPI, pnpm workspace.

---

## Scope

Included:

- Franchise status catalog.
- Merchant status catalog.
- Region level catalog.
- Pure subject summary builders for franchise and merchant.
- API endpoints:
  - `GET /api/franchises/statuses`
  - `GET /api/merchants/statuses`
  - `GET /api/regions/levels`
- Prisma model shell for `Franchise`, `Merchant`, and `Region`.
- OpenAPI regeneration.

Not included:

- Merchant login.
- Franchise login.
- Admin CRUD pages.
- Product publishing.
- Settlement.
- Store or shop as core subject.
- Data migration from the old system.

## File Structure

Create:

- `apps/api/src/franchise/franchise-status.ts`
- `apps/api/src/franchise/franchise-summary.ts`
- `apps/api/src/franchise/franchise.controller.ts`
- `apps/api/src/franchise/franchise.module.ts`
- `apps/api/src/merchant/merchant-status.ts`
- `apps/api/src/merchant/merchant-summary.ts`
- `apps/api/src/merchant/merchant.controller.ts`
- `apps/api/src/merchant/merchant.module.ts`
- `apps/api/src/region/region-level.ts`
- `apps/api/src/region/region.controller.ts`
- `apps/api/src/region/region.module.ts`
- `apps/api/test/franchise/franchise-summary.spec.ts`
- `apps/api/test/merchant/merchant-summary.spec.ts`
- `apps/api/test/region/region-level.spec.ts`
- `apps/api/test/franchise-merchant-region.e2e-spec.ts`

Modify:

- `apps/api/src/app.module.ts`
- `apps/api/prisma/schema.prisma`
- `packages/contracts/openapi/welfare-mall-api.openapi.json`
- `docs/superpowers/plans/2026-06-02-franchise-merchant-foundation.md`

## Task 1: Baseline Verification

**Files:**
- Read: `apps/api/src/app.module.ts`
- Read: `apps/api/prisma/schema.prisma`

- [x] **Step 1: Confirm branch**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected:

```text
## codex/franchise-merchant-foundation
codex/franchise-merchant-foundation
```

- [x] **Step 2: Run current API checks**

Run:

```powershell
pnpm run verify:api
pnpm run build
```

Expected: both commands exit 0 before subject changes.

## Task 2: Franchise Foundation

**Files:**
- Create: `apps/api/src/franchise/franchise-status.ts`
- Create: `apps/api/src/franchise/franchise-summary.ts`
- Create: `apps/api/src/franchise/franchise.controller.ts`
- Create: `apps/api/src/franchise/franchise.module.ts`
- Create: `apps/api/test/franchise/franchise-summary.spec.ts`

- [x] **Step 1: Write failing franchise summary test**

Create `apps/api/test/franchise/franchise-summary.spec.ts` proving an active franchise summary contains id, code, name, region code, and status.

- [x] **Step 2: Add franchise status catalog**

Create status codes:

```text
active
suspended
archived
```

- [x] **Step 3: Add franchise summary builder**

Create a pure `buildFranchiseSummary()` function.

- [x] **Step 4: Add franchise status endpoint**

Create `GET /api/franchises/statuses` returning the status catalog.

## Task 3: Merchant Foundation

**Files:**
- Create: `apps/api/src/merchant/merchant-status.ts`
- Create: `apps/api/src/merchant/merchant-summary.ts`
- Create: `apps/api/src/merchant/merchant.controller.ts`
- Create: `apps/api/src/merchant/merchant.module.ts`
- Create: `apps/api/test/merchant/merchant-summary.spec.ts`

- [x] **Step 1: Write failing merchant summary test**

Create `apps/api/test/merchant/merchant-summary.spec.ts` proving merchant summary contains id, code, name, franchise id, business scope labels, and status.

- [x] **Step 2: Add merchant status catalog**

Create status codes:

```text
pending_review
active
suspended
archived
```

- [x] **Step 3: Add merchant summary builder**

Create a pure `buildMerchantSummary()` function.

- [x] **Step 4: Add merchant status endpoint**

Create `GET /api/merchants/statuses` returning the status catalog.

## Task 4: Region Foundation

**Files:**
- Create: `apps/api/src/region/region-level.ts`
- Create: `apps/api/src/region/region.controller.ts`
- Create: `apps/api/src/region/region.module.ts`
- Create: `apps/api/test/region/region-level.spec.ts`

- [x] **Step 1: Write failing region level test**

Create `apps/api/test/region/region-level.spec.ts` proving the catalog includes province, city, district, and town.

- [x] **Step 2: Add region level catalog**

Create level codes:

```text
province
city
district
town
```

- [x] **Step 3: Add region level endpoint**

Create `GET /api/regions/levels` returning the level catalog.

## Task 5: App Module, E2E, and Prisma Shell

**Files:**
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/test/franchise-merchant-region.e2e-spec.ts`

- [x] **Step 1: Register modules**

Register:

```text
FranchiseModule
MerchantModule
RegionModule
```

- [x] **Step 2: Add e2e test**

Create e2e test proving all three catalog endpoints return 200 and contain their primary codes.

- [x] **Step 3: Add Prisma models**

Add:

- `Region`
- `Franchise`
- `Merchant`

Rules:

- `Merchant` belongs to one `Franchise`.
- `Franchise` can reference a `Region`.
- `Merchant` can reference a `Region`.
- Core relation uses franchise and merchant, not shop.
- Business scopes may use JSON only as non-core descriptive metadata.

- [x] **Step 4: Validate Prisma**

Run:

```powershell
pnpm --filter @welfare-mall/api run prisma:validate
```

Expected: schema is valid.

## Task 6: OpenAPI, Verification, PR

**Files:**
- All files in this plan

- [x] **Step 1: Regenerate OpenAPI**

Run:

```powershell
pnpm run openapi:generate
```

Expected: OpenAPI includes `/api/franchises/statuses`, `/api/merchants/statuses`, and `/api/regions/levels`.

- [x] **Step 2: Full verification**

Run:

```powershell
pnpm run verify:api
pnpm run build
pnpm run verify
```

Expected: all commands exit 0.

- [x] **Step 3: Runtime smoke**

Run the built API on a temporary port and request:

```text
GET /api/franchises/statuses
GET /api/merchants/statuses
GET /api/regions/levels
```

Expected: each response includes the primary catalog code.

- [x] **Step 4: Commit and push**

Run:

```powershell
git status -sb
git add apps/api packages/contracts docs/superpowers/plans/2026-06-02-franchise-merchant-foundation.md
git commit -m "feat: add franchise merchant foundation"
git push -u origin codex/franchise-merchant-foundation
```

Expected: branch is pushed and ready for a draft PR.

## Self-Review

Spec coverage:

- Subject foundation follows the rewrite rule that merchant and franchise are core subjects.
- No shop or store model is introduced.
- Catalog endpoints provide stable OpenAPI contract before Admin and Merchant UI are added.

Placeholder scan:

- This plan avoids unresolved placeholder markers.

Type consistency:

- Endpoint paths use plural domain nouns.
- Status codes use lower snake case.
- Region levels use stable geographic level names.

## Execution Evidence

- RED: `pnpm --filter @welfare-mall/api run test -- franchise merchant region` failed before implementation because the new domain modules were missing and the three endpoints returned 404.
- GREEN: `pnpm --filter @welfare-mall/api run test -- franchise merchant region` passed with 4 suites and 6 tests.
- Contract: `pnpm run openapi:generate` regenerated `packages/contracts/openapi/welfare-mall-api.openapi.json`; the contract includes `/api/franchises/statuses`, `/api/merchants/statuses`, and `/api/regions/levels`.
- Verification: `pnpm run verify:api`, `pnpm run build`, and `pnpm run verify` exited 0.
- Runtime smoke: compiled API on port 3102 returned `active,suspended,archived`, `pending_review,active,suspended,archived`, and `province,city,district,town`.
