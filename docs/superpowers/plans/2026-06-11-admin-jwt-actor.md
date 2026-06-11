# Admin JWT Actor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Admin review and publish action dependence on frontend-fixed `admin-user-001` by deriving the operation actor from the logged-in Admin JWT user.

**Architecture:** Keep the existing Admin Vue auth entrypoint and API action contracts. Extend the Admin authenticated user shape with optional `sub`, read the current stored/login user in `App.ts`, and use `sub` as `actorUserId` for product review decisions and product-pool publish actions. Use username only as a compatibility fallback for old local stored users without `sub`.

**Business Constraints:** Admin is a platform-side operator, not a franchise, merchant, or user buyer. Admin actions must be attributable to the authenticated platform user. This slice does not introduce shop/store semantics, offline customer cash payment, or fixed local identities into the main Admin action path.

**Out of Scope:** Department/role permission screens, merchant/franchise selector replacement, settlement ledger expansion, welfare-card issuance UI, combination payment, refund split, and replacing remaining local merchant filter defaults.

---

### Task 1: RED Admin Actor Tests

**Files:**
- Modify: `apps/admin/src/App.test.ts`

- [x] **Step 1: Store Admin user `sub` in the test login state**

Update the local stored Admin user fixture with a JWT subject distinct from the old fixed actor.

- [x] **Step 2: Require review approve/reject to send JWT actor**

Change review decision assertions to expect `actorUserId` from the stored Admin user `sub`.

- [x] **Step 3: Require product-pool publish to send JWT actor**

Change product-pool publish assertions to expect `actorUserId` from the stored Admin user `sub`.

Evidence:
- Initial focused Admin RED failed in three tests because approve, reject, and publish still sent `admin-user-001` instead of `admin-user-from-jwt`.

### Task 2: GREEN Admin Actor Wiring

**Files:**
- Modify: `apps/admin/src/api.ts`
- Modify: `apps/admin/src/App.ts`

- [x] **Step 1: Add `sub` to Admin authenticated user typing**

Allow the Admin login/read-stored-user model to carry the JWT subject.

- [x] **Step 2: Resolve actor from current login state**

Replace the fixed top-level actor constant with `resolveAdminActorUserId()`, preferring `authUser.sub` and falling back to username for old local sessions.

- [x] **Step 3: Use resolved actor in Admin actions**

Wire review approve, review reject, and product-pool publish to the resolved actor.

Evidence:
- Focused Admin tests for approve, reject, and publish passed after implementation.

### Task 3: Boundary Documentation

**Files:**
- Modify: `docs/business-boundary-known-deviations.json`

- [x] **Step 1: Remove fixed Admin actor from known deviation text**

Keep only the remaining local merchant filter/default deviation for Admin Vue.

- [x] **Step 2: Keep future action scoped to merchant selectors and permissions**

Document that remaining Admin work is department-scoped filters and business selectors, not fixed actor replacement.

### Task 4: Verification

- [x] Run focused Admin tests.
- [x] Run Admin typecheck.
- [x] Run business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker Admin served bundle.
- [x] Verify source, served bundle, and browser behavior on `http://localhost:5173/`.
- [x] Run Docker runtime and page smoke checks.

Evidence:
- Focused Admin test RED failed first because approve, reject, and publish still sent `admin-user-001`; the same focused tests passed after implementation.
- `pnpm --filter @welfare-mall/admin test -- --run src/App.test.ts` passed: 18 tests.
- `pnpm --filter @welfare-mall/admin run typecheck` passed.
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (30 known deviation files tracked).`
- `pnpm run verify` passed, including frontend stack, business boundary, Prisma generate, lint, typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest.
- `docker compose build admin` and `docker compose up -d admin` completed; `docker compose ps admin` reported healthy on port 5173.
- Served bundle `http://localhost:5173/assets/index-ITW-y06u.js` does not contain `admin-user-001` or the test-only `admin-user-from-jwt`; it still contains `merchant-local-review`, matching the remaining local merchant filter/default deviation.
- Browser verification on `http://localhost:5173/` logged in with the local Admin account, showed the Admin workbench, product review, and orders, and reported no console errors.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 5: Completion

- [x] Commit feature work on `codex/admin-jwt-actor`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks and merge.
- [x] Create docs-only completion PR after feature merge.

Evidence:
- Feature branch: `codex/admin-jwt-actor`.
- Feature commit: `e4d6e14f6c64b0e8ffe7eccc0c9f27fe4bf1ad0c`.
- Feature PR: #269 `feat: drive admin actions from jwt actor`.
- GitHub Actions for PR #269 passed: `Project docs check` run 542, including `docs-check` and `project-foundation-check`.
- Feature PR #269 squash-merged to `main` at `09335c6476f93dfec4acdbfe8b85c60079042ef3`.
- Docs-only completion branch: `codex/docs-admin-jwt-actor-complete`.
