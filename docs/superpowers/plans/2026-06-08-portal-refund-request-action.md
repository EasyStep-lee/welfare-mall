# Portal Refund Request Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal buyers create a full refund request from a paid order detail panel.

**Architecture:** Keep Portal as Vue 3 + Vite. Reuse the existing `POST /api/orders/refunds` backend contract already used by Admin and the user mini-program. Add typed Portal API access and order-detail UI state only; do not change backend refund processing, provider callbacks, refund approval, settlement, mini-program behavior, or target deployment in this slice.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Refund Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert paid order detail exposes a refund action**

Open a paid local buyer order detail and expect a visible `申请退款` action.

- [x] **Step 2: Assert refund posts to the API and refreshes order reads**

Click `申请退款` and expect:
- `POST /api/orders/refunds`
- request body includes latest `paymentNo`, `orderNo`, `channel: wechat`, full `refundAmount`, `reason: after_sale`, and a generated `portal-refund-*` request ID
- returned refund number is shown
- order detail and list refresh to `refund_processing`
- the refund action is hidden after the order has a latest refund

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed 1/14 because the detail panel did not expose `button[aria-label="为订单 ORDER-20260607-PORTAL 申请退款"]`.

### Task 2: Implement Portal Refund Action

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Add a typed `createPortalRefund` API helper**

Send `POST /api/orders/refunds` with the latest payment number, order number, channel, amount, reason, and request ID.

- [x] **Step 2: Add refund UI state and guard**

Expose refund only when the selected order is `paid`, the latest payment is `paid`, and no latest refund exists. Show loading/error/success state and the latest refund number/status.

- [x] **Step 3: Refresh the buyer order list and detail after refund creation**

Reload both reads so the row and detail show `退款中`.

Evidence:
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 14/14 tests.

### Task 3: Verification

- [x] **Step 1: Run focused tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 14/14 tests.
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
- API can create and pay a local Portal order, then create a refund request to `refund_processing`.
- Served `http://localhost:5175/assets/...` bundle contains `申请退款`, `退款申请已提交`, `portal-refund`, and `/orders/refunds`.
- Browser on `http://localhost:5175` opens the paid order detail, submits refund, and shows `退款申请已提交`, the refund number, and `退款中`.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal bundle `/assets/index-D2QVyDdv.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Served bundle contains `申请退款`, `退款申请已提交`, `portal-refund`, and `/orders/refunds`.
- API created and paid order `ORDER-20260608043531768-HDFYTH` with payment `PAY-20260608043531856-L1MGO9`; browser on `http://localhost:5175` opened the paid order detail, submitted refund, and showed `退款申请已提交`, `REF-*`, and `退款中`.
- API `GET /api/orders/ORDER-20260608043531768-HDFYTH?buyerUserId=local-user-001` returned `status = refund_processing`, `latestRefund.status = processing`, and `latestRefund.refundAmount = 6990`.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: let portal request paid order refunds
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves Portal local source/runtime behavior for explicit full refund request creation on paid orders. It does not add refund approval, partial refund editing, provider callback processing, actual funds movement, online channel execution, franchise settlement, target-environment deployment, true-device checks, or formal business acceptance.
