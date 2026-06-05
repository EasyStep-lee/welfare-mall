# Inventory Reservation Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist order-line inventory reservation records when a payment callback first moves an order into paid state.

**Architecture:** Add an `InventoryReservation` Prisma model keyed by `orderLineId` so each paid order line can reserve stock exactly once. Reuse the existing paid-callback transaction in `OrderPaymentRepository`: after the order state reaches `paid`, create fulfillment tasks and inventory reservations together from the same order snapshot and product-to-merchant lookup. This slice stores reservation evidence only; it does not enforce stock availability, decrement sellable stock, release reservations, expose inventory UI, or create settlement records.

**Tech Stack:** Prisma schema, NestJS order payment repository, Jest repository tests, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/prisma/schema.prisma`
- Modify `apps/api/src/order/order-payment.repository.ts`
- Modify `apps/api/test/order/order-payment.repository.spec.ts`
- Create `docs/superpowers/plans/2026-06-05-inventory-reservation-foundation.md`

## Tasks

### Task 1: RED Tests

- [ ] **Step 1: Add failing inventory-reservation repository test**

Add a test to `apps/api/test/order/order-payment.repository.spec.ts` proving a first successful paid callback creates one inventory reservation per order line with:

- `orderNo`
- `orderLineId`
- `productId`
- `skuId`
- `merchantId`
- `quantity`
- `status: "reserved"`
- `source: "order_paid"`

The same test should keep the existing fulfillment-task assertion intact.

- [ ] **Step 2: Add duplicate callback guard expectation**

Extend the duplicate-callback test to assert `tx.inventoryReservation.createMany` is not called when the provider event is already present.

- [ ] **Step 3: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts --runInBand
```

Expected: FAIL because the transaction mock has no `inventoryReservation` client call and the repository does not create reservations yet.

### Task 2: Implementation

- [ ] **Step 1: Add reservation schema**

Add an `InventoryReservation` model to `apps/api/prisma/schema.prisma` with unique `orderLineId`, indexed `orderNo`, `merchantId`, `productId`, `skuId`, and `status`.

- [ ] **Step 2: Write reservations from paid callback**

Extend `OrderPaymentTransaction` with `inventoryReservation.createMany`. In the paid-callback flow, after merchant grouping is known, create reservation rows for all order lines that resolved to a merchant. Use `skipDuplicates: true` and the unique `orderLineId` key for idempotency.

### Task 3: Verification

- [ ] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment.repository.spec.ts --runInBand
```

Expected: PASS.

- [ ] **Step 2: Run local verification gates**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
git diff --check
```

Expected: PASS.

- [ ] **Step 3: Run live DB smoke**

In the Docker-backed local runtime, create and pay an order, then query MySQL to confirm `inventory_reservation` has at least one `reserved` row for that order.
