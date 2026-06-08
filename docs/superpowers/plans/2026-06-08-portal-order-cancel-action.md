# Portal Order Cancel Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal buyers cancel a pending-payment order from the order detail panel.

**Architecture:** Keep Portal as Vue 3 + Vite. Reuse the existing `POST /api/orders/:orderNo/cancel` endpoint with the fixed local buyer identity and `user_cancel` reason. Update only Portal API typing and order-detail UI state; do not change backend cancellation, inventory release, payment guards, mini-program behavior, or target deployment in this slice.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Cancel Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert pending-payment order detail exposes a cancel action**

Open a pending-payment order detail from the local order list and expect a visible `取消订单` action.

- [x] **Step 2: Assert cancel posts to the API and updates the order detail**

Click `取消订单` and expect:
- `POST /api/orders/ORDER-20260607-PORTAL/cancel`
- request body includes `buyerUserId: local-user-001`
- request body includes `reason: user_cancel`
- returned `cancelled` order replaces the detail state
- the page shows `订单已取消`

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because Portal does not expose or call the cancel endpoint yet.

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed 1/13 because the detail panel did not expose `button[aria-label="取消订单 ORDER-20260607-PORTAL"]`.

### Task 2: Implement Portal Cancel Action

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Add a typed `cancelPortalOrder` API helper**

Send `POST /api/orders/:orderNo/cancel` with `buyerUserId` and `reason`.

- [x] **Step 2: Add cancel UI state and guard**

Expose cancel only when the selected order status is `pending_payment`, show loading/error/success state, and replace the selected order with the returned cancelled order.

- [x] **Step 3: Refresh the buyer order list after cancel**

Reload the list so the row status also changes to `已取消`.

### Task 3: Verification

- [x] **Step 1: Run focused tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 13/13 tests.
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
- API can create a local pending-payment Portal order and cancel it to `cancelled`.
- Served `http://localhost:5175/assets/...` bundle contains `取消订单`, `订单已取消`, and the cancel endpoint path.
- Browser on `http://localhost:5175` opens the pending order detail, cancels it, and shows `订单已取消` plus `已取消`.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal bundle `/assets/index-9ZtQAzVV.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served bundle contains `取消订单`, `订单已取消`, `/cancel`, and `user_cancel`.
- API created pending order `ORDER-20260608040535204-IUY6SF`; browser on `http://localhost:5175` opened the detail, clicked cancel, and showed `订单已取消` plus `已取消`.
- API `GET /api/orders/ORDER-20260608040535204-IUY6SF?buyerUserId=local-user-001` returned `status = cancelled`.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: let portal cancel pending orders
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves Portal local source/runtime behavior for explicit buyer cancellation of pending-payment orders. It does not add automatic payment timeout cancellation, paid-order refunds, Admin close actions, target-environment deployment, true-device checks, or formal business acceptance.
