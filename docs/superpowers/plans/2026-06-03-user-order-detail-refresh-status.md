# User Order Detail Refresh Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each behavior change and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user mini program refresh an order detail after payment or fulfillment state changes, and display completed orders with a business label.

**Architecture:** Keep backend order read behavior unchanged. Add a small order-detail refresh action that reloads the current order number through the existing buyer detail API, updates display data, and recalculates refund eligibility. Extend user order display helpers so `completed` renders as `已完成` in both list and detail views.

**Tech Stack:** Native WeChat mini program page logic, CommonJS display helpers, Vitest.

---

## File Structure

- Modify `apps/user-miniprogram/utils/order.js`: add `completed` status label.
- Modify `apps/user-miniprogram/utils/order.test.mjs`: prove completed summary/detail status formatting.
- Modify `apps/user-miniprogram/pages/order-detail/index.js`: add refresh state and action.
- Modify `apps/user-miniprogram/pages/order-detail/index.wxml`: render a refresh button on loaded order details.
- Modify `apps/user-miniprogram/pages/order-detail/index.test.mjs`: prove refresh reloads and updates paid display.

## Tasks

### Task 1: Completed Status Display

- [x] **Step 1: Write failing helper test**

Extend order helper tests so an order with `status: "completed"` displays `已完成`.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/order.test.mjs --run
```

Expected: FAIL because completed status falls back to the raw status string.

- [x] **Step 2: Implement status label**

Add `completed: "已完成"` to the user order status map.

- [x] **Step 3: Re-run helper test**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/order.test.mjs --run
```

Expected: PASS.

### Task 2: Detail Refresh Action

- [x] **Step 1: Write failing page test**

Extend the order-detail page test so a loaded pending order can call `refreshOrderDetail()`, issue a second detail GET request, and update `orderDisplay` from the refreshed paid response.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/order-detail/index.test.mjs --run
```

Expected: FAIL because the refresh action does not exist.

- [x] **Step 2: Implement refresh behavior and markup**

Add `refreshingOrder` state, `refreshOrderDetail()`, and a compact `刷新订单状态` button that reuses `loadOrderDetail(order.orderNo)`.

- [x] **Step 3: Re-run page test**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/order-detail/index.test.mjs --run
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused user mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/order.test.mjs pages/order-detail/index.test.mjs --run
```

- [x] **Step 2: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-user-order-detail-refresh-status.md apps/user-miniprogram
git commit -m "feat: refresh user order detail status"
```

- [x] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/user-order-detail-refresh-status
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local source-level user mini-program order detail refresh and completed-status display against the existing order read API. It does not implement real payment provider polling, `wx.requestPayment`, push notifications, logistics tracking, Docker/browser runtime rendering, WeChat DevTools compilation, true-device behavior, target-environment deployment, or formal business acceptance.
