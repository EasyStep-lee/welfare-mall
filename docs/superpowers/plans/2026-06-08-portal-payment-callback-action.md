# Portal Payment Callback Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a local Portal user confirm a pending latest payment as paid from the order detail page.

**Architecture:** Keep Portal on Vue 3 + Vite and reuse the existing `POST /api/orders/payments/callbacks` API that already drives payment/order status transitions. This slice adds a local-only confirmation action for a persisted pending payment, then refreshes order list/detail reads so the UI reflects the paid state from the API. It does not add real provider prepay, external webhooks, polling, refunds, merchant fulfillment, Admin changes, target-environment deployment, true-device checks, or formal acceptance.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Payment Callback Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Add a persisted pending-payment callback fixture**

Create fixtures for:
- a pending latest payment returned from order reads
- the callback response returned by `POST /api/orders/payments/callbacks`
- refreshed order list/detail reads with order status `paid` and latest payment status `paid`

- [x] **Step 2: Assert the local confirmation action posts callback data and refreshes reads**

Add a test that:
- loads an order with latest payment `PAY-20260607-LATEST`
- opens order detail
- clicks `确认支付成功`
- asserts the callback body includes `paymentNo`, `providerEventId`, `providerPaymentNo`, `status: 'paid'`, `paidAt`, and `payload.source: 'portal-local-payment'`
- asserts the UI shows `支付已确认`, `已支付`, and `PAY-20260607-LATEST`

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because Portal does not yet expose the local payment confirmation action or callback API client.

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed 1/9 because the detail page did not contain `button[aria-label="确认支付单 PAY-20260607-LATEST 支付成功"]`.
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed 9/9 after implementation.

### Task 2: Implement Portal Local Payment Confirmation

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add a typed Portal payment callback API client**

Add `PortalPaymentCallbackInput`, `PortalPaymentCallbackResponse`, and `confirmPortalPayment(input)` in `apps/portal/src/api.ts`. The client posts JSON to `/orders/payments/callbacks` and throws on non-OK responses.

- [x] **Step 2: Add local confirmation state and helpers**

In `apps/portal/src/App.vue`, add loading/error/success state for confirmation. Add helpers that only enable the action when `selectedOrder.status === 'pending_payment'` and `selectedOrder.latestPayment.status === 'pending'`.

- [x] **Step 3: Submit the callback and refresh API reads**

Implement `confirmLatestPayment()` to call `confirmPortalPayment()` with local event/provider identifiers, `status: 'paid'`, and current `paidAt`. After success, reload local orders and re-fetch the selected order detail by order number and local buyer ID.

- [x] **Step 4: Render the detail action and result states**

Render a `确认支付成功` button inside the persisted latest-payment block, plus scoped loading, error, and success messages. Add CSS for the success message.

### Task 3: Verification

- [x] **Step 1: Run focused Portal tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed 9/9.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed with API, Admin, Merchant, Portal, and User mini-program suites.
- `git diff --check` passed with only Windows line-ending warnings.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- source contains the callback client and confirmation action
- served `http://localhost:5175/assets/...` bundle contains `确认支付成功`, `支付已确认`, `payments/callbacks`, and `portal-local-payment`
- browser on `http://localhost:5175` can create an order, create a payment, reload, confirm the persisted pending payment as paid, and show paid state from the refreshed read path

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal with `dist/assets/index-aOL9Zgq_.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served `http://localhost:5175/assets/index-aOL9Zgq_.js` contains `确认支付成功`, `支付已确认`, `payments/callbacks`, and `portal-local-payment`.
- Browser on `http://localhost:5175` created order `ORDER-20260608015739946-NSESAZ`, created payment `PAY-20260608020234177-XKCT2P`, reloaded the page to prove persisted latest-payment reads, clicked `确认支付成功`, and read back `订单状态已支付` plus `微信支付 · 已支付`.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: confirm portal local payments
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Portal source/runtime behavior for confirming a pending payment through the existing callback API and reading back the paid state. It does not prove real provider prepay, external payment webhooks, actual funds movement, refunds, merchant fulfillment, target-environment deployment, true-device checks, or formal business acceptance.
