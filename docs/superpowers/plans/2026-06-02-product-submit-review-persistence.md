# Product Submit Review Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the backend command that lets a merchant submit a saved product draft for review and persists both product status and review log.

**Architecture:** Keep the workflow inside the product domain. Add a repository for transactional product status transition plus `product_review_log` creation, a service that turns repository outcomes into HTTP-safe exceptions, and a controller endpoint for merchant submission. The existing status transition catalog remains the source of allowed `draft/rejected -> pending_review` behavior.

**Tech Stack:** NestJS, Prisma Client, MySQL 8.4 via Docker Compose, Jest + Supertest.

---

## Files

- Create: `apps/api/src/product/product-review-submission.repository.ts`
- Create: `apps/api/src/product/product-review-submission.service.ts`
- Create: `apps/api/test/product-submit-review.e2e-spec.ts`
- Modify: `apps/api/src/product/product.controller.ts`
- Modify: `apps/api/src/product/product.module.ts`
- Modify: `apps/api/test/product-draft-save.db-test.ts`

## API Contract

- `POST /api/products/:productId/review-submissions`
- Request body: `{ "actorUserId": "merchant-user-001" }`
- Success response:
  - `productId`
  - `action: "submit_review"`
  - `fromStatus`
  - `toStatus: "pending_review"`
  - `reviewLog` with `id`, `productId`, `actorUserId`, `actorType`, `action`, `fromStatus`, `toStatus`, `reason`, `createdAt`
- Missing product returns 404.
- Unsupported current status returns 400 and does not write a review log.

## Tasks

### Task 1: RED API Contract

- [x] Add `apps/api/test/product-submit-review.e2e-spec.ts` with mocked submission service.
- [x] Assert success calls the service with `productId` and `actorUserId`.
- [x] Assert blank `actorUserId` returns 400 before service call.
- [x] Run `pnpm --filter @welfare-mall/api run test -- product-submit-review.e2e-spec.ts --runInBand`.
- [x] Expected result: fail because `ProductReviewSubmissionService` and controller route do not exist.

### Task 2: RED Repository Contract

- [x] Add repository tests in `apps/api/test/product/product-review-submission.repository.spec.ts`.
- [x] Assert submit from `draft` updates product status to `pending_review` and creates one review log.
- [x] Assert submit from `approved` returns a denied result and does not update or create a review log.
- [x] Run `pnpm --filter @welfare-mall/api run test -- product-review-submission.repository.spec.ts --runInBand`.
- [x] Expected result: fail because `ProductReviewSubmissionRepository` does not exist.

### Task 3: GREEN Implementation

- [x] Add `ProductReviewSubmissionRepository`.
- [x] Add `ProductReviewSubmissionService`.
- [x] Wire both providers into `ProductModule`.
- [x] Add `POST /api/products/:productId/review-submissions` to `ProductController`.
- [x] Run the two focused tests from Tasks 1 and 2.
- [x] Expected result: both pass.

### Task 4: Real DB Verification

- [x] Extend `apps/api/test/product-draft-save.db-test.ts` after draft save to call the new submit endpoint.
- [x] Assert `product.status` becomes `pending_review`.
- [x] Assert one `product_review_log` row exists with `actorType=merchant`, `action=submit_review`, `fromStatus=draft`, and `toStatus=pending_review`.
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

This slice proves merchant product review submission persistence in the API and local real MySQL. It does not implement Admin approval/rejection pages, Admin review persistence, product pool publishing, browser UI verification, true-device behavior, or target-environment acceptance.
