# User Mini Program Checkout Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the native user mini program create an order from the product detail page using the existing order amount preview and checkout APIs.

**Architecture:** Keep this slice on the user mini-program side. Add small API helper functions for `POST /api/orders/amount-preview` and `POST /api/orders`, add pure checkout helpers for payload construction and total display, then wire the existing product detail page to quantity, welfare-card amount, delivery fields, preview, and submit state. The API contract is already covered by order-domain tests, so this branch only adds mini-program helper and page-flow coverage.

**Tech Stack:** Native WeChat mini program files, CommonJS helpers, Vitest, existing NestJS order APIs.

---

## File Structure

- Modify `apps/user-miniprogram/utils/api.js`: add checkout URL helpers and JSON POST support wrappers.
- Modify `apps/user-miniprogram/utils/api.test.mjs`: cover order amount preview and checkout URL builders.
- Create `apps/user-miniprogram/utils/checkout.js`: pure helper for checkout payload creation, default request ID generation, and preview display state.
- Create `apps/user-miniprogram/utils/checkout.test.mjs`: cover the checkout payload and display helpers.
- Modify `apps/user-miniprogram/pages/detail/index.js`: wire quantity, welfare-card amount, receiver fields, amount preview, and order submit.
- Modify `apps/user-miniprogram/pages/detail/index.wxml`: render checkout controls and order result under the detail data.
- Modify `apps/user-miniprogram/pages/detail/index.wxss`: add compact checkout form styles.
- Create `apps/user-miniprogram/pages/detail/index.test.mjs`: page-flow unit tests with a mocked `Page`, `wx.request`, and helper state.

## Tasks

### Task 1: Checkout API Helpers

**Files:**
- Modify: `apps/user-miniprogram/utils/api.js`
- Modify: `apps/user-miniprogram/utils/api.test.mjs`

- [x] **Step 1: Write failing API helper tests**

Add assertions that:

```javascript
expect(orderAmountPreviewUrl('https://api.example.com/api/')).toBe(
  'https://api.example.com/api/orders/amount-preview'
);
expect(orderCheckoutUrl()).toBe('http://localhost:3000/api/orders');
```

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs --run
```

Expected: FAIL because the helper functions are not exported.

- [x] **Step 2: Implement helper exports**

Add `orderAmountPreviewUrl(baseUrl)` and `orderCheckoutUrl(baseUrl)` using the existing `apiUrl` function.

- [x] **Step 3: Re-run API helper tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/api.test.mjs --run
```

Expected: PASS.

### Task 2: Pure Checkout Payload Helpers

**Files:**
- Create: `apps/user-miniprogram/utils/checkout.js`
- Create: `apps/user-miniprogram/utils/checkout.test.mjs`

- [x] **Step 1: Write failing checkout helper tests**

Cover:

- `buildAmountPreviewPayload({ itemId: 'pool-item-001', quantity: 2, welfareCardPaymentAmount: 5000 })`
- `buildCheckoutPayload(...)` with delivery receiver fields and generated `requestId`
- `toPreviewDisplay({ totalAmount: 13980, welfareCardPayableAmount: 5000, cashPayableAmount: 8980 })`

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/checkout.test.mjs --run
```

Expected: FAIL because `utils/checkout.js` does not exist.

- [x] **Step 2: Implement pure checkout helpers**

Implement:

- `buildAmountPreviewPayload(input)`
- `buildCheckoutPayload(input)`
- `createCheckoutRequestId(itemId, now)`
- `toPreviewDisplay(preview)`

Use integer fen values only. Default fulfillment type is `delivery`.

- [x] **Step 3: Re-run checkout helper tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- utils/checkout.test.mjs --run
```

Expected: PASS.

### Task 3: Product Detail Checkout Page Flow

**Files:**
- Modify: `apps/user-miniprogram/pages/detail/index.js`
- Modify: `apps/user-miniprogram/pages/detail/index.wxml`
- Modify: `apps/user-miniprogram/pages/detail/index.wxss`
- Create: `apps/user-miniprogram/pages/detail/index.test.mjs`

- [x] **Step 1: Write failing page-flow tests**

Mock `Page`, `getApp`, and `wx.request`. Assert the page:

- loads product detail.
- calls `/orders/amount-preview` when quantity changes.
- calls `/orders` with buyer, item, welfare amount, and delivery fields when submitting.
- stores returned `orderNo` and `pending_payment` status.

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/detail/index.test.mjs --run
```

Expected: FAIL because checkout page behavior does not exist.

- [x] **Step 2: Implement page checkout behavior and markup**

Add page data fields:

- `quantity`
- `welfareCardPaymentAmount`
- `receiverName`
- `receiverPhone`
- `receiverAddress`
- `amountPreview`
- `previewText`
- `creatingOrder`
- `createdOrder`
- `checkoutError`

Add methods:

- `onQuantityInput`
- `onWelfareAmountInput`
- `onReceiverNameInput`
- `onReceiverPhoneInput`
- `onReceiverAddressInput`
- `refreshAmountPreview`
- `submitOrder`

Use fixed `buyerUserId = 'local-user-001'` for the current no-login mini-program slice.

- [x] **Step 3: Re-run page-flow tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- pages/detail/index.test.mjs --run
```

Expected: PASS.

### Task 4: Verification

**Files:**
- Verify all changed files.

- [x] **Step 1: Run focused mini-program tests**

Run:

```powershell
pnpm --filter @welfare-mall/user-miniprogram run test -- --run
```

Expected: PASS.

- [x] **Step 2: Run full repository gate**

Run:

```powershell
pnpm run verify
git diff --check
```

Expected: PASS.

### Task 5: GitHub Integration

**Files:**
- Commit all changed files.

- [x] **Step 1: Commit the slice**

Run:

```powershell
git add docs/superpowers/plans/2026-06-03-user-miniprogram-checkout-flow.md apps/user-miniprogram
git commit -m "feat: connect user mini-program checkout flow"
```

- [x] **Step 2: Push and open a draft PR**

Run:

```powershell
git push -u origin codex/user-miniprogram-checkout-flow
```

Expected: branch is pushed and a PR targets `main`.

## Acceptance Boundary

This slice proves local source-level user mini-program checkout behavior with automated tests against the existing order API contract. It does not prove WeChat DevTools compilation, true-device checkout, payment provider invocation, order list/detail pages, merchant fulfillment, target-environment deployment, or formal business acceptance.
