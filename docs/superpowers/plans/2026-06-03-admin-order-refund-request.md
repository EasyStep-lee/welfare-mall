# Admin Order Refund Request Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each behavior change and superpowers:verification-before-completion before claiming completion.

**Goal:** Let Admin create a full refund request from a paid order in the order management panel.

**Architecture:** Reuse the existing `POST /api/orders/refunds` backend contract. The Admin web app adds a compact action on paid orders with a paid latest payment. The action sends a full-amount refund request using the latest payment number/channel, reason `after_sale`, and a generated request ID. On success, show the refund number and refresh the order list. This slice does not implement refund approval, partial refund editing, provider callback simulation, actual funds movement, settlement, RBAC, or refund history display.

**Tech Stack:** React Admin app, existing NestJS order refund API, Vitest.

---

## File Structure

- Modify `apps/admin/src/api.ts`: add refund request types and client.
- Modify `apps/admin/src/App.tsx`: add refund action for paid orders and refresh order list after success.
- Modify `apps/admin/src/App.test.tsx`: prove request payload, success message, and refreshed order status.
- Modify `apps/admin/src/styles.css`: add order action row styling if needed.

## Tasks

### Task 1: Admin Refund Client and UI

- [x] **Step 1: Write failing Admin UI test**

Extend `apps/admin/src/App.test.tsx` to click `申请退款` on a paid order and assert:

- `POST http://localhost:3000/api/orders/refunds`
- body includes `paymentNo`, `orderNo`, `channel`, `refundAmount`, `reason: "after_sale"`, and generated `requestId`
- success message shows the refund number
- order list refreshes and displays `退款处理中`

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: FAIL because the Admin refund client and button do not exist.

- [x] **Step 2: Implement Admin refund request behavior**

Add the API client, render `申请退款` only for orders with `status === "paid"` and a latest payment, call the refund API, show success, and reload orders.

- [x] **Step 3: Re-run Admin tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: PASS.

### Task 2: Verification

- [x] **Step 1: Run focused Admin and order refund tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
pnpm --filter @welfare-mall/api run test -- test/order/order-refund --runInBand
```

- [x] **Step 2: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 3: GitHub Integration

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-admin-order-refund-request.md apps/admin
git commit -m "feat: add admin order refund request action"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/admin-order-refund-request
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local source-level Admin full refund request initiation against the existing refund API contract. It does not prove refund approval, partial refund editing, provider callback processing, actual funds movement, online channel execution, franchise settlement, RBAC, refund history display, Docker/browser runtime rendering, target-environment deployment, true-device behavior, or formal business acceptance.
