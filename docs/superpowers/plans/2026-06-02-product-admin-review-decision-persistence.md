# Product Admin Review Decision Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend persistence for Admin product review decisions so pending products can be approved or rejected with review logs.

**Architecture:** Keep Admin review decisions in the product domain, parallel to merchant review submission. Add a transactional repository that reads the product status, applies the existing status transition catalog for `admin`, updates `product.status`, and writes `product_review_log`. Add a service to convert repository outcomes into HTTP errors and a controller endpoint for Admin decisions.

**Tech Stack:** NestJS, Prisma Client, MySQL 8.4 via Docker Compose, Jest + Supertest.

---

## Files

- Create: `apps/api/src/product/product-review-decision.repository.ts`
- Create: `apps/api/src/product/product-review-decision.service.ts`
- Create: `apps/api/test/product-review-decision.e2e-spec.ts`
- Create: `apps/api/test/product/product-review-decision.repository.spec.ts`
- Modify: `apps/api/src/product/product.controller.ts`
- Modify: `apps/api/src/product/product.module.ts`
- Modify: `apps/api/test/product-draft-save.db-test.ts`
- Modify: `packages/contracts/openapi/welfare-mall-api.openapi.json`
- Create: `docs/superpowers/plans/2026-06-02-product-admin-review-decision-persistence.md`

## API Contract

- `POST /api/products/:productId/review-decisions`
- Request body:
  - approve: `{ "action": "approve", "actorUserId": "admin-user-001" }`
  - reject: `{ "action": "reject", "actorUserId": "admin-user-001", "reason": "资质材料不完整" }`
- Success response includes `productId`, `action`, `fromStatus`, `toStatus`, and `reviewLog`.
- Missing product returns 404.
- Unsupported status/action returns 400 and does not write a review log.
- Reject without a non-empty `reason` returns 400 before calling the service.

## Tasks

### Task 1: RED API Contract

- [x] Add `apps/api/test/product-review-decision.e2e-spec.ts` with mocked decision service.
- [x] Assert approve calls service with `productId`, `action`, and `actorUserId`.
- [x] Assert reject calls service with `reason`.
- [x] Assert reject without `reason` returns 400 before service call.
- [x] Run `pnpm --filter @welfare-mall/api run test -- product-review-decision.e2e-spec.ts --runInBand`.
- [x] Expected result: fail because `ProductReviewDecisionService` and route do not exist.

### Task 2: RED Repository Contract

- [x] Add `apps/api/test/product/product-review-decision.repository.spec.ts`.
- [x] Assert approve from `pending_review` updates product to `approved` and creates an admin review log.
- [x] Assert reject from `pending_review` updates product to `rejected` and writes the reason into the review log.
- [x] Assert approve from `draft` returns a denied result without update/log writes.
- [x] Run `pnpm --filter @welfare-mall/api run test -- product-review-decision.repository.spec.ts --runInBand`.
- [x] Expected result: fail because `ProductReviewDecisionRepository` does not exist.

### Task 3: GREEN Implementation

- [x] Add `ProductReviewDecisionRepository`.
- [x] Add `ProductReviewDecisionService`.
- [x] Wire both providers into `ProductModule`.
- [x] Add `POST /api/products/:productId/review-decisions` to `ProductController`.
- [x] Run the two focused tests from Tasks 1 and 2.
- [x] Expected result: both pass.

### Task 4: Real DB Verification

- [x] Extend `apps/api/test/product-draft-save.db-test.ts` to approve the product after merchant submission.
- [x] Assert `product.status` becomes `approved`.
- [x] Assert two review logs exist: merchant `submit_review`, then admin `approve`.
- [x] Create and submit a second product draft, reject it with a reason, and assert `product.status=rejected` plus admin `reject` log reason.
- [x] Run `pnpm run verify:product-save-db`.
- [x] Expected result: pass against local MySQL.

### Task 5: Default Verification And Git

- [x] Run `pnpm run verify`.
- [x] Run `pnpm run verify:api`.
- [x] Run `pnpm run build`.
- [x] Run `git diff --check`.
- [x] Run placeholder scan over touched files.
- [ ] Commit, push, create PR, wait for GitHub Actions, mark ready, squash merge, sync `main`, and rerun `pnpm run verify` plus `pnpm run verify:product-save-db` on `main`.

## Acceptance Boundary

This slice proves Admin approve/reject review persistence in API tests and local real MySQL. It does not implement Admin browser pages, product pool publishing, archive workflow, true-device behavior, or target-environment acceptance.
