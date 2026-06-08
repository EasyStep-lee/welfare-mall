# Portal Prevent Duplicate Pending Payment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Portal users from creating another local payment while the selected order already has a pending latest payment.

**Architecture:** Keep Portal on Vue 3 + Vite and reuse the existing order detail state. A pending latest payment should make the existing confirmation action the only visible next payment action. Orders without a pending latest payment can still use the existing local payment creation block.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Duplicate-Payment Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert pending latest payment hides the second payment creation action**

Add a test that loads an order with `latestPayment.status === 'pending'`, opens order detail, and asserts:
- the detail shows `确认支付成功`
- the detail does not expose `button[aria-label="为订单 ORDER-20260607-PORTAL 发起支付"]`

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because the current detail page still renders both `确认支付成功` and `发起支付` while the latest payment is pending.

Observed RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed because the duplicate `为订单 ORDER-20260607-PORTAL 发起支付` button was still present.

### Task 2: Implement Pending-Payment Guard

**Files:**
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Add a local-payment creation guard**

Add `canCreateLocalPayment(order)` so local payment creation is visible only when the order is `pending_payment` and its latest payment is not pending.

- [x] **Step 2: Apply the guard to the local payment block**

Change the local payment creation section from `selectedOrder.status === 'pending_payment'` to `canCreateLocalPayment(selectedOrder)`.

### Task 3: Verification

- [x] **Step 1: Run focused Portal tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed.
- `git diff --check` passed with Windows line-ending warnings only.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- source contains the pending-payment guard
- served `http://localhost:5175/assets/...` bundle contains the guard logic and no stale duplicate-payment behavior
- browser on `http://localhost:5175` opens an order with a pending latest payment and shows `确认支付成功` without the second `发起支付` action

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served bundle asset `/assets/index-oW3y9wzB.js` contains the payment-status strings used by the updated flow.
- Browser proof on `http://localhost:5175`: order `ORDER-20260608012456591-I1M9SX` showed latest payment `PAY-20260608012457827-POVUPN` as pending, exposed `确认支付成功`, and did not expose `为订单 ORDER-20260608012456591-I1M9SX 发起支付`.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
fix: prevent duplicate portal pending payments
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Portal users cannot start a second local payment while an existing latest payment is pending. It does not add real provider payment polling, webhook handling, refund logic, merchant fulfillment, target-environment deployment, true-device checks, or formal business acceptance.
