# Merchant JWT Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Merchant workbench dependence on fixed local merchant and actor IDs, and drive merchant-scoped reads/actions from the authenticated JWT merchant subject.

**Architecture:** Keep the current Merchant API contracts for this slice. `OrderController` and `SettlementController` already resolve merchant identity from JWT when the subject is a merchant, while product draft save/submit still require an actor in the request body. Merchant Vue should resolve the scoped merchant from `authUser.subjectId` and the actor from `authUser.sub`, preserving existing local master-data placeholders for franchise/category/brand until the formal merchant master-data slice replaces them.

**Business Constraints:** Merchant identity must come from login/JWT rather than fixed local IDs in the main business flow. Franchise remains the sales party, welfare-card issuer, and receivable owner. Merchant remains the product publisher, inventory holder, fulfillment party, and address owner. User cash payment remains online WeChat/Alipay only; no offline cash channel is introduced. Historical `pickupStoreName` stays compatibility-only and is not expanded.

**Out of Scope:** Franchise console, dynamic franchise/category/brand selection, Admin actor replacement, user mini-program identity replacement, welfare-card issuance, combination payment, refund split, settlement ledger expansion, and replacing legacy `pickupStoreName` display.

---

### Task 1: RED Merchant Auth Subject Tests

**Files:**
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Require merchant-scoped reads to use JWT subject**

Add a failing component test where stored auth user has `subjectId: merchant-auth-999`; fulfillment and settlement reads must use `merchant-auth-999` instead of `merchant-local-review`.

- [x] **Step 2: Require merchant-scoped actions to use JWT subject**

The same test must require fulfillment completion and product draft payloads to use `merchant-auth-999`.

- [x] **Step 3: Require actor actions to use authenticated user id**

The same test must require product submit/save actor `user-merchant-auth-999` from `authUser.sub` instead of the fixed local actor.

Evidence:
- Initial RED failed because Merchant Vue still sent `merchant-local-review` for fulfillment and settlement requests.
- Initial RED failed because product review submit and draft save still used `merchant-user-local`.

### Task 2: GREEN Merchant JWT Workbench Flow

**Files:**
- Modify: `apps/merchant/src/App.ts`
- Modify: `apps/merchant/src/api.ts`
- Modify: `docs/business-boundary-known-deviations.json`

- [x] **Step 1: Add authenticated user `sub` to Merchant auth contract**

Allow Merchant frontend state to keep the JWT subject user id returned by login.

- [x] **Step 2: Resolve merchant from authenticated subject**

Replace fixed Merchant workbench `merchantId` usage with `authUser.subjectId` when `subjectType` is `merchant`.

- [x] **Step 3: Resolve product actor from authenticated user**

Replace fixed product actor usage with `authUser.sub`, falling back to username only for transitional local compatibility.

- [x] **Step 4: Keep known deviations accurate**

Remove the obsolete fixed-identity deviation from Merchant App and keep only the remaining `pickupStoreName` compatibility deviation.

Evidence:
- Merchant Vue now throws a login error when no authenticated merchant subject exists for scoped workbench operations.
- Merchant draft save payloads now use the authenticated merchant id while retaining only local franchise/category/brand placeholders for a later master-data slice.

### Task 3: Verification

- [x] Run Merchant focused RED/GREEN test.
- [x] Run Merchant focused test files.
- [x] Run Merchant typecheck.
- [x] Run business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker served Merchant bundle.
- [x] Verify source, served bundle, and browser behavior.

Evidence:
- `pnpm --filter @welfare-mall/merchant run test --run src/App.test.ts -t "authenticated merchant subject"` passed after the RED failure.
- `pnpm --filter @welfare-mall/merchant run test --run src/App.test.ts src/api.test.ts` passed: 2 files, 15 tests.
- `pnpm --filter @welfare-mall/merchant run typecheck` passed.
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (30 known deviation files tracked).`
- `pnpm run verify` passed, including frontend stack, business boundary, Prisma generate, lint, typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest.
- `docker compose up -d --build merchant` with `DOCKER_BUILDKIT=0` rebuilt/restarted Merchant; the first 120-second invocation timed out while the container came back healthy.
- Served bundle `http://localhost:5174/assets/index-B8DoLoKK.js` does not contain `merchant-local-review`, `merchant-user-local`, or `merchantActorUserId`, and contains Merchant access-token / `Authorization` logic.
- Browser verification on `http://localhost:5174/` logged in as `merchant-local` and confirmed `商户运营工作台`, `履约订单`, `商品草稿`, and `商户结算` were visible with no console errors.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 4: Completion

- [ ] Commit feature work on `codex/merchant-jwt-identity`.
- [ ] Push branch and open PR.
- [ ] Wait for GitHub checks and merge.
- [ ] Create docs-only completion PR after feature merge.

Evidence:
- Feature branch: `codex/merchant-jwt-identity`.
