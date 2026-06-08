# Portal Latest Payment Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Portal order list/detail reads display the persisted `latestPayment` returned by the order API.

**Architecture:** Keep Portal on Vue 3 + Vite and reuse the existing order read responses. This slice only formats and renders an optional latest payment record from list/detail reads; it does not create provider prepay parameters, process callbacks, poll payment state, or mark an order paid.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Latest-Payment Tests

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert list/detail persisted payment display**

Add a test that mocks `/orders?buyerUserId=local-user-001` and `/orders/ORDER-20260607-PORTAL?buyerUserId=local-user-001` with `latestPayment`, then asserts:

- order list shows `最近支付`
- order list shows payment number `PAY-20260607-LATEST`
- order detail shows `最近支付`
- order detail shows `微信支付 · 待支付`

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because Portal order UI does not render `latestPayment` yet.

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed 1/8 because the page did not contain `最近支付`.
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed 8/8 after implementation.

### Task 2: Implement Portal Latest-Payment Display

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add typed latest-payment field to Portal orders**

Add `latestPayment: PortalPayment | null` to `PortalOrderRecord`, while keeping compatibility with existing payment creation result typing.

- [x] **Step 2: Render latest payment on order rows**

Show a compact `最近支付` line under each order row when `order.latestPayment` exists.

- [x] **Step 3: Render latest payment in order detail**

Show a persisted latest-payment card in the detail panel before the local payment creation block when `selectedOrder.latestPayment` exists.

- [x] **Step 4: Refresh list after local payment creation**

After `createPortalPayment` succeeds, update the current detail state and refresh the local order list so the persisted-payment display can appear on the next API read.

### Task 3: Verification

- [x] **Step 1: Run focused Portal tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed 8/8.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed with API, Admin, Merchant, Portal, and User mini-program suites.
- First `pnpm run verify` attempt hit the command timeout after API tests passed; rerun with longer timeout completed successfully.
- `git diff --check` passed with only Windows line-ending warnings.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- Source contains latest-payment rendering.
- Served `http://localhost:5175/assets/...` bundle contains latest-payment strings.
- Browser on `http://localhost:5175` can create an order, create a payment, refresh/open order detail, and show persisted payment information from the read path.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal with `dist/assets/index-5B3cw2YV.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served `http://localhost:5175/assets/index-5B3cw2YV.js` contains `最近支付`, `支付单`, `portal-payment`, and `latestPayment`.
- Browser on `http://localhost:5175` created order `ORDER-20260608012456591-I1M9SX`, created payment `PAY-20260608012457827-POVUPN`, reloaded the page, and confirmed the order list/detail read paths showed `最近支付` with `微信支付 · 待支付`.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: show portal latest order payments
```

- [x] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Evidence:
- Feature branch `codex/portal-latest-payment-display` merged through PR #211.
- Feature merge commit: `59e483b3114a07a046a924dd5b53ce2d50461e48`.
- Docs completion branch: `codex/docs-portal-latest-payment-display-complete`.

## Acceptance Boundary

This slice proves local Portal source/runtime visibility of persisted latest payment records on order list/detail reads. It does not implement real provider prepay, payment callbacks, polling, refunds, target-environment deployment, true-device checks, or formal business acceptance.
