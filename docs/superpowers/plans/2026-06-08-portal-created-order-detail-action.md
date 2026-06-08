# Portal Created Order Detail Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal buyers continue from a successful checkout result directly into the created order detail so they can start payment without finding the order again in the list.

**Architecture:** Keep Portal as Vue 3 + Vite. Reuse the existing buyer order detail API and existing payment block. Add a checkout-result action that loads the created order detail by order number; do not change backend checkout, payment, refund, fulfillment, Admin/Merchant behavior, or target deployment in this slice.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Created Order Detail Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert checkout result exposes a detail/payment continuation action**

Create a local checkout order from product detail and expect a visible `查看订单 ... 详情并支付` action in the checkout result.

- [x] **Step 2: Assert the action loads buyer order detail**

Click the checkout-result action and expect:
- `GET /api/orders/:orderNo?buyerUserId=local-user-001`
- the order detail panel appears
- the existing payment action is visible

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Evidence:
- RED: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed 1/17 because the checkout result did not expose `button[aria-label="查看订单 ORDER-20260607-PORTAL 详情并支付"]`.

### Task 2: Implement Created Order Detail Action

**Files:**
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Reuse order detail loading by order number**

Extract the existing order-detail fetch into an order-number based helper, and keep the order-list detail action using the same behavior.

- [x] **Step 2: Add checkout-result action**

Render `查看订单并支付` after checkout success. Disable it while order detail is loading and load the newly created order detail by order number.

Evidence:
- GREEN: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 17/17 tests.

### Task 3: Verification

- [x] **Step 1: Run focused tests and typecheck**

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 17/17 tests.
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
- API can create a local Portal checkout order and read its order detail.
- Served `http://localhost:5175/assets/...` bundle contains `查看订单并支付` and `详情并支付`.
- Browser on `http://localhost:5175` creates a checkout order, clicks `查看订单并支付`, and shows the created order detail with payment action.

Evidence:
- `pnpm run docker:runtime:up` passed and rebuilt Portal bundle `dist/assets/index-D3-mikkj.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Live API created `ORDER-20260608060027870-SQNF32` from catalog item `cmq0l27u80005ol1tsyl2nija` and `GET /api/orders/ORDER-20260608060027870-SQNF32?buyerUserId=local-user-001` returned `pending_payment`.
- Served `http://localhost:5175/assets/index-D3-mikkj.js` contains `查看订单并支付`, `详情并支付`, and `加载订单中`.
- Browser on `http://localhost:5175` created `ORDER-20260608060248127-YPLPDK`; clicking `查看订单并支付` showed `订单详情`, the created order number, and `发起支付`. API readback for the same order returned `pending_payment` with local buyer `local-user-001`.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: let portal open created order details
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves Portal local source/runtime behavior for continuing from checkout success into the created order detail and existing payment action. It does not auto-create payments, auto-confirm payments, change order state transitions, add target-environment deployment, true-device checks, or formal business acceptance.
