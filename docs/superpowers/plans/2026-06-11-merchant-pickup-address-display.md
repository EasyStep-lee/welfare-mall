# Merchant Pickup Address Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Merchant fulfillment UI from displaying historical pickup-store names by showing pickup fulfillment addresses from the merchant address snapshot.

**Architecture:** Keep the existing Merchant Vue fulfillment queue and API response shape. The API still carries `pickupStoreName` as a compatibility field, but Merchant Vue treats it as non-display data and renders pickup contact text from `fulfillmentMerchantAddress`. Delivery orders keep their receiver contact display.

**Business Constraints:** The platform has no core shop/store model. Merchant is the fulfillment party and has an actual address. Pickup address display must come from the merchant fulfillment address snapshot, not from `pickupStoreName`.

**Out of Scope:** Removing `pickupStoreName` from API schema or database persistence, checkout pickup validation, buyer Portal/miniprogram pickup display, formal merchant address management UI, and replacing remaining fixed local merchant IDs in Merchant tests.

---

### Task 1: RED Merchant Pickup Address Test

**Files:**
- Modify: `apps/merchant/src/App.test.ts`

- [x] **Step 1: Require pickup fulfillment to show merchant address**

Update the pickup fulfillment test to assert `自提地址 上海市浦东新区世纪大道 88 号`.

- [x] **Step 2: Require legacy pickup-store text to stay hidden**

Assert the same UI does not contain the compatibility fixture `浦东福利自提点`.

- [x] **Step 3: Verify RED**

Run the focused Merchant test and confirm it fails because the UI still shows `浦东福利自提点` and lacks `自提地址 ...`.

Evidence:
- Initial focused RED failed because Merchant Vue rendered `浦东福利自提点` from `pickupStoreName` and did not render `自提地址 上海市浦东新区世纪大道 88 号`.

### Task 2: GREEN Merchant Pickup Address Display

**Files:**
- Modify: `apps/merchant/src/App.ts`

- [x] **Step 1: Add pickup-aware contact text helper**

Add `orderContactOrPickupText(order)` that returns `自提地址 ${orderFulfillmentAddressText(order)}` for pickup orders.

- [x] **Step 2: Keep delivery contact display unchanged**

For non-pickup orders, return the existing receiver name/phone/address text or `收货信息待确认`.

- [x] **Step 3: Render fulfillment cards through the helper**

Replace the direct `pickupStoreName` fallback in `renderFulfillmentPanel` with `orderContactOrPickupText(order)`.

Evidence:
- Focused Merchant pickup test passed after implementation.

### Task 3: Boundary Documentation

**Files:**
- Modify: `docs/business-boundary-known-deviations.json`

- [x] **Step 1: Remove Merchant App active display deviation**

Delete the `apps/merchant/src/App.ts` deviation after source no longer references `pickupStoreName`.

- [x] **Step 2: Narrow Merchant test deviation**

Keep `apps/merchant/src/App.test.ts` listed only for compatibility fixtures and fixed local merchant IDs.

### Task 4: Verification

- [x] Run focused Merchant pickup test.
- [x] Run Merchant full component tests.
- [x] Run Merchant typecheck.
- [x] Run business-boundary guard.
- [x] Run full `pnpm run verify`.
- [x] Rebuild/restart Docker Merchant served bundle.
- [x] Verify source, served bundle, and browser behavior on `http://localhost:5174/`.
- [x] Run Docker runtime and page smoke checks.

Evidence:
- `pnpm --filter @welfare-mall/merchant test -- --run src/App.test.ts --testNamePattern "requires the visible pickup code"` passed.
- `pnpm --filter @welfare-mall/merchant test -- --run src/App.test.ts` passed with 14 Merchant Vue component tests.
- `pnpm --filter @welfare-mall/merchant run typecheck` passed.
- `pnpm run verify:business-boundary` passed with 28 known deviation files tracked.
- `pnpm run verify` passed across frontend stack boundary, business boundary, Prisma generate, lint/typecheck, API Jest, Admin Vitest, Merchant Vitest, Portal Vitest, and user-miniprogram Vitest.
- Docker Merchant image rebuilt and container restarted; `docker compose ps merchant` reported `welfare-mall-v2-merchant` healthy on port 5174.
- Served bundle `/assets/index-C7OJa2J1.js` contains `自提地址` and does not contain `浦东福利自提点` or `pickupStoreName`.
- Browser verified `http://localhost:5174/` login into Merchant workbench, pickup fulfillment text renders through `自提地址 ...`, old pickup-store fixture text is absent, and console error logs are empty.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:page-smoke` passed.

### Task 5: Completion

- [x] Commit feature work on `codex/merchant-pickup-address-display`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks and merge.
- [x] Create docs-only completion PR after feature merge.

Evidence:
- Feature commit `43b6473 fix: show merchant pickup address from merchant snapshot` was pushed on `codex/merchant-pickup-address-display`.
- PR #273 `fix: show merchant pickup address from merchant snapshot` passed GitHub `Project docs check` and was squash-merged into `main` as `10717fd`.
- Docs-only completion branch `codex/docs-merchant-pickup-address-display-complete` records this completion state.
