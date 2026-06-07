# Portal Payment Initiation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal users create a payment order from an existing pending-payment order detail.

**Architecture:** Keep Portal on Vue 3 + Vite and reuse the existing `POST /api/orders/payments` API contract. This slice only creates and displays the local payment order using the order snapshot amounts; it does not call a real provider, poll payment state, or process callbacks.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Payment Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert a pending order detail can create a payment**

Add a test that opens a local buyer order detail, clicks `发起支付`, and expects a `POST http://localhost:3000/api/orders/payments` request with:

- `channel: "wechat"`
- the selected order number
- `totalAmount`
- `welfareCardPayableAmount`
- `cashPayableAmount`
- a generated local Portal payment `requestId`

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because Portal does not expose a payment action yet.

- [x] **Step 2: Assert the returned payment result is visible**

The same test should expect `PAY-20260607-PORTAL`, `微信支付`, and `待支付` in the order detail after the API returns.

Expected: FAIL until Portal stores and renders the returned payment.

### Task 2: Implement Portal Payment API Client and UI

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add typed Portal payment API client**

Add `createPortalPayment(input)` to `apps/portal/src/api.ts`, posting to `/orders/payments`.

- [x] **Step 2: Render pending-payment action in order detail**

Show a compact `发起支付` action only when the selected order status is `pending_payment`.

- [x] **Step 3: Submit WeChat-channel payment from the selected order snapshot**

Use the current order `orderNo`, `totalAmount`, `welfareCardPayableAmount`, and `cashPayableAmount`, with a generated `portal-payment-...` request id.

- [x] **Step 4: Display payment result and errors**

Show payment number, channel, and status after creation. Keep failures scoped to the order detail panel.

### Task 3: Verification

- [x] **Step 1: Run focused Portal tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 7 tests after red/green.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.
- `pnpm run verify` passed with 63 API suites, Admin/Merchant/Portal/User mini-program tests.
- `git diff --check` passed with only Windows line-ending warnings.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- Source contains the Portal payment API and UI.
- Served `http://localhost:5175/assets/...` bundle contains the payment action/result strings.
- Browser on `http://localhost:5175` can create an order, open detail, create a payment order, and show the payment result.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt the Portal image with `dist/assets/index-2iOLZ0Oq.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served `http://localhost:5175/assets/index-2iOLZ0Oq.js` contains `发起支付`, `支付单创建成功`, `portal-payment`, and `orders/payments`.
- Browser on `http://localhost:5175` created order `ORDER-20260607123307846-VFPW03`, created payment `PAY-20260607123309124-7I6IQJ`, and showed `微信支付 · 待支付`.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: initiate portal order payments
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Portal browser users can create and view a pending payment order from an existing pending-payment order detail on port 5175. It does not implement provider prepay parameters, real payment collection, payment callbacks, polling/refresh, refunds, target-environment deployment, true-device checks, or formal business acceptance.
