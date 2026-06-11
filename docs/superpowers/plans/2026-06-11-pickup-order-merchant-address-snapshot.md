# Pickup Order Merchant Address Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow pickup checkout orders to be created without a legacy pickup-store name so the active order path relies on the merchant fulfillment address snapshot.

**Architecture:** Keep the existing order API and database compatibility field `pickupStoreName`, but stop treating it as required input for pickup checkout. The repository already resolves `fulfillmentMerchantAddress` from product -> merchant facts; this slice only removes the controller/service validation that blocks pickup checkout before that snapshot can be produced.

**Tech Stack:** NestJS API, Jest e2e/service tests, Prisma-backed order repository, existing business-boundary guards.

**Business Constraints:** The platform has no core shop/store model. Merchant is the fulfillment party and has an actual address. Historical `pickupStoreName` remains compatibility data only; new pickup checkout must be valid without it, and self-pickup address display must come from `fulfillmentMerchantAddress`.

**Out of Scope:** Removing `pickupStoreName` from API schema or database, Portal checkout UI copy, creating merchant address management UI, and repairing historical orders that already have a null address snapshot.

---

### Task 1: RED Pickup Checkout Contract

**Files:**
- Modify: `apps/api/test/order/order-checkout.e2e-spec.ts`
- Modify: `apps/api/test/order/order-checkout.service.spec.ts`

- [x] **Step 1: Add API contract coverage for pickup without pickupStoreName**

Add an e2e test that posts `/api/orders` with `fulfillment: { type: 'pickup' }` and asserts the controller calls `OrderCheckoutService.createOrder` with `pickupStoreName: null`.

- [x] **Step 2: Add service coverage for pickup without pickupStoreName**

Add a service test that creates a pickup order without `pickupStoreName`, asserts amount preview runs, and asserts repository `createOrder` receives `fulfillmentType: 'pickup'`, receiver fields null, and `pickupStoreName: null`.

- [x] **Step 3: Verify RED**

Run the focused API tests and confirm they fail because controller/service still require `fulfillment.pickupStoreName` for pickup.

Evidence:
- `pnpm --filter @welfare-mall/api run test --runInBand --testPathPatterns=order-checkout.e2e-spec.ts --testNamePattern "pickup order without legacy pickup-store input"` failed with expected 201 but got 400.
- `pnpm --filter @welfare-mall/api run test --runInBand --testPathPatterns=order-checkout.service.spec.ts --testNamePattern "pickup order without legacy pickup-store input"` failed with `BadRequestException` from `assertCheckoutInput`.

### Task 2: GREEN Validation Alignment

**Files:**
- Modify: `apps/api/src/order/order.controller.ts`
- Modify: `apps/api/src/order/order-checkout.service.ts`

- [x] **Step 1: Remove controller pickupStoreName required validation**

Delete the `fulfillment.pickupStoreName is required for pickup.` branch from `assertOrderCheckoutRequest`.

- [x] **Step 2: Remove service pickupStoreName required validation**

Delete the same pickup-store required branch from `assertCheckoutInput`.

- [x] **Step 3: Keep compatibility normalization**

Leave `pickupStoreName: input.fulfillment.pickupStoreName?.trim() ?? null` in both controller and service mapping so old clients remain compatible.

Evidence:
- Focused API contract test passed after removing controller validation.
- Focused service test passed after removing service validation.

### Task 3: Verification

- [x] Run focused API checkout e2e/service tests.
- [x] Run API order checkout repository/service/e2e tests around snapshots.
- [x] Run business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker API if API behavior changes need runtime verification.
- [x] Verify live Docker API can create a pickup order without `pickupStoreName` and returns `fulfillmentMerchantAddress`.
- [x] Run Docker runtime/page smoke checks.

Evidence:
- Focused API e2e and service tests for `pickup order without legacy pickup-store input` passed.
- `pnpm --filter @welfare-mall/api run test --runInBand --testPathPatterns=order-checkout.e2e-spec.ts order-checkout.service.spec.ts order-checkout.repository.spec.ts order-read.repository.spec.ts order-fulfillment.repository.spec.ts order-payment.repository.spec.ts order-cancel.repository.spec.ts` passed: 7 files, 43 tests.
- `pnpm run verify:business-boundary` passed with 28 known deviation files tracked.
- `pnpm run verify` passed, including frontend stack boundary, business boundary, Prisma generate, lint, typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest.
- Docker API image was rebuilt and `welfare-mall-v2-api` restarted healthy on port 3000.
- Live Docker API created pickup order `ORDER-20260611105000455-5RFUXW` without `pickupStoreName`; the response had `pickupStoreName=null`, `salesFranchiseId=franchise-local-review`, `fulfillmentMerchantId=merchant-local-review`, and `fulfillmentMerchantAddress=Shanghai Pudong Local Runtime Road 88`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 4: Completion

- [ ] Commit feature work on `codex/pickup-order-merchant-address-snapshot`.
- [ ] Push branch and open PR.
- [ ] Wait for GitHub checks and merge.
- [ ] Create docs-only completion PR after feature merge.
