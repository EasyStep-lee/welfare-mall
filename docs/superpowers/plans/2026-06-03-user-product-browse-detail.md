# User Product Browse Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first User App product browsing slice: product pool list data and product detail data are consumed from backend APIs instead of fallback/static goods.

**Architecture:** Add a product-pool item detail API in the API domain, then scaffold a native WeChat mini program under `apps/user-miniprogram`. The mini program list page reads `GET /api/product-pools/catalog`; the detail page reads `GET /api/product-pools/items/:itemId`. Shared mini-program helpers live in `utils/` and have Node/Vitest coverage so the workspace can verify URL construction and money formatting without WeChat DevTools.

**Tech Stack:** NestJS, Prisma Client, Jest + Supertest, native WeChat mini program files, Vitest for helper tests.

---

## File Structure

- Modify: `apps/api/src/product-pool/product-pool.repository.ts`
- Modify: `apps/api/src/product-pool/product-pool.service.ts`
- Modify: `apps/api/src/product-pool/product-pool.controller.ts`
- Modify: `apps/api/test/product-pool/product-pool.repository.spec.ts`
- Modify: `apps/api/test/product-pool/product-pool-publish.e2e-spec.ts`
- Replace: `apps/user-miniprogram/.gitkeep`
- Create: `apps/user-miniprogram/package.json`
- Create: `apps/user-miniprogram/app.json`
- Create: `apps/user-miniprogram/app.js`
- Create: `apps/user-miniprogram/app.wxss`
- Create: `apps/user-miniprogram/pages/catalog/index.{js,json,wxml,wxss}`
- Create: `apps/user-miniprogram/pages/detail/index.{js,json,wxml,wxss}`
- Create: `apps/user-miniprogram/utils/api.js`
- Create: `apps/user-miniprogram/utils/format.js`
- Create: `apps/user-miniprogram/utils/*.test.js`
- Modify: root `package.json` to include user mini-program tests.

## Task 1: RED API Detail Contract

- [x] **Step 1: Add failing API contract tests**

Extend product-pool tests to assert:

- `GET /api/product-pools/items/pool-item-001` calls service with the pool item ID.
- response returns pool item snapshot, product code/name/origin, SKU, media, qualifications, parameters, and detail sections.
- missing item returns 404.

- [x] **Step 2: Run focused API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-pool --runInBand
```

Expected: FAIL before detail API exists.

## Task 2: GREEN API Detail Implementation

- [x] **Step 1: Implement repository/service/controller detail path**

Add:

- `ProductPoolRepository.getItemDetail(itemId)`
- `ProductPoolService.getItemDetail(itemId)`
- `GET /api/product-pools/items/:itemId`

- [x] **Step 2: Run focused API tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-pool --runInBand
```

Expected: PASS.

## Task 3: User Mini Program Contract

- [x] **Step 1: Add mini-program helper tests**

Create Vitest tests for:

- `apiUrl('/product-pools/catalog')`
- `productPoolItemDetailUrl('pool-item-001')`
- `formatMoney(6990)` -> `¥69.90`

- [x] **Step 2: Scaffold native mini-program list and detail pages**

Add pages that:

- list product pool items from `/product-pools/catalog`
- navigate to detail with `itemId`
- load detail from `/product-pools/items/:itemId`
- render product name, SKU, price, origin, media, qualification, parameters, and detail text

- [x] **Step 3: Run mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- --run
```

Expected: PASS.

## Task 4: Root Verification And Runtime

- [x] **Step 1: Include user mini-program tests in root scripts**

Add user mini-program test to root `test` and `verify`.

- [x] **Step 2: Run verification**

Run:

```powershell
pnpm run verify
pnpm run build
git diff --check
```

Expected: all pass; Windows LF/CRLF warnings are acceptable when exit code is 0.

- [x] **Step 3: Runtime API detail check**

Seed, approve, publish the local review product, then call catalog and detail.

Expected: detail response contains `本地审核五常大米福利装`, `SKU-LOCAL-REVIEW-5KG`, `净含量`, `产地证明`, and `福利说明`.

## Task 5: GitHub

- [x] **Step 1: Commit, push, PR, merge**

Commit on `codex/user-product-browse-detail`, push to GitHub, create a PR to `main`, merge after it is mergeable, and fast-forward local `main`.

## Acceptance Boundary

This slice proves API product-pool item detail and native mini-program source scaffolding with local automated tests. It does not prove WeChat DevTools compilation, true-device behavior, target-environment deployment, order placement, payment, inventory, or formal business acceptance.
