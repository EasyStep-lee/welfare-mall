# Inventory Stock Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce local checkout stock availability and keep stock balances in sync with reservations and refund release.

**Architecture:** Add a compact `InventoryStock` table keyed by `stockKey = productId:skuId-or-default`. Order checkout creates the order and order lines in one transaction, then decrements available stock, increments reserved stock, and writes `InventoryReservation` rows for those lines; if any line lacks enough available stock, the transaction fails and the service returns a checkout conflict. Refund success releases reservation rows and restores stock balances for the released quantities.

**Tech Stack:** NestJS order module, Prisma schema/client, Jest API tests, local Docker runtime smoke.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`
- Modify `apps/api/src/order/order-checkout.repository.ts`
- Modify `apps/api/src/order/order-checkout.service.ts`
- Modify `apps/api/src/order/order-refund.repository.ts`
- Modify `apps/api/src/dev/seed-local-review-product.ts`
- Modify `apps/api/test/order/order-checkout.repository.spec.ts`
- Modify `apps/api/test/order/order-checkout.service.spec.ts`
- Modify `apps/api/test/order/order-refund.repository.spec.ts`
- Modify `apps/api/test/dev/seed-local-review-product.spec.ts`
- Create `docs/superpowers/plans/2026-06-05-inventory-stock-gate.md`

## Tasks

### Task 1: RED Checkout Stock Tests

- [ ] **Step 1: Add repository stock reservation test**

Extend `apps/api/test/order/order-checkout.repository.spec.ts` with a test proving `createOrder`:

- reads product merchants for the created order lines,
- conditionally updates `inventoryStock` with `availableQuantity >= quantity`,
- decrements `availableQuantity`,
- increments `reservedQuantity`,
- writes `InventoryReservation` rows with `source: "order_checkout"`.

- [ ] **Step 2: Add repository insufficient stock test**

Extend `apps/api/test/order/order-checkout.repository.spec.ts` with a test proving `createOrder` throws `InsufficientInventoryError` when any conditional stock update returns `{ count: 0 }`.

- [ ] **Step 3: Add service conflict mapping test**

Extend `apps/api/test/order/order-checkout.service.spec.ts` with a test proving `InsufficientInventoryError` is mapped to `ConflictException` and the message includes `insufficient inventory`.

- [ ] **Step 4: Run focused RED checkout tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-checkout.repository.spec.ts test/order/order-checkout.service.spec.ts --runInBand
```

Expected: FAIL because the repository has no `InventoryStock` client calls, no checkout reservation creation, and the service does not map `InsufficientInventoryError`.

### Task 2: RED Refund Stock Release Tests

- [ ] **Step 1: Add refund stock restore test**

Extend `apps/api/test/order/order-refund.repository.spec.ts` so the first succeeded callback test expects the transaction to:

- read reserved inventory rows for the order,
- mark those rows released,
- increment `availableQuantity`,
- decrement `reservedQuantity`.

- [ ] **Step 2: Preserve duplicate and failed callback no-op expectations**

Keep duplicate and failed callback tests asserting no stock mutation happens.

- [ ] **Step 3: Run focused RED refund tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand
```

Expected: FAIL because refund success currently only updates reservation rows and does not restore stock balances.

### Task 3: RED Local Seed Stock Test

- [ ] **Step 1: Add seed stock expectation**

Extend `apps/api/test/dev/seed-local-review-product.spec.ts` so the local review seed creates deterministic SKU id `sku-local-review-5kg` and upserts stock for `product-local-review:sku-local-review-5kg` with a positive available balance and zero reserved balance.

- [ ] **Step 2: Run focused RED seed test**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/dev/seed-local-review-product.spec.ts --runInBand
```

Expected: FAIL because the seed transaction has no `inventoryStock.upsert`.

### Task 4: Implementation

- [ ] **Step 1: Add `InventoryStock` schema**

Add an `InventoryStock` Prisma model with `stockKey`, `productId`, `skuId`, `merchantId`, `availableQuantity`, `reservedQuantity`, timestamps, and indexes for product, sku, merchant.

- [ ] **Step 2: Implement checkout stock reservation**

Update `OrderCheckoutRepository.createOrder` to reserve stock in the existing transaction after order creation. Use a conditional `inventoryStock.updateMany` for each order line and throw `InsufficientInventoryError` if the count is not `1`. Create `InventoryReservation` rows using the returned order line IDs and `source: "order_checkout"`.

- [ ] **Step 3: Map checkout stock conflict**

Update `OrderCheckoutService.createOrder` to catch `InsufficientInventoryError` from the repository and throw `ConflictException`.

- [ ] **Step 4: Restore stock on refund release**

Update `OrderRefundRepository.processCallback` to read reserved rows before releasing them and restore each row's quantity to `InventoryStock`.

- [ ] **Step 5: Seed local stock**

Update the local review product seed so Docker order-flow smoke has available stock for the local published product item.

### Task 5: Verification

- [ ] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-checkout.repository.spec.ts test/order/order-checkout.service.spec.ts test/order/order-refund.repository.spec.ts test/dev/seed-local-review-product.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

- [ ] **Step 3: Run Docker runtime and order flow smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm --filter @welfare-mall/api run seed:local-review-product
Invoke-RestMethod 'http://localhost:3000/api/products/product-local-review/review-decisions' -Method Post -ContentType 'application/json' -Body '{"action":"approve","actorUserId":"admin-user-001"}'
Invoke-RestMethod 'http://localhost:3000/api/product-pools/items/publish' -Method Post -ContentType 'application/json' -Body '{"productId":"product-local-review","actorUserId":"admin-user-001"}'
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
pnpm run docker:order-flow-smoke
```

Expected: PASS.

- [ ] **Step 4: Run live DB smoke**

Query Docker MySQL for the local review stock row and confirm `availableQuantity` decreased and `reservedQuantity` increased after the order-flow smoke.

## Boundaries

- This slice enforces local checkout stock for product-pool order creation.
- This slice does not add Admin stock editing UI.
- This slice does not implement payment-time stock capture for external payment success when checkout did not reserve stock.
- This slice does not add payment timeout release, cancellation release, warehouse locations, batch/lot accounting, or target-environment deployment.
