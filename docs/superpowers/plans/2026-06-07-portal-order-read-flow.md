# Portal Order Read Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Portal users see their created orders and open an order detail after creating a pending-payment order.

**Architecture:** Keep Portal on Vue 3 + Vite and reuse the existing `GET /api/orders?buyerUserId=...` and `GET /api/orders/:orderNo?buyerUserId=...` API contracts. This slice keeps the same fixed local buyer used by Portal checkout and adds read-only list/detail state in the existing Portal shell.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Portal Order Read Tests

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Assert Portal loads local buyer orders**

Add a test that mounts Portal, mocks `GET /product-pools/catalog` and `GET /orders?buyerUserId=local-user-001`, and expects a visible order list containing `ORDER-20260607-PORTAL` and `待支付`.

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because Portal does not request or render the order list yet.

- [x] **Step 2: Assert Portal opens an order detail**

Add a test that clicks a visible order row/button, expects `GET /orders/ORDER-20260607-PORTAL?buyerUserId=local-user-001`, and renders line snapshot, receiver, and total amount.

Expected: FAIL because Portal does not expose order detail loading yet.

### Task 2: Implement Portal Order Read Client and UI

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/styles.css`

- [x] **Step 1: Add typed Portal order read API client**

Add `fetchPortalOrders(buyerUserId)` and `fetchPortalOrderDetail({ orderNo, buyerUserId })` to `apps/portal/src/api.ts`.

- [x] **Step 2: Render order list panel**

Load local buyer orders on mount, render order number, status, total amount, and a refresh control without disrupting the product catalog.

- [x] **Step 3: Render order detail panel**

Open an order detail from the list and render order lines, fulfillment receiver/address, and current status.

- [x] **Step 4: Refresh orders after checkout succeeds**

After `createPortalOrder` succeeds, reload the local buyer order list and keep the created order success state.

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

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- Source contains the Portal order read API and UI.
- Served `http://localhost:5175/assets/index-BSbiBGuI.js` contains the order list/detail strings, `local-user-001`, and order API query code.
- Browser on `http://localhost:5175` created `ORDER-20260607120315280-PPCKSD`, showed it in `我的订单`, and opened detail with product line, receiver, address, and `¥69.90`.

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 6 tests after red/green.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.
- `pnpm run verify` passed with 63 API suites, Admin/Merchant/Portal/User mini-program tests.
- `git diff --check` passed with only Windows line-ending warnings.
- `pnpm run docker:runtime:up`, `pnpm run docker:runtime:smoke`, and `pnpm run docker:page-smoke` passed.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: add portal order read flow
```

- [x] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Completion:
- Feature PR: `#207`
- Feature merge commit: `fdef6c6583dab0d1312cb7c1837ab3c645edd87b`
- Docs completion branch: `codex/docs-portal-order-read-flow-complete`

## Acceptance Boundary

This slice proves local Portal browser users can read and open orders created by the fixed local buyer on port 5175. It does not implement payment initiation, editable delivery addresses, buyer login, merchant fulfillment, Admin order action changes, target-environment deployment, true-device checks, or formal business acceptance.
