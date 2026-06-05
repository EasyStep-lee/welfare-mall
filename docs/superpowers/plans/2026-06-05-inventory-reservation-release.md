# Inventory Reservation Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release reserved inventory reservation rows when a refund callback first succeeds for an order.

**Architecture:** Reuse the existing refund callback transaction in `OrderRefundRepository`. When a callback first moves a refund into `succeeded`, update all `reserved` reservations for the refund order to `released` and stamp `releasedAt`; duplicate callbacks and failed callbacks must not mutate reservation rows.

**Tech Stack:** NestJS order refund repository, Prisma transaction client, Jest repository tests, Docker local runtime smoke.

---

## File Structure

- Modify `apps/api/src/order/order-refund.repository.ts`
- Modify `apps/api/test/order/order-refund.repository.spec.ts`
- Create `docs/superpowers/plans/2026-06-05-inventory-reservation-release.md`

## Tasks

### Task 1: RED Tests

- [x] **Step 1: Add successful refund release expectation**

In `apps/api/test/order/order-refund.repository.spec.ts`, extend the first successful refund callback test so it expects:

```ts
expect(tx.inventoryReservation.updateMany).toHaveBeenCalledWith({
  where: {
    orderNo: 'ORDER-20260603-001',
    status: 'reserved'
  },
  data: {
    status: 'released',
    releasedAt: new Date('2026-06-03T00:15:00.000Z')
  }
});
```

- [x] **Step 2: Add duplicate callback guard expectation**

Extend the duplicate callback test so it asserts:

```ts
expect(tx.inventoryReservation.updateMany).not.toHaveBeenCalled();
```

- [x] **Step 3: Add failed callback guard expectation**

Extend the failed refund callback test so it asserts:

```ts
expect(tx.inventoryReservation.updateMany).not.toHaveBeenCalled();
```

- [x] **Step 4: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand
```

Expected: FAIL because `OrderRefundRepository` does not call `inventoryReservation.updateMany` yet.

### Task 2: Implementation

- [x] **Step 1: Extend the refund transaction type**

Add `inventoryReservation.updateMany(args: unknown): Promise<unknown>` to the `OrderRefundTransaction` type in `apps/api/src/order/order-refund.repository.ts`.

- [x] **Step 2: Release reservations on first successful refund**

Inside the existing succeeded-callback branch in `updateRefundFromCallback`, after the order state/header transition and before returning the updated refund record, call:

```ts
await tx.inventoryReservation.updateMany({
  where: {
    orderNo: refund.orderNo,
    status: 'reserved'
  },
  data: {
    status: 'released',
    releasedAt: input.succeededAt
  }
});
```

The existing early duplicate-callback branch must remain before this code, so duplicate provider events do not release again.

### Task 3: Verification

- [x] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand
```

Expected: PASS.

- [x] **Step 2: Run local verification gates**

Run:

```powershell
pnpm run verify
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
git diff --check
```

Expected: PASS.

- [x] **Step 3: Run live DB smoke**

In the Docker-backed local runtime, create and pay an order, create a refund, process a succeeded refund callback, then query MySQL to confirm `inventory_reservation` rows for that order have `status=released` and a non-null `releasedAt`.

## Completion Evidence

- Focused RED test failed before implementation because `tx.inventoryReservation.updateMany` had zero calls.
- Focused GREEN test passed: `pnpm --filter @welfare-mall/api run test -- test/order/order-refund.repository.spec.ts --runInBand`.
- Full verification passed: `pnpm run verify` with API 54 suites / 200 tests, Admin 10 tests, Merchant 6 tests, Portal 2 tests, and user mini-program 29 tests.
- Docker runtime passed: `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke`.
- Diff hygiene passed: `git diff --check`.
- Live DB smoke confirmed `ORDER-20260605042942663-XLGJXT` has an `inventory_reservation` row with `status=released` and non-null `releasedAt`.
- Merged implementation PR: #127, squash commit `b0ea2fa`.

## Boundaries

- This slice does not decrement sellable stock.
- This slice does not implement partial line-level refund allocation.
- This slice does not expose reservation status in Admin/Merchant/Portal UI.
- This slice does not implement settlement or supplier payable changes.
