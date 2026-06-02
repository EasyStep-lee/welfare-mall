# Product Pool Publish Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend APIs that publish approved products into a franchise product pool and expose a catalog query for pool items.

**Architecture:** Keep publishing inside the product-pool domain. A repository reads approved product master data, upserts an active franchise pool, upserts one pool item per SKU with display snapshots, and exposes active catalog rows. A service converts repository outcomes into HTTP errors, while the controller validates request/query shape.

**Tech Stack:** NestJS, Prisma Client, MySQL 8.4 via Docker Compose, Jest + Supertest.

---

## Files

- Create: `apps/api/src/product-pool/product-pool.repository.ts`
- Create: `apps/api/src/product-pool/product-pool.service.ts`
- Create: `apps/api/test/product-pool/product-pool-publish.e2e-spec.ts`
- Create: `apps/api/test/product-pool/product-pool.repository.spec.ts`
- Modify: `apps/api/src/product-pool/product-pool.controller.ts`
- Modify: `apps/api/src/product-pool/product-pool.module.ts`
- Modify: `apps/api/test/product-draft-save.db-test.ts`
- Modify: `packages/contracts/openapi/welfare-mall-api.openapi.json`
- Create: `docs/superpowers/plans/2026-06-02-product-pool-publish-catalog.md`

## API Contract

- `POST /api/product-pools/items/publish`
- Request body: `{ "productId": "product-001", "actorUserId": "admin-user-001" }`
- Success response includes `productPool`, `publishedItems`, and item display snapshots.
- Missing product returns 404.
- Product status other than `approved` returns 400.
- Product without SKU or main image returns 400.
- `GET /api/product-pools/catalog?franchiseId=franchise-001`
- Success response returns active product pools and their items.

## Tasks

### Task 1: RED API Contract

- [x] Add `apps/api/test/product-pool/product-pool-publish.e2e-spec.ts`.
- [x] Assert publish validates `productId` and `actorUserId`.
- [x] Assert publish calls service with `{ productId, actorUserId }` and returns `productPool` plus `publishedItems`.
- [x] Assert catalog passes optional `franchiseId` to service.
- [x] Assert missing product maps service `NotFoundException` to 404.
- [x] Run `pnpm --filter @welfare-mall/api run test -- product-pool-publish.e2e-spec.ts --runInBand`.
- [x] Expected result: fail because `ProductPoolService` and routes do not exist.

### Task 2: RED Repository Contract

- [x] Add `apps/api/test/product-pool/product-pool.repository.spec.ts`.
- [x] Assert approved product with SKU and main image upserts an active franchise pool and creates/updates pool items.
- [x] Assert non-approved product returns `not_approved` without writes.
- [x] Assert product without SKU returns `missing_sku`.
- [x] Assert product without main image returns `missing_main_image`.
- [x] Assert catalog returns active pools with ordered items.
- [x] Run `pnpm --filter @welfare-mall/api run test -- product-pool.repository.spec.ts --runInBand`.
- [x] Expected result: fail because `ProductPoolRepository` does not exist.

### Task 3: GREEN Implementation

- [x] Add `ProductPoolRepository.publishApprovedProduct`.
- [x] Add `ProductPoolRepository.listCatalog`.
- [x] Add `ProductPoolService.publishApprovedProduct` and `listCatalog`.
- [x] Wire repository and service into `ProductPoolModule`.
- [x] Add publish and catalog routes to `ProductPoolController`.
- [x] Run focused API and repository tests.
- [x] Expected result: both pass.

### Task 4: Real DB Verification

- [x] Extend `apps/api/test/product-draft-save.db-test.ts` after Admin approval to publish the approved product to a pool.
- [x] Assert a `product_pool` row exists with `status=active` and the product franchise.
- [x] Assert `product_pool_item` uses approved product SKU price and main image.
- [x] Assert `GET /api/product-pools/catalog?franchiseId=...` returns the published item.
- [x] Run `pnpm run verify:product-save-db`.
- [x] Expected result: pass against local MySQL.

### Task 5: Verification And Git

- [x] Run `pnpm run verify`.
- [x] Run `pnpm run verify:api`.
- [x] Run `pnpm run build`.
- [x] Run `git diff --check`.
- [x] Run implementation placeholder scan over touched production files.
- [ ] Commit, push, create PR, wait for GitHub Actions, mark ready, squash merge, sync `main`, and rerun `pnpm run verify` plus `pnpm run verify:product-save-db` on `main`.

## Acceptance Boundary

This slice proves approved product publishing into product pool and catalog query in API tests and local real MySQL. It does not implement Admin browser pages, merchant pages, portal display, true-device behavior, or target-environment acceptance.
