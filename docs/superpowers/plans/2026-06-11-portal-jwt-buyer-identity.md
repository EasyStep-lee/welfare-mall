# Portal JWT Buyer Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Portal order-flow dependence on the fixed buyer `local-user-001` and drive buyer order reads, checkout, cancel, payment refresh, and refund refresh from the authenticated JWT user subject.

**Architecture:** Keep the existing API order contract for now because `OrderController` already resolves a buyer JWT subject ahead of the legacy fallback `buyerUserId`. Add a Portal access-token provider matching Admin/Merchant client patterns, attach `Authorization: Bearer ...` to Portal order/payment/refund requests when a token is available, and resolve Portal `buyerUserId` from the stored authenticated buyer user. This slice does not redesign the payment component contract, add Franchise UI, or remove `pickupStoreName`.

**Business Constraints:** User identity must come from login/JWT rather than fixed local IDs in the main business flow. Franchise remains the sales party and welfare-card issuer. Merchant remains the product publisher and fulfillment party with an actual address. User cash payment remains online WeChat/Alipay only; no offline cash channel is introduced. Historical `pickupStoreName` stays compatibility-only and is not expanded.

**Out of Scope:** User mini-program identity replacement, Admin/Merchant actor replacement, Franchise console, welfare-card batch/card lifecycle, payment-component redesign, original-route refund split, and settlement ledger expansion.

---

### Task 1: RED Portal Auth Client And Buyer Identity Tests

**Files:**
- Create: `apps/portal/src/api.test.ts`
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Require Portal API Bearer token injection**

Add a failing API client test requiring Portal order reads to include `Authorization: Bearer <token>` when a Portal access token provider returns a token.

- [x] **Step 2: Require authenticated buyer subject in order flow**

Add a failing component test where login returns `subjectId: buyer-auth-999`; order list and checkout must use `buyer-auth-999` rather than `local-user-001`, and order requests must include the Bearer token.

- [x] **Step 3: Require stale-token recovery**

Add a failing component test where a stored Portal token receives `401`; Portal must clear stored auth state and return to the login entrypoint.

Evidence:
- Initial RED failed because `setPortalAccessTokenProvider` / `resetPortalAccessTokenProvider` did not exist.
- Initial RED failed because Portal still called `/orders?buyerUserId=local-user-001` and posted `buyerUserId: local-user-001`.
- Stale-token RED failed because `localStorage.removeItem` was not called on `401`.

### Task 2: GREEN Portal JWT Buyer Flow

**Files:**
- Modify: `apps/portal/src/api.ts`
- Modify: `apps/portal/src/App.vue`

- [x] **Step 1: Add Portal access-token provider**

Add `setPortalAccessTokenProvider`, `resetPortalAccessTokenProvider`, and an `apiFetch` wrapper that preserves no-token request shape and merges JSON headers with `Authorization` when a token exists.

- [x] **Step 2: Resolve buyer from authenticated user**

Remove `localBuyerUserId`. Add `resolveAuthenticatedBuyerUserId()` and use it for Portal order list, order detail, checkout, cancel, payment refresh, refund request refresh, and refund callback refresh.

- [x] **Step 3: Clear rejected Portal sessions**

When buyer-scoped order loading returns `401`, clear `welfareMallPortalAccessToken` and `welfareMallPortalUser`, reset selected order state, and return to the login entrypoint.

Evidence:
- `pnpm --filter @welfare-mall/portal run test --run src/api.test.ts src/App.test.ts` passed: 2 files, 24 tests.

### Task 3: Verification

- [x] Run Portal focused tests.
- [x] Run Portal typecheck and business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker served Portal bundle.
- [x] Verify source, served bundle, and browser behavior.

Evidence:
- `rg` found no `localBuyerUserId`, `local-user-001`, or `buyerUserId=local-user-001` in `apps/portal/src`.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (30 known deviation files tracked).`
- `pnpm run verify` passed, including frontend stack, business boundary, Prisma generate, lint, typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest.
- `docker compose up -d --build portal` with `DOCKER_BUILDKIT=0` rebuilt Portal. The default BuildKit path first failed before project build with Docker gRPC session metadata error.
- Served bundle `http://localhost:5175/assets/index-7uyoPhED.js` does not contain `local-user-001` and contains Portal access-token / `Authorization` logic.
- Browser verification on `http://localhost:5175/` confirmed a stale stored token returns to `用户登录`.
- Browser login as `buyer-local` loaded the catalog and showed `暂无订单` without a 401.
- Browser checkout created `ORDER-20260611045207414-JQ9OR2`; DB confirmed `buyerUserId: user-001`, `salesFranchiseId: franchise-local-review`, and `fulfillmentMerchantId: merchant-local-review`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 4: Completion

- [x] Commit feature work on `codex/portal-jwt-buyer-identity`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks and merge.
- [x] Create docs-only completion PR after feature merge.

Evidence:
- Feature branch: `codex/portal-jwt-buyer-identity`.
- Feature commit: `40b9dd68873e4d9f075b24e065815428798e5f2d`.
- Feature PR: #263 `feat: drive portal orders from jwt buyer`.
- GitHub Actions for PR #263 passed: `Project docs check` run 530, including `docs-check` and `project-foundation-check`.
- Feature PR #263 squash-merged to `main` at `81af0260aec5beb2e9b6da6fbdbcfe82cc1a2d5c`.
- Docs-only completion branch: `codex/docs-portal-jwt-buyer-identity-complete`.
