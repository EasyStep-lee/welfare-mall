# Merchant Draft Master Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove Merchant draft-save dependence on frontend-fixed franchise/category/brand IDs by loading a merchant draft context from the API, where merchant ownership resolves to its actual franchise.

**Architecture:** Add a narrow `GET /api/merchants/:merchantId/draft-context` read model. The endpoint uses `OptionalAuthGuard`; if a Merchant JWT is present, the token subject overrides the route merchant ID. `MerchantDraftContextRepository` reads the merchant with its franchise and provides default product category/brand master data. Merchant Vue loads this context with the workbench read models and uses it when building product draft payloads.

**Business Constraints:** Merchant remains the product publisher, inventory holder, fulfillment party, and address owner. Franchise remains the true sales party, welfare-card issuer, sales ledger subject, and receivable owner. Product drafts must persist `merchantId -> franchiseId` from the merchant relationship, not from a frontend local constant. No shop/store model or offline customer cash channel is introduced.

**Out of Scope:** Full category/brand selector UX, franchise console, merchant address editing, Admin actor replacement, user mini-program identity replacement, welfare-card lifecycle expansion, combination payment, refund split, settlement ledger expansion, and replacing legacy `pickupStoreName` display.

---

### Task 1: RED Merchant Draft Context Tests

**Files:**
- Modify: `apps/merchant/src/api.test.ts`
- Modify: `apps/merchant/src/App.test.ts`
- Create: `apps/api/test/merchant/merchant-draft-context.repository.spec.ts`

- [x] **Step 1: Require Merchant API client draft-context request**

Add a failing API client test requiring `fetchMerchantDraftContext('merchant-001')` to call `/api/merchants/merchant-001/draft-context` with the configured Bearer token.

- [x] **Step 2: Require Merchant Vue to use draft context in saved payloads**

Add a failing component test where authenticated merchant `merchant-auth-999` receives draft context `franchise-auth-999`, `category-auth-999`, and `brand-auth-999`; saving a draft must use those IDs instead of local constants.

- [x] **Step 3: Require API repository to derive franchise from merchant**

Add a failing repository test requiring merchant draft context to return the merchant, its franchise, and default category/brand master data.

Evidence:
- Initial Merchant RED failed because `fetchMerchantDraftContext` did not exist.
- Initial Merchant component RED failed because Merchant Vue did not call `/api/merchants/merchant-auth-999/draft-context`.
- Initial API RED failed because `merchant-draft-context.repository` did not exist.

### Task 2: GREEN API Draft Context

**Files:**
- Create: `apps/api/src/merchant/merchant-draft-context.repository.ts`
- Modify: `apps/api/src/merchant/merchant.controller.ts`
- Modify: `apps/api/src/merchant/merchant.module.ts`

- [x] **Step 1: Add repository read model**

Read the merchant by ID, include its franchise, and read default product category/brand master data.

- [x] **Step 2: Expose draft-context endpoint**

Add `GET /api/merchants/:merchantId/draft-context`; return 404 for missing merchants.

- [x] **Step 3: Preserve JWT merchant scope**

Use `OptionalAuthGuard` and prefer `request.user.subjectId` when the authenticated subject is a merchant.

Evidence:
- `pnpm --filter @welfare-mall/api run test --runInBand test/merchant/merchant-draft-context.repository.spec.ts` passed: 1 suite, 3 tests.

### Task 3: GREEN Merchant Vue Draft Payload

**Files:**
- Modify: `apps/merchant/src/api.ts`
- Modify: `apps/merchant/src/App.ts`
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Add Merchant draft-context API client**

Add `MerchantDraftContext` typing and `fetchMerchantDraftContext`.

- [x] **Step 2: Load draft context with the workbench**

Load draft context alongside fulfillment, draft queue, and settlement statements.

- [x] **Step 3: Save drafts with context-derived master data**

Build product draft payloads with authenticated `merchantId`, API-derived `franchiseId`, API-derived `categoryId`, and API-derived `brandId`.

Evidence:
- `pnpm --filter @welfare-mall/merchant run test --run src/api.test.ts src/App.test.ts -t "draft context"` passed after the RED failure.
- `pnpm --filter @welfare-mall/merchant run test --run src/api.test.ts src/App.test.ts` passed: 2 files, 17 tests.

### Task 4: Verification

- [x] Run API typecheck and Merchant typecheck.
- [x] Run business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker API and Merchant served bundle.
- [x] Verify source, served bundle, API, and browser behavior.

Evidence:
- `pnpm --filter @welfare-mall/api run typecheck` passed.
- `pnpm --filter @welfare-mall/merchant run typecheck` passed.
- `pnpm run verify:business-boundary` passed with `Business boundary check passed (30 known deviation files tracked).`
- `pnpm run verify` passed, including frontend stack, business boundary, Prisma generate, lint, typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest.
- `docker compose up -d --build api merchant` with `DOCKER_BUILDKIT=0` timed out at 240 seconds while API later completed rebuild/restart; `docker compose logs` confirmed `/api/merchants/:merchantId/draft-context` route mapping.
- Live API `GET /api/merchants/merchant-local-review/draft-context` returned `merchant-local-review`, `franchise-local-review`, `category-local-review`, and `brand-local-review`.
- Live API with Merchant JWT and mismatched route merchant returned the token subject merchant `merchant-local-review`, proving JWT merchant scope overrides path compatibility.
- `docker compose up -d --build merchant` with `DOCKER_BUILDKIT=0` completed.
- Served bundle `http://localhost:5174/assets/index-BGoWLiFJ.js` contains `draft-context`, does not contain `localDraftMasterDataContext`, `franchise-local-review`, or `category-local-review`, and contains `Authorization` logic.
- Browser verification on `http://localhost:5174/` confirmed `商户运营工作台`, `履约订单`, `商品草稿`, and `商户结算` were visible with no draft-context load error and no console errors.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 5: Completion

- [x] Commit feature work on `codex/merchant-draft-master-context`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks and merge.
- [x] Create docs-only completion PR after feature merge.

Evidence:
- Feature branch: `codex/merchant-draft-master-context`.
- Feature commit: `e1491dce60e4c2426f7830ee0630d8283dd1f4a2`.
- Feature PR: #267 `feat: derive merchant draft context from api`.
- GitHub Actions for PR #267 passed: `Project docs check` run 538, including `docs-check` and `project-foundation-check`.
- Feature PR #267 squash-merged to `main` at `6c4cdb66ea21b9d811c5b4215876baf4f2fd2ec4`.
- Docs-only completion branch: `codex/docs-merchant-draft-master-context-complete`.
