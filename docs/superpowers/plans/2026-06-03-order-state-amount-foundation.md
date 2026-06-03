# Order State Amount Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first order-domain backend foundation: order status catalog, allowed state transitions, and product-pool-based amount preview.

**Architecture:** Keep this slice read-only and contract-first. The API exposes order status metadata and an amount preview endpoint that calculates from `ProductPoolItem.displayPriceAmount`, so client-submitted prices are never trusted.

**Tech Stack:** NestJS 11, Prisma Client, Jest, Supertest, TypeScript.

---

## File Structure

- Create `apps/api/src/order/order-status.ts`: order status catalog and status/action type constants.
- Create `apps/api/src/order/order-status-transition.ts`: pure transition function used by future command handlers.
- Create `apps/api/src/order/order-amount.repository.ts`: reads active product pool item snapshots needed for amount preview.
- Create `apps/api/src/order/order-amount.service.ts`: validates quantities and computes line/total amounts.
- Create `apps/api/src/order/order.controller.ts`: exposes `/api/orders/statuses`, `/api/orders/status-transitions`, and `/api/orders/amount-preview`.
- Create `apps/api/src/order/order.module.ts`: wires controller, service, repository, Prisma.
- Modify `apps/api/src/app.module.ts`: import `OrderModule`.
- Test `apps/api/test/order/order-status-transition.spec.ts`: state machine contract.
- Test `apps/api/test/order/order-amount.service.spec.ts`: quantity, missing item, and amount calculation.
- Test `apps/api/test/order/order-amount-preview.e2e-spec.ts`: HTTP contract and validation.

## Tasks

### Task 1: Order Status State Machine

**Files:**
- Create: `apps/api/src/order/order-status.ts`
- Create: `apps/api/src/order/order-status-transition.ts`
- Test: `apps/api/test/order/order-status-transition.spec.ts`

- [x] **Step 1: Write the failing state transition tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-status-transition.spec.ts --runInBand`

Expected: FAIL because `../../src/order/order-status-transition` does not exist.

- [x] **Step 2: Implement status catalog and pure transition function**

Implement statuses `draft`, `pending_payment`, `paid`, `cancelled`, `closed`, `completed` and actions `submit`, `pay`, `cancel`, `close`, `complete`.

- [x] **Step 3: Re-run the focused state transition tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-status-transition.spec.ts --runInBand`

Expected: PASS.

### Task 2: Amount Preview Domain Service

**Files:**
- Create: `apps/api/src/order/order-amount.repository.ts`
- Create: `apps/api/src/order/order-amount.service.ts`
- Test: `apps/api/test/order/order-amount.service.spec.ts`

- [x] **Step 1: Write failing amount service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-amount.service.spec.ts --runInBand`

Expected: FAIL because `OrderAmountService` does not exist.

- [x] **Step 2: Implement repository and service**

The service must reject empty carts, invalid quantities, and missing product pool items. It must compute `lineTotalAmount = unitPriceAmount * quantity`, `subtotalAmount`, `totalAmount`, `welfareCardPayableAmount = 0`, and `cashPayableAmount = totalAmount`.

- [x] **Step 3: Re-run amount service tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-amount.service.spec.ts --runInBand`

Expected: PASS.

### Task 3: HTTP Contract

**Files:**
- Create: `apps/api/src/order/order.controller.ts`
- Create: `apps/api/src/order/order.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/test/order/order-amount-preview.e2e-spec.ts`

- [x] **Step 1: Write failing HTTP contract tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-amount-preview.e2e-spec.ts --runInBand`

Expected: FAIL because `/api/orders/amount-preview` is not registered.

- [x] **Step 2: Implement controller and module wiring**

Expose `GET /api/orders/statuses`, `GET /api/orders/status-transitions`, and `POST /api/orders/amount-preview`.

- [x] **Step 3: Re-run HTTP contract tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order/order-amount-preview.e2e-spec.ts --runInBand`

Expected: PASS.

### Task 4: Full Verification

**Files:**
- Verify all changed files.

- [x] **Step 1: Run focused order tests**

Run: `pnpm --filter @welfare-mall/api run test -- test/order --runInBand`

Expected: PASS.

- [x] **Step 2: Run full repository gate**

Run: `pnpm run verify`

Expected: PASS.

- [x] **Step 3: Run local runtime API proof**

Start API on port `3000`, seed/publish a local approved product if needed, and call `POST /api/orders/amount-preview` with a real product pool item ID.

Expected: response contains line totals and `cashPayableAmount` derived from `displayPriceAmount`.

### Task 5: GitHub Integration

**Files:**
- Commit all changed files.

- [x] **Step 1: Commit the slice**

Run: `git add docs/superpowers/plans/2026-06-03-order-state-amount-foundation.md apps/api/src/order apps/api/src/app.module.ts apps/api/test/order`

Run: `git commit -m "feat: add order amount preview foundation"`

- [x] **Step 2: Push and open a draft PR**

Run: `git push -u origin codex/order-state-amount-foundation`

Expected: branch is pushed and a draft PR is created against `main`.

Result: PR #29 was opened, marked ready after verification, and squash-merged into `main` as `b90e722`.
