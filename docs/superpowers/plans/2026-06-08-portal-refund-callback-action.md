# Portal Refund Callback Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal buyers confirm a processing refund as succeeded from the order detail panel.

**Architecture:** Keep Portal as Vue 3 + Vite. Reuse the existing `POST /api/orders/refunds/callbacks` backend contract already used by Admin. Add typed Portal API access and order-detail UI state only; do not change backend refund processing, provider callback semantics, settlement, Admin/Merchant behavior, or target deployment in this slice.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Refund Callback Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert processing refund detail exposes a callback action**

Open a `refund_processing` local buyer order detail with a processing latest refund and expect a visible `确认退款成功` action.

- [x] **Step 2: Assert callback posts to the API and refreshes order reads**

Click `确认退款成功` and expect:
- `POST /api/orders/refunds/callbacks`
- request body includes `providerEventId`, `refundNo`, `providerRefundNo`, `status: succeeded`, `succeededAt`, and `payload.source: portal-local-refund`
- order detail and list refresh to `refunded`
- the refund callback action is hidden after the latest refund is succeeded

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed 1/15 because the detail panel did not expose `button[aria-label="确认退款单 REF-20260607-PORTAL 退款成功"]`.

### Task 2: Implement Portal Refund Callback Action

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Add a typed `confirmPortalRefund` API helper**

Send `POST /api/orders/refunds/callbacks` with provider event ID, refund number, provider refund number, succeeded status, succeeded timestamp, and local payload.

- [x] **Step 2: Add refund callback UI state and guard**

Expose callback only when the selected order is `refund_processing` and the latest refund is `processing`. Show loading/error/success state and hide the action after success.

- [x] **Step 3: Refresh the buyer order list and detail after callback**

Reload both reads so the row and detail show `已退款`.

Evidence:
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 15/15 tests.

### Task 3: Verification

- [x] **Step 1: Run focused tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 15/15 tests.
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
- API can create, pay, refund-request, and refund-callback a local Portal order to `refunded`.
- Served `http://localhost:5175/assets/...` bundle contains `确认退款成功`, `退款已确认`, `portal-local-refund`, and `/orders/refunds/callbacks`.
- Browser on `http://localhost:5175` opens the refund-processing order detail, confirms refund success, and shows `退款已确认`, `退款成功`, and `已退款`.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal served bundle `/assets/index-DY6Abicz.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served `http://localhost:5175/assets/index-DY6Abicz.js` contains `确认退款成功`, `退款已确认`, `portal-local-refund`, and `/orders/refunds/callbacks`.
- Runtime API/browser proof used order `ORDER-20260608050440110-T3DEPZ`, payment `PAY-20260608050440176-5SLQKD`, and refund `REF-20260608050440303-B58B0S`. Browser opened the order detail from `http://localhost:5175`, clicked `确认退款成功`, then showed `退款已确认`, `退款成功`, `已退款`, and hid the callback action.
- API reread `GET /api/orders/ORDER-20260608050440110-T3DEPZ?buyerUserId=local-user-001` returned order status `refunded`, latest refund status `succeeded`, and provider refund number `LOCAL-PORTAL-PROVIDER-REF-20260608050440303-B58B0S`.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: let portal confirm refund callbacks
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves Portal local source/runtime behavior for explicit succeeded refund callback simulation on processing refunds. It does not add real provider refund submission, real webhook delivery, actual funds movement, online channel execution, franchise settlement, target-environment deployment, true-device checks, or formal business acceptance.
