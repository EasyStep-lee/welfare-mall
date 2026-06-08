# Admin Vue Order Fulfillment Task Details Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show concrete fulfillment task details on Admin Vue order cards so local operators can see task number, merchant, and progress without switching to a separate fulfillment screen.

**Architecture:** Keep Admin as Vue 3 + Vite + Element Plus. Reuse the existing `GET /api/orders/admin` read model and its `fulfillmentTasks` array. Do not add backend endpoints, payment/refund transitions, Merchant changes, Portal changes, target deployment, or true-device acceptance in this slice.

**Tech Stack:** Vue 3, TypeScript, Vite, Element Plus, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Write Failing Admin Fulfillment Task Test

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Assert task details render on order cards**

Add a paid Admin order fixture with `fulfillmentTasks` and expect the order card to show:
- `履约任务`
- task number
- merchant ID
- task status text

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
```

Expected: FAIL because Admin Vue currently renders only fulfillment totals.

Evidence:
- RED: `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` failed 1/14 because the Admin order card did not contain `履约任务`.

### Task 2: Render Admin Fulfillment Task Details

**Files:**
- Modify: `apps/admin/src/App.ts`
- Modify: `apps/admin/src/styles.css` if layout needs it

- [x] **Step 1: Render the task detail list**

For each order with `fulfillmentTasks`, render compact rows with task number, merchant ID, status text, and completed time when present.

- [x] **Step 2: Keep empty-task cards compact**

Do not add empty placeholder blocks to orders without fulfillment tasks.

Evidence:
- GREEN: `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` passed with 14/14 tests.

### Task 3: Verification

- [x] **Step 1: Run focused Admin tests and typecheck**

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
pnpm --filter @welfare-mall/admin run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` passed with 14/14 tests.
- `pnpm --filter @welfare-mall/admin run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- First `pnpm run verify` attempt was interrupted by the 120s tool timeout, with no business failure evidence.
- Re-run with a longer timeout passed: API 63 suites / 265 tests, Admin 19 tests, Merchant 15 tests, Portal 17 tests, user-miniprogram 35 tests.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- API `GET /api/orders/admin?status=paid&fulfillmentStatus=pending` returns fulfillment tasks.
- Served `http://localhost:5173/assets/...` bundle contains `履约任务`.
- Browser on `http://localhost:5173` shows task details for a paid order with fulfillment tasks.

Evidence:
- `git diff --check` passed with Windows line-ending warnings only.
- `pnpm run docker:runtime:up` passed and rebuilt Admin bundle `dist/assets/index-BERe1tLD.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Live API `GET /api/orders/admin?status=paid&fulfillmentStatus=pending` returned order `ORDER-20260608033110176-JSFNGY` with task `FT-ORDER-20260608033110176-JSFNGY-MERCHANT-LOCAL-REVIEW-1780889470335`, merchant `merchant-local-review`, status `pending`.
- Served `http://localhost:5173/assets/index-BERe1tLD.js` contains `履约任务` and `order-fulfillment-task`.
- Browser on `http://localhost:5173` showed `履约任务`, `merchant-local-review`, and multiple pending local fulfillment task numbers.

### Task 4: GitHub Integration

- [ ] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: show admin fulfillment task details
```

- [ ] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

## Acceptance Boundary

This slice proves local Admin Vue users can inspect task-backed fulfillment details on order cards. It does not change fulfillment creation/completion, pickup-code verification, payment/refund behavior, settlement, target-environment deployment, true-device checks, or formal business acceptance.
