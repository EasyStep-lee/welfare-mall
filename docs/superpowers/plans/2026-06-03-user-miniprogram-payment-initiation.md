# User Mini Program Payment Initiation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user mini program initiate a payment order from an existing pending-payment order detail page.

**Architecture:** Keep backend payment behavior unchanged and consume the existing `POST /api/orders/payments` contract. Add mini-program URL and pure payment payload helpers, then wire the order detail page to submit a WeChat-channel payment request using the order snapshot amounts. Store and display the returned payment order; do not call `wx.requestPayment` until the backend returns provider prepay parameters in a later slice.

**Tech Stack:** Native WeChat mini program files, CommonJS helpers, Vitest, existing NestJS order payment API.

---

## File Structure

- Modify `apps/user-miniprogram/utils/api.js`: add `orderPaymentUrl(baseUrl)`.
- Modify `apps/user-miniprogram/utils/api.test.mjs`: cover the payment URL helper.
- Create `apps/user-miniprogram/utils/payment.js`: build payment payloads, request IDs, and display data.
- Create `apps/user-miniprogram/utils/payment.test.mjs`: cover payment payload and display helpers.
- Modify `apps/user-miniprogram/pages/order-detail/index.js`: add payment submit state and action.
- Modify `apps/user-miniprogram/pages/order-detail/index.wxml`: render payment action/result under pending-payment order details.
- Modify `apps/user-miniprogram/pages/order-detail/index.wxss`: add compact payment action styles.
- Modify `apps/user-miniprogram/pages/order-detail/index.test.mjs`: prove payment creation request and returned payment display.

## Tasks

### Task 1: Mini Program Payment Helpers

**Files:**
- Modify: `apps/user-miniprogram/utils/api.js`
- Modify: `apps/user-miniprogram/utils/api.test.mjs`
- Create: `apps/user-miniprogram/utils/payment.js`
- Create: `apps/user-miniprogram/utils/payment.test.mjs`

- [ ] **Step 1: Write failing helper tests**

Add tests proving:

- `orderPaymentUrl()` returns `http://localhost:3000/api/orders/payments`.
- `buildPaymentPayload({ requestId, order, channel: 'wechat' })` maps order number and split amounts.
- `createPaymentRequestId('ORDER 001', now)` returns a stable encoded local request ID.
- `toPaymentDisplay(payment)` maps `pending` to `待支付` and formats payment number/channel.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs utils/payment.test.mjs --run
```

Expected: FAIL because the helper exports do not exist.

- [ ] **Step 2: Implement payment helpers**

Add `orderPaymentUrl(baseUrl)` to `utils/api.js`. Add `buildPaymentPayload`, `createPaymentRequestId`, and `toPaymentDisplay` to `utils/payment.js`.

- [ ] **Step 3: Re-run helper tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs utils/payment.test.mjs --run
```

Expected: PASS.

### Task 2: Order Detail Payment Action

**Files:**
- Modify: `apps/user-miniprogram/pages/order-detail/index.js`
- Modify: `apps/user-miniprogram/pages/order-detail/index.wxml`
- Modify: `apps/user-miniprogram/pages/order-detail/index.wxss`
- Modify: `apps/user-miniprogram/pages/order-detail/index.test.mjs`

- [ ] **Step 1: Write failing page-flow test**

Extend the order detail page test to assert:

- after order detail loads, `submitPayment()` posts to `/orders/payments`.
- the request uses `channel: 'wechat'`, the current order number, total amount, welfare-card payable amount, and cash payable amount.
- returned payment is stored in `payment` and display state is stored in `paymentDisplay`.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/order-detail/index.test.mjs --run
```

Expected: FAIL because the page payment action does not exist.

- [ ] **Step 2: Implement payment page behavior and markup**

Add page data fields:

- `creatingPayment`
- `payment`
- `paymentDisplay`
- `paymentError`

Add `submitPayment()` to call `requestJson('/orders/payments', { method: 'POST', data })`.

Render a payment button for pending-payment orders and a payment result block after successful creation.

- [ ] **Step 3: Re-run page-flow test**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/order-detail/index.test.mjs --run
```

Expected: PASS.

### Task 3: Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run focused mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- --run
```

Expected: PASS.

- [ ] **Step 2: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 4: GitHub Integration

**Files:**
- Commit all changed files.

- [ ] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-user-miniprogram-payment-initiation.md apps/user-miniprogram
git commit -m "feat: initiate user mini-program payments"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/user-miniprogram-payment-initiation
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local mini-program source-level payment-order initiation against the existing API contract. It does not prove WeChat provider prepay creation, `wx.requestPayment`, payment callback processing, true-device behavior, target-environment deployment, actual funds movement, franchise settlement, or formal business acceptance.
