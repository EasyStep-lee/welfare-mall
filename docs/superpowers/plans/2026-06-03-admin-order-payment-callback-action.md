# Admin Order Payment Callback Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each behavior change and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Admin order management confirm a pending payment through the existing payment callback API so local source-level order flows can move from pending payment into paid state for downstream fulfillment work.

**Architecture:** Keep backend payment behavior unchanged and consume the existing `POST /api/orders/payments/callbacks` contract. Add a small Admin API client method and render `确认支付成功` only when an order is `pending_payment` with a pending latest payment. The action sends a deterministic Admin provider payment number, reloads the order list, and surfaces the confirmed payment number.

**Tech Stack:** React Admin app, existing NestJS order payment callback API, Vitest.

---

## File Structure

- Modify `apps/admin/src/api.ts`: add payment callback input/response types and client method.
- Modify `apps/admin/src/App.tsx`: add pending-payment action and success reload flow.
- Modify `apps/admin/src/App.test.tsx`: prove callback payload, success message, and refreshed paid display.

## Tasks

### Task 1: Admin Pending Payment Callback Action

- [x] **Step 1: Write failing Admin UI test**

Extend `apps/admin/src/App.test.tsx` so a pending-payment order with a pending latest payment displays `确认支付成功`. Clicking it must call `/orders/payments/callbacks` with:

- `providerEventId`
- `paymentNo`
- `providerPaymentNo`
- `status: "paid"`
- `paidAt`
- `payload.source: "admin-order-management"`

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: FAIL because the Admin payment callback client and action do not exist.

- [x] **Step 2: Implement Admin callback action**

Add the API client, render the action only for pending-payment orders with pending latest payments, call the callback API, show success, and reload orders.

- [x] **Step 3: Re-run Admin focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: PASS.

### Task 2: Payment API Regression Coverage

- [x] **Step 1: Run existing payment API focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-payment --runInBand
```

Expected: PASS with the existing backend callback contract unchanged.

### Task 3: Verification

- [x] **Step 1: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-admin-order-payment-callback-action.md apps/admin
git commit -m "feat: add admin order payment callback action"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/admin-order-payment-callback-action
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves a local source-level Admin action can submit a paid payment callback through the existing API contract and refresh order management into paid state. It does not implement real WeChat or Alipay prepay, `wx.requestPayment`, provider webhook delivery, actual funds movement, online channel execution, franchise settlement, Docker/browser runtime rendering, target-environment deployment, true-device behavior, or formal business acceptance.
