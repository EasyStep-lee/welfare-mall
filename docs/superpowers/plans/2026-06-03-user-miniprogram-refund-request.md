# User Mini-Program Refund Request Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each behavior change and superpowers:verification-before-completion before claiming completion. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users request a full after-sale refund from a paid order detail page in the user mini program.

**Architecture:** Reuse the existing `POST /api/orders/refunds` backend contract. Add small mini-program API and refund helpers, then wire the order detail page to submit a full-order refund request from the latest paid payment. On success, store the returned refund, show the refund number/status, and update the local order display to `refund_processing`.

**Tech Stack:** Native WeChat mini program files, CommonJS helpers, Vitest, existing NestJS order refund API.

---

## File Structure

- Modify `apps/user-miniprogram/utils/api.js`: add `orderRefundUrl()`.
- Modify `apps/user-miniprogram/utils/api.test.mjs`: cover the refund URL helper.
- Create `apps/user-miniprogram/utils/refund.js`: build refund payloads, request IDs, eligibility, and display data.
- Create `apps/user-miniprogram/utils/refund.test.mjs`: cover refund helper behavior.
- Modify `apps/user-miniprogram/pages/order-detail/index.js`: add refund submit state and action.
- Modify `apps/user-miniprogram/pages/order-detail/index.wxml`: render refund action/result for paid orders.
- Modify `apps/user-miniprogram/pages/order-detail/index.wxss`: add compact refund action styles.
- Modify `apps/user-miniprogram/pages/order-detail/index.test.mjs`: prove refund creation request and returned refund display.

## Tasks

### Task 1: Refund Helper Contract

- [x] **Step 1: Write failing helper tests**

Extend `apps/user-miniprogram/utils/api.test.mjs` and create `apps/user-miniprogram/utils/refund.test.mjs`.

Assertions:

- `orderRefundUrl()` returns `http://localhost:3000/api/orders/refunds`.
- `canRequestRefund(order)` is true only for `status === "paid"` with `latestPayment.status === "paid"`.
- `buildRefundPayload()` maps the latest payment to `paymentNo`, `channel`, `orderNo`, `refundAmount`, `reason: "after_sale"`, and a request ID.
- `createRefundRequestId()` sanitizes order numbers with the `mini-refund-` prefix.
- `toRefundDisplay()` maps `processing` to `退款处理中`.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs utils/refund.test.mjs --run
```

Expected: FAIL because the refund helper files and URL helper do not exist.

- [x] **Step 2: Implement refund helpers**

Add `orderRefundUrl(baseUrl)` to `utils/api.js`. Add `canRequestRefund`, `buildRefundPayload`, `createRefundRequestId`, and `toRefundDisplay` to `utils/refund.js`.

- [x] **Step 3: Re-run helper tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs utils/refund.test.mjs --run
```

Expected: PASS.

### Task 2: Order Detail Refund Action

- [x] **Step 1: Write failing page test**

Extend `apps/user-miniprogram/pages/order-detail/index.test.mjs` with a paid order case:

- after order detail loads, `submitRefund()` posts to `/orders/refunds`.
- payload includes `paymentNo`, `orderNo`, `channel`, `refundAmount`, `reason: "after_sale"`, and generated request ID.
- returned refund is stored in `refund` and display state is stored in `refundDisplay`.
- local order status becomes `refund_processing` and display status becomes `退款处理中`.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/order-detail/index.test.mjs --run
```

Expected: FAIL because the page refund action does not exist.

- [x] **Step 2: Implement page behavior and markup**

In `pages/order-detail/index.js`, import the refund helpers and add:

- `requestingRefund`
- `refund`
- `refundDisplay`
- `refundError`
- `canRequestRefund`

Add `submitRefund()` to call `requestJson('/orders/refunds', { method: 'POST', data })`.

Render a refund button for eligible paid orders and a refund result block after successful creation.

- [x] **Step 3: Re-run page tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/order-detail/index.test.mjs --run
```

Expected: PASS.

### Task 3: Verification

- [x] **Step 1: Run focused user mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs utils/refund.test.mjs pages/order-detail/index.test.mjs --run
```

- [x] **Step 2: Run focused API refund tests**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-refund --runInBand
```

- [x] **Step 3: Run full repository gate**

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
git add docs/superpowers/plans/2026-06-03-user-miniprogram-refund-request.md apps/user-miniprogram
git commit -m "feat: add user mini-program refund request action"
```

- [ ] **Step 2: Push and open PR**

Run:

```powershell
git push -u origin codex/user-miniprogram-refund-request
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local mini-program source-level full after-sale refund request initiation against the existing refund API contract. It does not prove refund approval, partial refund editing, provider callback processing, actual funds movement, online channel execution, franchise settlement, WeChat DevTools compilation, true-device behavior, target-environment deployment, or formal business acceptance.
