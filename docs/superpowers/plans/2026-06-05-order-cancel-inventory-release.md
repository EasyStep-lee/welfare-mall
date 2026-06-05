# Order Cancel Inventory Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for behavior changes and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a buyer cancel a pending-payment order and release checkout inventory reservations back to available stock.

**Architecture:** Add a focused order cancellation path under the order module. The API accepts `POST /api/orders/:orderNo/cancel` with buyer identity and reason, verifies the order belongs to that buyer and is still `pending_payment`, applies the existing user cancel transition, updates `OrderHeader` and `OrderState`, marks reserved `InventoryReservation` rows released, and restores `InventoryStock` balances in the same transaction.

**Tech Stack:** NestJS order module, Prisma transaction repository, Jest API tests, Docker local runtime smoke.

---

## File Structure

- Create `apps/api/src/order/order-cancel.repository.ts`
- Create `apps/api/src/order/order-cancel.service.ts`
- Modify `apps/api/src/order/order.module.ts`
- Modify `apps/api/src/order/order.controller.ts`
- Create `apps/api/test/order/order-cancel.repository.spec.ts`
- Create `apps/api/test/order/order-cancel.service.spec.ts`
- Modify `apps/api/test/order/order-read.e2e-spec.ts`
- Create `docs/superpowers/plans/2026-06-05-order-cancel-inventory-release.md`

## Tasks

### Task 1: RED API Tests

- [x] **Step 1: Add repository cancel and inventory release test**

Create `apps/api/test/order/order-cancel.repository.spec.ts` proving `cancelPendingPaymentOrder`:

- reads a buyer-scoped pending-payment order,
- updates `orderState` to `cancelled`,
- updates `orderHeader.status` to `cancelled`,
- marks reserved inventory rows `released`,
- restores each reservation quantity to `InventoryStock`,
- returns the cancelled order.

- [x] **Step 2: Add repository invalid state test**

Add a test proving paid or missing orders return `null` and do not release inventory.

- [x] **Step 3: Add service validation test**

Create `apps/api/test/order/order-cancel.service.spec.ts` proving blank `orderNo`, `buyerUserId`, and `reason` are rejected, and a valid request delegates trimmed values to the repository.

- [x] **Step 4: Add API contract test**

Extend `apps/api/test/order/order-read.e2e-spec.ts` with `POST /api/orders/:orderNo/cancel`, expecting buyer/reason validation and a cancelled order response.

- [x] **Step 5: Run focused RED tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-cancel.repository.spec.ts test/order/order-cancel.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand
```

Expected: FAIL because the cancel repository, service, and route do not exist yet.

### Task 2: Implementation

- [x] **Step 1: Implement cancel repository**

Add `OrderCancelRepository.cancelPendingPaymentOrder(input)` with a transaction that guards buyer ownership and `pending_payment` status, applies user cancel state transition, updates header/state, releases reservations, restores stock, and returns the updated order.

- [x] **Step 2: Implement cancel service**

Add `OrderCancelService.cancelOrder(input)` with input normalization, bad-request validation, and not-found/conflict handling for orders that cannot be cancelled.

- [x] **Step 3: Wire API route**

Register repository/service in `OrderModule`, inject service into `OrderController`, and add `POST /api/orders/:orderNo/cancel`.

### Task 3: Verification

- [x] **Step 1: Run focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-cancel.repository.spec.ts test/order/order-cancel.service.spec.ts test/order/order-read.e2e-spec.ts --runInBand
```

Expected: PASS.

- [x] **Step 2: Run full local verification**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

- [x] **Step 3: Run Docker order cancel smoke**

Run:

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then create a local order, cancel it, and confirm stock is restored and reservation rows are released.

## Boundaries

- This slice only handles explicit buyer cancellation for `pending_payment` orders.
- This slice does not add payment-time stock capture, payment timeout jobs, scheduled order close, Admin close action, or front-end cancel buttons.
- This slice does not perform target-environment deployment or true-device acceptance.
