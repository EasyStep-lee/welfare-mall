# Admin Cancelled Order Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let local Admin operators see and filter buyer-cancelled orders with a business-facing `已取消` status in the Admin Vue order workbench.

**Architecture:** Keep the existing Admin order read API unchanged because it already accepts all backend `OrderStatus` values, including `cancelled`. Extend only the Admin Vue API status type, status label map, and order status filter button list.

**Tech Stack:** Vue 3, Vite, Element Plus, Vitest, Vue Test Utils, jsdom, Docker Compose.

---

### Task 1: Admin Vue Cancelled Status RED/GREEN

**Files:**
- Modify: `apps/admin/src/App.test.ts`
- Modify: `apps/admin/src/api.ts`
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Write the failing Admin UI test**

Add a cancelled order fixture and assert:
- Admin order cards render `已取消`, not raw `cancelled`.
- A visible `已取消` status filter exists.
- Clicking it calls `GET /api/orders/admin?status=cancelled`.

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
```

Expected: FAIL because Admin Vue currently has no `cancelled` status filter or label.

Evidence:
- RED: `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` failed because the cancelled order card rendered raw `cancelled` instead of `已取消`.

- [x] **Step 2: Implement Admin Vue cancelled status support**

Add `cancelled` to `AdminOrderStatusFilter`, `adminOrderStatusLabels`, and `orderStatusOptions`.

- [x] **Step 3: Re-run focused Admin test**

Run:

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
```

Expected: PASS.

Evidence:
- GREEN: `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` passed with 16/16 tests.

### Task 2: Verification

- [x] **Step 1: Run focused tests and typechecks**

```powershell
pnpm --filter @welfare-mall/admin run test -- App.test.ts --run
pnpm --filter @welfare-mall/admin run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- `pnpm --filter @welfare-mall/admin run test -- App.test.ts --run` passed with 16/16 tests.
- `pnpm --filter @welfare-mall/admin run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

- [x] **Step 2: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed, including frontend stack boundary, Prisma generate, lint, typecheck, API Jest 63/63 suites, Admin Vitest 21/21 tests, Merchant Vitest 15/15 tests, Portal Vitest 17/17 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` passed with only Windows LF/CRLF working-copy warnings.

- [x] **Step 3: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- API `GET /api/orders/admin?status=cancelled` returns local cancelled order rows when present.
- Served `http://localhost:5173/assets/...` bundle contains `已取消` and `cancelled`.
- Browser on `http://localhost:5173` shows the `已取消` filter and can display cancelled orders with the Chinese label.

Evidence:
- `pnpm run docker:runtime:up` rebuilt and restarted the API/Admin/Merchant/Portal runtime; Admin built `dist/assets/index-D0-ijWFX.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- `GET http://localhost:3000/api/orders/admin?status=cancelled` returned local cancelled rows, including `ORDER-20260608040535204-IUY6SF`.
- Served `http://localhost:5173/assets/index-D0-ijWFX.js` contained both `已取消` and `cancelled`.
- Browser on `http://localhost:5173/` showed exactly one `已取消` button; clicking it displayed cancelled order `ORDER-20260608040535204-IUY6SF` with `已取消` and without raw `cancelled履约`.

### Task 3: GitHub Integration

- [x] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: filter cancelled admin orders
```

Evidence:
- Feature branch: `codex/admin-cancelled-order-filter-vue`.
- Feature commit: `0a80979 feat: filter cancelled admin orders`.
- PR: #235 `feat: filter cancelled admin orders`.
- GitHub checks: `docs-check` passed; `project-foundation-check` passed.
- Merged to `main` with squash commit `2a5300f3416d315db819e8ba8073e8a45f174d0f`.

- [x] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Evidence:
- Docs-only branch: `codex/docs-admin-cancelled-order-filter-complete`.
- Docs-only scope: this plan file only.

## Acceptance Boundary

This slice proves local Admin Vue source/runtime behavior for reading and filtering already-cancelled orders. It does not add Admin-side cancellation, automatic timeout cancellation, payment/refund changes, target-environment deployment, true-device checks, or formal business acceptance.
