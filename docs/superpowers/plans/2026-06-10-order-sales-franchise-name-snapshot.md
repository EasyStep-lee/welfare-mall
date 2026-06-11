# Order Sales Franchise Name Snapshot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist a display-safe sales franchise name on checkout orders so order-facing UIs and APIs do not have to show raw franchise IDs or infer the seller from current product data.

**Architecture:** Extend the existing order business-subject snapshot with nullable `OrderHeader.salesFranchiseName`. Checkout already resolves product business facts before order creation; include the product's `franchise.name` in that query, require the same single sales franchise, and write both `salesFranchiseId` and `salesFranchiseName`. Read, cancel, payment, and fulfillment projections must include the new field.

**Business Constraints:** Franchise is the actual sales party and welfare-card issuer. Merchant publishes goods, owns an actual address, and fulfills goods. This slice must not introduce any store/shop subject and must not add offline cash payment.

**Out of Scope:** Login identity replacement, settlement payout records, removing legacy `pickupStoreName`, multi-franchise checkout splitting, Portal/Admin/Merchant display rewrites, true-device verification, target-environment deployment, and formal acceptance.

---

### Task 1: RED Checkout Test

**Files:**
- Modify: `apps/api/test/order/order-checkout.repository.spec.ts`

- [x] **Step 1: Require franchise name persistence**

Cover:
- Checkout product fact query selects `franchise.id` and `franchise.name`.
- Checkout writes `salesFranchiseName` beside `salesFranchiseId`.

Evidence:
- `pnpm --filter @welfare-mall/api run test --runInBand --testPathPatterns=order-checkout.repository.spec.ts` failed because `orderHeader.create` did not include `salesFranchiseName`.

### Task 2: GREEN API Snapshot

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/order/order-checkout.repository.ts`
- Modify: `apps/api/src/order/order-read.repository.ts`
- Modify: `apps/api/src/order/order-cancel.repository.ts`
- Modify: `apps/api/src/order/order-payment.repository.ts`
- Modify: `apps/api/src/order/order-fulfillment.repository.ts`
- Modify: `tools/verify-docker-order-flow-smoke.cjs`

- [x] **Step 1: Add nullable order-header field**

Add `salesFranchiseName String?` to `OrderHeader`.

- [x] **Step 2: Resolve and write snapshot**

Add franchise name to the checkout product business fact query and persist it to the order header.

- [x] **Step 3: Return snapshot from order paths**

Include `salesFranchiseName` in order checkout, read, cancel, payment, and fulfillment selects.

- [x] **Step 4: Guard Docker order flow**

Update `docker:order-flow-smoke` to assert the created local runtime order includes the expected sales franchise name.

### Task 3: Verification

- [x] Run focused order tests.
- [x] Run Prisma generate/typecheck where schema changes require it.
- [x] Run full `pnpm run verify`.
- [x] Run Docker runtime and order-flow smoke.

Evidence:
- `pnpm --filter @welfare-mall/api run test --runInBand --testPathPatterns=order-checkout.repository.spec.ts order-checkout.service.spec.ts order-read.repository.spec.ts order-payment.repository.spec.ts order-fulfillment.repository.spec.ts order-cancel.repository.spec.ts` passed: 6 files, 38 tests.
- `pnpm --filter @welfare-mall/api run prisma:generate` passed.
- `pnpm --filter @welfare-mall/api run typecheck` passed.
- `pnpm run verify` passed, including frontend stack, business boundary, Prisma generate, lint, typecheck, and all package tests.
- `git diff --check` passed with only Windows LF/CRLF warnings.
- `pnpm run docker:runtime:up` rebuilt/restarted the Docker runtime and synced the MySQL schema through the API container startup.
- `pnpm run docker:runtime:smoke` passed.
- `pnpm run docker:order-flow-smoke` passed: `ORDER-20260611023838275-RUAWKT`.
- `pnpm run docker:page-smoke` passed.
- MySQL direct verification for the latest smoke order returned `salesFranchiseId=franchise-local-review`, `salesFranchiseName=本地福利卡中心`, `fulfillmentMerchantId=merchant-local-review`, and `fulfillmentMerchantName=本地优选商户`.

### Task 4: Completion

- [ ] Commit feature work on `codex/order-sales-franchise-name-snapshot`.
- [ ] Push branch and open PR.
- [ ] Wait for GitHub checks and merge.
- [ ] Create docs-only completion PR after feature merge.
