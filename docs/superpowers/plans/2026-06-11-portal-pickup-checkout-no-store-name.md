# Portal Pickup Checkout No Store Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Portal checkout from sending the legacy `pickupStoreName` field for pickup orders.

**Architecture:** Keep the Portal fulfillment mode UI label as `商户自提`, but build pickup checkout payloads as `{ type: 'pickup' }` only. API `pickupStoreName` remains a backend compatibility field for old clients, not an active Portal order input.

**Tech Stack:** Vue 3 + Vite Portal, Vitest component tests, Docker served bundle verification, in-app browser runtime verification.

**Business Constraints:** The platform has no core shop/store model. Merchant is the fulfillment party and has an actual address. Pickup order address must come from the order `fulfillmentMerchantAddress` snapshot, not from a Portal-provided pickup-store name.

**Out of Scope:** Removing backend `pickupStoreName` schema compatibility, renaming the visible fulfillment mode label, user-miniprogram checkout cleanup, and historical order data repair.

---

### Task 1: RED Portal Pickup Payload Test

**Files:**
- Modify: `apps/portal/src/App.test.ts`

- [x] **Step 1: Require pickup checkout payload to omit pickupStoreName**

Update `creates a local pickup checkout order from the product detail panel` so it asserts:
- request body `fulfillment` equals `{ type: 'pickup' }`
- request body `fulfillment` does not have property `pickupStoreName`
- visible UI still contains `商户自提` as the fulfillment mode label

- [x] **Step 2: Verify RED**

Run the focused Portal test and confirm it fails because current Portal still sends `pickupStoreName: '商户自提'`.

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- --run src/App.test.ts --testNamePattern "creates a local pickup checkout order"` failed because `checkoutBody.fulfillment` still had `pickupStoreName: "商户自提"`.

### Task 2: GREEN Portal Payload Alignment

**Files:**
- Modify: `apps/portal/src/App.vue`
- Modify: `apps/portal/src/api.ts`
- Modify: `docs/business-boundary-known-deviations.json`

- [x] **Step 1: Remove local pickup compatibility payload**

Delete the `localPickup` object and return `{ type: 'pickup' as const }` from `checkoutFulfillmentPayload()`.

- [x] **Step 2: Update Portal checkout input type**

Change the pickup branch of `PortalOrderCheckoutInput['fulfillment']` to `{ type: 'pickup' }`.

- [x] **Step 3: Keep visible fulfillment label unchanged**

Do not rename the checkout mode button or summary label in this slice.

- [x] **Step 4: Update business-boundary deviation list**

Remove the stale `apps/portal/src/App.vue` known deviation after the file no longer contains scanned pickup-store risk, and narrow the API checkout service deviation from pickup-store validation to legacy compatibility normalization.

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- --run src/App.test.ts --testNamePattern "creates a local pickup checkout order"` passed after Portal pickup payload changed to `{ type: 'pickup' }`.

### Task 3: Verification

- [x] Run focused Portal pickup checkout test.
- [x] Run full Portal component tests.
- [x] Run Portal typecheck.
- [x] Run business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker Portal served bundle.
- [x] Verify served bundle on `http://localhost:5175/`.
- [x] Verify browser behavior on `http://localhost:5175/`.
- [x] Run Docker runtime/page smoke checks.

Evidence:
- `pnpm --filter @welfare-mall/portal run test -- --run src/App.test.ts --testNamePattern "creates a local pickup checkout order"` passed.
- `pnpm --filter @welfare-mall/portal run test -- --run src/App.test.ts` passed with 23 component tests.
- `pnpm --filter @welfare-mall/portal run typecheck` passed.
- `pnpm run verify:business-boundary` passed with 27 known deviation files tracked after removing the stale Portal App deviation.
- `pnpm run verify` passed across frontend stack boundary, business boundary, Prisma generate, lint, typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest.
- Docker Portal image was rebuilt and `welfare-mall-v2-portal` restarted healthy on port 5175.
- Served bundle `/assets/index-Bf3LfBxU.js` contains `商户自提`, does not contain `pickupStoreName`, and does not contain `门店自提`.
- Browser verified `http://localhost:5175/` login, product detail, pickup mode selection, and order creation. The created order was `ORDER-20260611112452171-EMX0TZ`; page text did not contain `pickupStoreName` or `门店自提`, and console error logs were empty.
- Live API detail for `ORDER-20260611112452171-EMX0TZ` returned `fulfillmentType=pickup`, `pickupStoreName=null`, `salesFranchiseId=franchise-local-review`, `fulfillmentMerchantId=merchant-local-review`, and `fulfillmentMerchantAddress=Shanghai Pudong Local Runtime Road 88`.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 4: Completion

- [x] Commit feature work on `codex/portal-pickup-checkout-no-store-name`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks and merge.
- [x] Create docs-only completion PR after feature merge.

Evidence:
- Feature commit `4b935d0 fix: omit store name from portal pickup checkout` was pushed to `codex/portal-pickup-checkout-no-store-name`.
- PR #277 `fix: omit store name from portal pickup checkout` passed `Project docs check` and was squash-merged to `main` as `baab13e3`.
- Docs completion branch `codex/docs-portal-pickup-checkout-no-store-name-complete` records this plan as complete after the feature merge.
