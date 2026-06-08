# Portal Merchant Fulfillment Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe Portal checkout fulfillment around merchant ownership instead of store ownership. Product detail should expose the fulfillment merchant, and pickup checkout wording should say merchant pickup rather than store pickup.

**Architecture:** Keep Portal on Vue 3 + Vite and reuse the existing product-pool detail plus checkout API. Add merchant context to the product-pool item detail read model from the product master record. Keep the existing `pickupStoreName` checkout payload only as a backend compatibility/local display field; do not introduce a store model, store selector, or shop/store as a core subject.

**Tech Stack:** NestJS, Prisma, Vue 3, Vite, Vitest, Jest, Docker Compose.

---

### Task 1: RED/GREEN Merchant Context

**Files:**
- Modify: `apps/api/test/product-pool/product-pool.repository.spec.ts`
- Modify: `apps/api/src/product-pool/product-pool.repository.ts`
- Modify: `apps/portal/src/App.test.ts`
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Write failing API and Portal tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/product-pool/product-pool.repository.spec.ts --runInBand
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because product-pool item detail does not expose `merchantId`, and Portal still renders pickup checkout as store pickup.

Evidence:
- RED API: `pnpm --filter @welfare-mall/api run test -- test/product-pool/product-pool.repository.spec.ts --runInBand` failed because product-pool item detail did not return `product.merchantId`.
- RED Portal: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed because product detail did not render `履约商户`, and the pickup mode control still used `选择门店自提履约方式`.

- [x] **Step 2: Add merchant context to product-pool detail**

Select `merchantId` from the product master row and return it as `product.merchantId` in the item detail contract.

- [x] **Step 3: Render merchant fulfillment context in Portal**

Show `履约商户 <merchantId>` on product detail. Change pickup mode UI and checkout summary from store pickup to merchant pickup while keeping the existing checkout payload shape.

- [x] **Step 4: Re-run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/product-pool/product-pool.repository.spec.ts --runInBand
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- GREEN API: `pnpm --filter @welfare-mall/api run test -- test/product-pool/product-pool.repository.spec.ts --runInBand` passed with 8/8 tests.
- GREEN Portal: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 17/17 tests.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

### Task 2: Verification

- [x] **Step 1: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed, including frontend stack boundary, Prisma generate, lint, typecheck, API Jest 63/63 suites, Admin Vitest 21/21 tests, Merchant Vitest 15/15 tests, Portal Vitest 17/17 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` passed with only Windows LF/CRLF working-copy warnings.

- [x] **Step 2: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- API `GET /api/product-pools/items/pool-item-local-review` returns `product.merchantId`.
- Served `http://localhost:5175/assets/...` bundle contains `履约商户` and `商户自提`.
- Browser on `http://localhost:5175` shows merchant fulfillment context on product detail and does not show `门店自提` in the checkout controls.

Evidence:
- `pnpm run docker:runtime:up` rebuilt and restarted the API/Admin/Merchant/Portal runtime; Portal built `dist/assets/index-iN_8z9Xa.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Live catalog item detail `GET /api/product-pools/items/cmq0l27u80005ol1tsyl2nija` returned `product.merchantId = merchant-local-review`.
- Served `http://localhost:5175/assets/index-iN_8z9Xa.js` contained `履约商户` and `商户自提`, and did not contain `门店自提`.
- Browser on `http://localhost:5175/` showed `履约商户`, `merchant-local-review`, and exactly one `选择商户自提履约方式` button, with no `门店自提` text.

### Task 3: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: show portal merchant fulfillment context
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Portal source/runtime behavior for merchant-centered fulfillment context. It does not add dynamic buyer login, merchant selection, store modeling, editable pickup locations, payment provider integration, target-environment deployment, true-device checks, or formal business acceptance.
