# Product Domain Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first product-domain foundation so product master data, SKU/specs, media, qualifications, parameters, origin, detail images, and product-pool contracts are stable before Admin and Merchant pages are added.

**Architecture:** This branch adds product-domain catalogs, pure summary builders, Prisma model shells, API read endpoints, and OpenAPI contract tests. Product master data is the source of truth for product name, SKU, price, media, qualification, and detail data; product pools may reference and snapshot product data but must not become the source of truth.

**Tech Stack:** NestJS, TypeScript, Prisma, Jest, OpenAPI, pnpm workspace.

---

## Scope

Included:

- Product master-data catalogs:
  - `GET /api/products/statuses`
  - `GET /api/products/sale-statuses`
  - `GET /api/products/media-types`
  - `GET /api/products/qualification-types`
  - `GET /api/products/parameter-value-types`
  - `GET /api/product-pools/statuses`
- Pure builders:
  - `buildProductSummary()`
  - `buildSkuSummary()`
  - `buildProductPoolItemSnapshot()`
- Prisma model shell:
  - `ProductCategory`
  - `ProductBrand`
  - `ProductSpecTemplate`
  - `ProductSpecAttribute`
  - `ProductSpecValue`
  - `Product`
  - `ProductSku`
  - `ProductMedia`
  - `ProductQualification`
  - `ProductParameter`
  - `ProductDetailSection`
  - `ProductPool`
  - `ProductPoolItem`
  - `ProductPoolSnapshot`
- OpenAPI regeneration and contract checks.

Not included:

- Product create/update APIs.
- Admin product audit pages.
- Merchant product publish pages.
- Inventory account and stock ledger.
- Product migration from the old system.
- Decoration editing of product name, price, main image, or SKU.

## Data Rules

- Product master data owns product name, category, brand, merchant, franchise, status, sale status, and origin.
- SKU owns price fields, barcode, spec combination, weight, and volume.
- Product media owns main image, gallery image, detail image, and video references with explicit usage and sort order.
- Product qualifications are first-class records, not hidden strings.
- Product parameters are first-class records with value type and sort order.
- Product details are ordered sections; detail images must be represented explicitly.
- Product pool items reference product/SKU and may carry display snapshots, but they do not overwrite master data.

## File Structure

Create:

- `apps/api/src/product/product-status.ts`
- `apps/api/src/product/product-sale-status.ts`
- `apps/api/src/product/product-media-type.ts`
- `apps/api/src/product/product-qualification-type.ts`
- `apps/api/src/product/product-parameter-value-type.ts`
- `apps/api/src/product/product-summary.ts`
- `apps/api/src/product/sku-summary.ts`
- `apps/api/src/product/product.controller.ts`
- `apps/api/src/product/product.module.ts`
- `apps/api/src/product-pool/product-pool-status.ts`
- `apps/api/src/product-pool/product-pool-snapshot.ts`
- `apps/api/src/product-pool/product-pool.controller.ts`
- `apps/api/src/product-pool/product-pool.module.ts`
- `apps/api/test/product/product-catalogs.spec.ts`
- `apps/api/test/product/product-summary.spec.ts`
- `apps/api/test/product/sku-summary.spec.ts`
- `apps/api/test/product-pool/product-pool-snapshot.spec.ts`
- `apps/api/test/product-domain.e2e-spec.ts`

Modify:

- `apps/api/src/app.module.ts`
- `apps/api/prisma/schema.prisma`
- `packages/contracts/openapi/welfare-mall-api.openapi.json`
- `docs/superpowers/plans/2026-06-02-product-domain-foundation.md`

## Task 1: Baseline and Branch

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
## codex/product-domain-foundation
codex/product-domain-foundation
```

- [x] **Step 2: Run baseline verification**

Run:

```powershell
pnpm run verify
```

Expected: command exits 0 before product-domain changes.

## Task 2: Product Catalogs

**Files:**

- Create: `apps/api/test/product/product-catalogs.spec.ts`
- Create: `apps/api/src/product/product-status.ts`
- Create: `apps/api/src/product/product-sale-status.ts`
- Create: `apps/api/src/product/product-media-type.ts`
- Create: `apps/api/src/product/product-qualification-type.ts`
- Create: `apps/api/src/product/product-parameter-value-type.ts`
- Create: `apps/api/src/product/product.controller.ts`
- Create: `apps/api/src/product/product.module.ts`

- [x] **Step 1: Write failing product catalog tests**

Create tests proving:

```text
ProductStatusCatalog includes draft, pending_review, approved, rejected, archived
ProductSaleStatusCatalog includes on_sale and off_sale
ProductMediaTypeCatalog includes main_image, gallery_image, detail_image, video
ProductQualificationTypeCatalog includes food_license, brand_authorization, origin_certificate, inspection_report, service_license
ProductParameterValueTypeCatalog includes text, number, boolean, date
```

- [x] **Step 2: Run tests to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product
```

Expected: FAIL because product catalog modules do not exist.

- [x] **Step 3: Add product catalog modules and controller**

Create the catalog constants and `ProductController` endpoints.

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product
```

Expected: product catalog tests pass.

## Task 3: Product and SKU Summary Builders

**Files:**

- Create: `apps/api/test/product/product-summary.spec.ts`
- Create: `apps/api/test/product/sku-summary.spec.ts`
- Create: `apps/api/src/product/product-summary.ts`
- Create: `apps/api/src/product/sku-summary.ts`

- [x] **Step 1: Write failing product summary test**

Create a test proving `buildProductSummary()` returns id, code, name, merchantId, franchiseId, categoryName, brandName, origin, mainImageUrl, status, and saleStatus.

- [x] **Step 2: Write failing SKU summary test**

Create a test proving `buildSkuSummary()` returns sku id, product id, code, price, market price, specs, barcode, weight grams, and volume milliliters.

- [x] **Step 3: Run tests to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product
```

Expected: FAIL because summary builders do not exist.

- [x] **Step 4: Add summary builders**

Create pure functions with no database dependency.

- [x] **Step 5: Run tests to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product
```

Expected: product and SKU summary tests pass.

## Task 4: Product Pool Catalog and Snapshot

**Files:**

- Create: `apps/api/test/product-pool/product-pool-snapshot.spec.ts`
- Create: `apps/api/src/product-pool/product-pool-status.ts`
- Create: `apps/api/src/product-pool/product-pool-snapshot.ts`
- Create: `apps/api/src/product-pool/product-pool.controller.ts`
- Create: `apps/api/src/product-pool/product-pool.module.ts`

- [x] **Step 1: Write failing product-pool snapshot test**

Create a test proving `buildProductPoolItemSnapshot()` copies product name, SKU code, price, and main image into a display snapshot while retaining productId and skuId references.

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-pool
```

Expected: FAIL because product-pool modules do not exist.

- [x] **Step 3: Add product-pool catalog and snapshot builder**

Create status codes:

```text
draft
active
paused
archived
```

- [x] **Step 4: Run test to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-pool
```

Expected: product-pool snapshot test passes.

## Task 5: App Module, E2E, and Prisma Shell

**Files:**

- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/test/product-domain.e2e-spec.ts`

- [x] **Step 1: Register modules**

Register:

```text
ProductModule
ProductPoolModule
```

- [x] **Step 2: Add e2e test**

Create e2e tests proving every new catalog endpoint returns 200 and contains its primary code.

- [x] **Step 3: Add Prisma models**

Add product-domain model shells listed in this plan.

Rules:

- `Product` belongs to one `Merchant` and one `Franchise`.
- `ProductSku` belongs to one `Product`.
- `ProductMedia`, `ProductQualification`, `ProductParameter`, and `ProductDetailSection` belong to one `Product`.
- `ProductPoolItem` references `Product` and may reference `ProductSku`.
- Product pool snapshots preserve display state but do not become product truth.

- [x] **Step 4: Validate Prisma**

Run:

```powershell
pnpm --filter @welfare-mall/api run prisma:validate
```

Expected: schema is valid.

## Task 6: OpenAPI, Verification, PR

**Files:**

- All files in this plan.

- [x] **Step 1: Regenerate OpenAPI**

Run:

```powershell
pnpm run openapi:generate
```

Expected: OpenAPI includes all new product and product-pool catalog paths.

- [x] **Step 2: Full verification**

Run:

```powershell
pnpm run verify:api
pnpm run build
pnpm run verify
```

Expected: all commands exit 0.

- [x] **Step 3: Runtime smoke**

Run compiled API on a temporary port and request:

```text
GET /api/products/statuses
GET /api/products/sale-statuses
GET /api/products/media-types
GET /api/products/qualification-types
GET /api/products/parameter-value-types
GET /api/product-pools/statuses
```

Expected: each response includes the primary catalog code.

- [x] **Step 4: Commit and push**

Run:

```powershell
git add apps/api packages/contracts docs/superpowers/plans/2026-06-02-product-domain-foundation.md
git commit -m "feat: add product domain foundation"
git push -u origin codex/product-domain-foundation
```

Expected: branch is pushed and ready for a draft PR.

## Self-Review

Spec coverage:

- Product master data includes SKU, specs, media, qualifications, parameters, origin, and detail sections.
- Product pool has references and snapshots but does not replace product master data.
- Admin and Merchant UI are intentionally deferred.

Placeholder scan:

- This plan avoids unresolved placeholder markers.

Type consistency:

- Status codes use lower snake case.
- API paths use plural domain nouns.
- Money fields use integer cents.

## Execution Evidence

- Baseline: `pnpm run verify` exited 0 on `codex/product-domain-foundation` before product implementation.
- RED: `pnpm --filter @welfare-mall/api run test -- product product-pool` failed before implementation because product modules were missing and the new catalog endpoints returned 404.
- GREEN: `pnpm --filter @welfare-mall/api run test -- product product-pool` passed with 5 suites and 14 tests.
- Contract: `pnpm run openapi:generate` regenerated `packages/contracts/openapi/welfare-mall-api.openapi.json`; the contract includes all six new product-domain catalog paths.
- Verification: `pnpm run verify:api`, `pnpm run build`, and `pnpm run verify` exited 0.
- Runtime smoke: compiled API on port 3103 returned expected codes for product statuses, sale statuses, media types, qualification types, parameter value types, and product-pool statuses.
