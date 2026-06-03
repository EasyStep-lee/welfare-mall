# Admin Order Refund Callback Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each behavior change and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Admin order management confirm a processing refund through the existing refund callback API so local source-level refund flows can move from `refund_processing` into refunded state.

**Architecture:** Keep backend refund behavior unchanged and consume the existing `POST /api/orders/refunds/callbacks` contract. Add an Admin API client method and render `确认退款成功` only when an order has a processing latest refund. The action sends deterministic Admin provider refund data, reloads the order list, and surfaces the confirmed refund number.

**Tech Stack:** React Admin app, existing NestJS order refund callback API, Vitest.

---

## File Structure

- Modify `apps/admin/src/api.ts`: add refund callback input/response types and client method.
- Modify `apps/admin/src/App.tsx`: add processing-refund action and success reload flow.
- Modify `apps/admin/src/App.test.tsx`: prove callback payload, success message, and refreshed refunded display.

## Tasks

### Task 1: Admin Processing Refund Callback Action

- [x] **Step 1: Write failing Admin UI test**

Extend `apps/admin/src/App.test.tsx` so a `refund_processing` order with a processing latest refund displays `确认退款成功`. Clicking it must call `/orders/refunds/callbacks` with:

- `providerEventId`
- `refundNo`
- `providerRefundNo`
- `status: "succeeded"`
- `succeededAt`
- `payload.source: "admin-order-management"`

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: FAIL because the Admin refund callback client and action do not exist.

- [x] **Step 2: Implement Admin callback action**

Add the API client, render the action only for orders with a processing latest refund, call the callback API, show success, and reload orders.

- [x] **Step 3: Re-run Admin focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- --run
```

Expected: PASS.

### Task 2: Refund API Regression Coverage

- [x] **Step 1: Run existing refund API focused tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund --runInBand
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
git add docs/superpowers/plans/2026-06-03-admin-order-refund-callback-action.md apps/admin
git commit -m "feat: add admin order refund callback action"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/admin-order-refund-callback-action
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves a local source-level Admin action can submit a succeeded refund callback through the existing API contract and refresh order management into refunded state. It does not implement real provider refund submission, provider webhook delivery, actual funds movement, online channel execution, franchise settlement, Docker/browser runtime rendering, target-environment deployment, true-device behavior, or formal business acceptance.
