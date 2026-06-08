# Portal Order Line Merchant Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry merchant ownership into buyer order reads so Portal order list and detail views can show the fulfillment merchant immediately after checkout, before payment callbacks or fulfillment tasks exist.

**Architecture:** Keep Portal on Vue 3 + Vite. Keep Admin and Merchant on Vue 3 + Vite + Element Plus. Reuse the existing order read APIs and derive order-line `merchantId` from product master data at read time. Do not add store modeling, store selection, merchant selection, or schema changes in this slice.

**Tech Stack:** NestJS, Prisma, Vue 3, Vite, Vitest, Jest, Docker Compose.

---

### Task 1: RED Order-Line Merchant Context

**Files:**
- Modify: `apps/api/test/order/order-read.repository.spec.ts`
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Write failing API repository test**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts --runInBand
```

Expected: FAIL because buyer order lines do not include `merchantId`.

Evidence:
- RED API: `pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts --runInBand` failed because `prisma.product.findMany` was not called and returned lines lacked `merchantId`.

- [x] **Step 2: Write failing Portal UI test**

Run:

```powershell
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
```

Expected: FAIL because Portal order list/detail do not render order-line `履约商户`.

Evidence:
- RED Portal: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` failed because order list/detail text did not contain `履约商户`.

### Task 2: GREEN Implementation

**Files:**
- Modify: `apps/api/src/order/order-read.repository.ts`
- Modify: `apps/api/src/order/order-checkout.repository.ts`
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Add `merchantId` to the order-line read contract**

Use product master data to derive each order line's merchant ownership without changing the order-line table.

- [x] **Step 2: Render merchant context in Portal order list/detail**

Show unique line merchants on the order row and the line merchant on order detail using `履约商户` wording.

- [x] **Step 3: Re-run focused tests and typechecks**

```powershell
pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts --runInBand
pnpm --filter @welfare-mall/portal run test -- App.test.ts --run
pnpm --filter @welfare-mall/portal run typecheck
pnpm run verify:frontend-stack
```

Evidence:
- GREEN API: `pnpm --filter @welfare-mall/api run test -- test/order/order-read.repository.spec.ts --runInBand` passed with 10/10 tests.
- GREEN Portal: `pnpm --filter @welfare-mall/portal run test -- App.test.ts --run` passed with 17/17 tests.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:frontend-stack` passed.

### Task 3: Verification

- [x] **Step 1: Run full local verification**

```powershell
pnpm run verify
git diff --check
```

Evidence:
- `pnpm run verify` passed, including frontend stack boundary, Prisma generate, lint, typecheck, API Jest 63/63 suites, Admin Vitest 21/21 tests, Merchant Vitest 15/15 tests, Portal Vitest 17/17 tests, and user-miniprogram Vitest 35/35 tests.
- `git diff --check` passed with only Windows LF/CRLF working-copy warnings.

- [x] **Step 2: Runtime proof**

```powershell
pnpm run docker:runtime:up
pnpm run docker:runtime:smoke
pnpm run docker:page-smoke
```

Then verify:
- Live API `GET /api/orders?buyerUserId=local-user-001` returns line-level `merchantId`.
- Served `http://localhost:5175/assets/...` bundle contains `履约商户`.
- Browser on `http://localhost:5175/` shows order-list/detail merchant context and does not reintroduce store-centric main-flow wording.

Evidence:
- `pnpm run docker:runtime:up` rebuilt and restarted the API/Admin/Merchant/Portal runtime; Portal built `dist/assets/index-l7-IYD6-.js`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.
- Live API `GET /api/orders?buyerUserId=local-user-001` returned pending-payment order lines with `merchantId = merchant-local-review`.
- Served `http://localhost:5175/assets/index-l7-IYD6-.js` contained `履约商户` and did not contain `门店自提`.
- Browser on `http://localhost:5175/` showed order list and order detail line text `履约商户 merchant-local-review`, with no `门店自提` in the verified sections.

### Task 4: GitHub Integration

- [x] **Step 1: Commit, push, open PR, and merge**

Commit message:

```text
feat: show portal order merchant context
```

Evidence:
- Feature branch: `codex/portal-order-line-merchant-context`.
- Feature commit: `79c17e3 feat: show portal order merchant context`.
- PR: #239 `feat: show portal order merchant context`.
- GitHub checks: `docs-check` passed; `project-foundation-check` passed.
- Merged to `main` with squash commit `ce0f8e2b130e6b6f314bbbb95da1d09979cf4779`.

- [x] **Step 2: Mark plan complete in docs-only follow-up**

After the feature PR merges, create a docs-only branch and mark this plan complete.

Evidence:
- Docs-only branch: `codex/docs-portal-order-line-merchant-context-complete`.
- Docs-only scope: this plan file only.

## Acceptance Boundary

This slice proves local buyer order reads and Portal order UI expose merchant-centered fulfillment context from order lines. It does not add dynamic merchant selection, store modeling, payment provider integration, target-environment deployment, true-device checks, or formal business acceptance.
