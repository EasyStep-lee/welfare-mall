# Order Sales and Merchant Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist the core order business subjects at checkout time so order reads no longer have to infer the sales franchise and fulfillment merchant only from current product data.

**Architecture:** Add nullable order-header snapshot fields for `salesFranchiseId`, `fulfillmentMerchantId`, `fulfillmentMerchantName`, and `fulfillmentMerchantAddress`. Add a merchant `address` field as the source for the address snapshot. Keep `pickupStoreName` as compatibility data for now; do not introduce any store/shop subject.

**Business Constraints:** Franchise is the sales party and welfare-card issuer. Merchant publishes and fulfills goods and has an actual address. A checkout order must resolve to one sales franchise. User payment remains welfare card plus online WeChat/Alipay remainder; no offline cash channel is introduced.

**Out of Scope:** Removing `pickupStoreName`, splitting multi-merchant order headers into per-merchant header records, formal login identity replacement, and true runtime acceptance against target environments.

---

### Task 1: RED Checkout Snapshot Test

**Files:**
- Modify: `apps/api/test/order/order-checkout.repository.spec.ts`

- [x] **Step 1: Require order-header business snapshots**

Cover:
- Checkout reads each product's franchise, merchant, merchant name, and merchant address.
- Checkout writes `salesFranchiseId`, `fulfillmentMerchantId`, `fulfillmentMerchantName`, and `fulfillmentMerchantAddress` to the order header.

Evidence:
- `pnpm --filter @welfare-mall/api run test --runInBand --testPathPatterns=order-checkout.repository.spec.ts` failed because `orderHeader.create` did not include the sales/fulfillment snapshot fields.

### Task 2: GREEN Checkout Snapshot Persistence

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/order/order-checkout.repository.ts`
- Modify: `apps/api/src/order/order-read.repository.ts`
- Modify: `apps/api/src/order/order-fulfillment.repository.ts`
- Modify: `apps/api/src/order/order-payment.repository.ts`
- Modify: `apps/api/src/order/order-cancel.repository.ts`
- Modify: `apps/api/src/dev/seed-local-review-product.ts`
- Modify: `tools/start-docker-runtime.ps1`
- Modify: `tools/verify-docker-order-flow-smoke.cjs`

- [x] **Step 1: Add nullable schema fields**

Added merchant `address` plus nullable order-header sales/fulfillment snapshot fields and indexes.

- [x] **Step 2: Resolve and persist checkout snapshots**

Checkout now resolves product franchise and merchant facts before creating the order, requires a single sales franchise, and stores a single fulfillment merchant snapshot when all order lines belong to the same merchant.

- [x] **Step 3: Return snapshots from order read paths**

Order checkout, read, fulfillment, payment, and cancel selects now include the new snapshot fields where they return `OrderCheckoutRecord` data.

Evidence:
- `pnpm --filter @welfare-mall/api run test --runInBand --testPathPatterns=order-checkout.repository.spec.ts` passed: 1 file, 3 tests.
- `pnpm --filter @welfare-mall/api run prisma:generate` passed.
- `pnpm --filter @welfare-mall/api run typecheck` passed.
- `pnpm run docker:order-flow-smoke` failed before runtime backfill with `Created order did not include a fulfillment merchant address snapshot`.
- `tools/start-docker-runtime.ps1` now backfills the local review merchant address without rerunning the destructive product seed.

### Task 3: Verification

- [x] Run focused order tests.
- [x] Run full `pnpm run verify`.
- [x] Run `git diff --check`.
- [x] Run Docker runtime verification if API schema changes require DB sync.

Evidence:
- `pnpm --filter @welfare-mall/api run test --runInBand --testPathPatterns=order-checkout.repository.spec.ts order-checkout.service.spec.ts order-read.repository.spec.ts order-payment.repository.spec.ts order-fulfillment.repository.spec.ts order-cancel.repository.spec.ts` passed: 6 files, 38 tests.
- `pnpm run verify:business-boundary` passed.
- `git diff --check` passed with only Windows LF/CRLF warnings.
- `pnpm run verify` passed, including frontend-stack, business-boundary, Prisma generate, lint, typecheck, API tests, Admin tests, Merchant tests, Portal tests, and user mini-program tests.
- `pnpm run docker:runtime:up` rebuilt/restarted the Docker runtime and synced the MySQL schema through the API container startup.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:order-flow-smoke` passed after adding the snapshot assertion: `ORDER-20260611020456410-0HKR25`.
- `pnpm run docker:page-smoke` passed.
- MySQL direct verification for the latest smoke order returned `salesFranchiseId=franchise-local-review`, `fulfillmentMerchantId=merchant-local-review`, and `fulfillmentMerchantAddress=Shanghai Pudong Local Runtime Road 88`.

### Task 4: Completion

- [x] Commit feature work on `codex/order-sales-merchant-snapshots`.
- [x] Push branch and open PR.
- [x] Wait for GitHub checks.
- [x] Merge PR to `main`.
- [x] Prepare docs-only completion PR marking this plan complete after the feature merge.

Evidence:
- Feature branch: `codex/order-sales-merchant-snapshots`.
- Feature commit: `21c5ecd feat: persist order sales merchant snapshots`.
- Feature PR: #255 `feat: persist order sales merchant snapshots`.
- GitHub Actions for PR #255 passed: `Project docs check` run 514, including `project-foundation-check` and `docs-check`.
- Feature PR #255 squash-merged to `main` at `fe3be94 feat: persist order sales merchant snapshots`.
- Docs-only completion branch: `codex/docs-order-sales-merchant-snapshots-complete`.
