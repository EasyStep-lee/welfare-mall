# Product Publish Review Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the backend foundation for merchant product drafts, merchant submit-for-review, and Admin product review state transitions before building Admin or Merchant pages.

**Architecture:** This branch keeps the workflow as deterministic domain logic plus catalog endpoints. It introduces review actions, allowed transitions, submit-readiness validation, and Prisma model shells for draft snapshots and review logs, without adding database write APIs yet.

**Tech Stack:** NestJS, TypeScript, Prisma, Jest, OpenAPI, pnpm workspace.

---

## Scope

Included:

- Product review action catalog endpoint: `GET /api/products/review-actions`.
- Product review transition catalog endpoint: `GET /api/products/status-transitions`.
- Pure status transition evaluator for merchant and admin actions.
- Pure submit-readiness validator requiring SKU, main image, detail image, qualification, parameter, and origin data.
- Prisma model shell for `ProductDraftSnapshot` and `ProductReviewLog`.
- OpenAPI regeneration and verification.

Not included:

- Product create/update database write APIs.
- Admin review UI.
- Merchant publish UI.
- Inventory, stock, and fulfillment integration.
- Old product migration.

## Workflow Rules

- Merchant may save draft from `draft` or `rejected`.
- Merchant may submit `draft` or `rejected` product to `pending_review`.
- Admin may approve `pending_review` to `approved`.
- Admin may reject `pending_review` to `rejected`; rejection requires a reason.
- Admin may archive `draft`, `rejected`, or `approved` to `archived`.
- Approved products may be on sale only after review; sale status remains separate from review status.
- Submit-readiness requires SKU, main image, detail image, qualification, parameter, and origin data because Merchant/Admin pages depend on these fields.

## File Structure

Create:

- `apps/api/src/product/product-review-action.ts`
- `apps/api/src/product/product-status-transition.ts`
- `apps/api/src/product/product-submit-readiness.ts`
- `apps/api/test/product/product-status-transition.spec.ts`
- `apps/api/test/product/product-submit-readiness.spec.ts`
- `apps/api/test/product-review.e2e-spec.ts`

Modify:

- `apps/api/src/product/product.controller.ts`
- `apps/api/prisma/schema.prisma`
- `packages/contracts/openapi/welfare-mall-api.openapi.json`
- `docs/superpowers/plans/2026-06-02-product-publish-review-foundation.md`

## Task 1: Baseline Verification

- [x] **Step 1: Confirm branch**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected:

```text
## codex/product-publish-review-foundation
codex/product-publish-review-foundation
```

- [x] **Step 2: Run baseline verification**

Run:

```powershell
pnpm run verify
```

Expected: command exits 0 before workflow changes.

## Task 2: Review Actions and Transitions

**Files:**

- Create: `apps/api/test/product/product-status-transition.spec.ts`
- Create: `apps/api/src/product/product-review-action.ts`
- Create: `apps/api/src/product/product-status-transition.ts`
- Modify: `apps/api/src/product/product.controller.ts`

- [x] **Step 1: Write failing transition tests**

Create tests proving merchant submit changes `draft` to `pending_review`, admin approve changes `pending_review` to `approved`, admin reject changes `pending_review` to `rejected`, and merchant cannot approve.

- [x] **Step 2: Run tests to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-status-transition
```

Expected: FAIL because transition modules do not exist.

- [x] **Step 3: Add review action catalog and transition evaluator**

Create actions:

```text
save_draft
submit_review
approve
reject
archive
```

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-status-transition
```

Expected: transition tests pass.

## Task 3: Submit Readiness

**Files:**

- Create: `apps/api/test/product/product-submit-readiness.spec.ts`
- Create: `apps/api/src/product/product-submit-readiness.ts`

- [x] **Step 1: Write failing readiness tests**

Create tests proving a ready product has at least one SKU, one main image, one detail image, one qualification, one parameter, and origin country; also prove missing detail image blocks submit.

- [x] **Step 2: Run tests to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-submit-readiness
```

Expected: FAIL because readiness module does not exist.

- [x] **Step 3: Add submit-readiness validator**

Return:

```ts
{ ready: boolean; missingRequirements: string[] }
```

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-submit-readiness
```

Expected: readiness tests pass.

## Task 4: E2E, Prisma, and OpenAPI

**Files:**

- Create: `apps/api/test/product-review.e2e-spec.ts`
- Modify: `apps/api/src/product/product.controller.ts`
- Modify: `apps/api/prisma/schema.prisma`

- [x] **Step 1: Add e2e catalog tests**

Create tests proving `/api/products/review-actions` includes `submit_review` and `/api/products/status-transitions` includes `pending_review -> approved`.

- [x] **Step 2: Add Prisma model shells**

Add:

- `ProductDraftSnapshot`
- `ProductReviewLog`

- [x] **Step 3: Validate Prisma**

Run:

```powershell
pnpm --filter @welfare-mall/api run prisma:validate
```

Expected: schema is valid.

- [x] **Step 4: Regenerate OpenAPI**

Run:

```powershell
pnpm run openapi:generate
```

Expected: OpenAPI includes `/api/products/review-actions` and `/api/products/status-transitions`.

## Task 5: Verification and PR

- [x] **Step 1: Full verification**

Run:

```powershell
pnpm run verify:api
pnpm run build
pnpm run verify
```

Expected: all commands exit 0.

- [x] **Step 2: Runtime smoke**

Run compiled API on a temporary port and request:

```text
GET /api/products/review-actions
GET /api/products/status-transitions
```

Expected: responses include `submit_review` and `approved`.

- [x] **Step 3: Commit and push**

Run:

```powershell
git add apps/api packages/contracts docs/superpowers/plans/2026-06-02-product-publish-review-foundation.md
git commit -m "feat: add product publish review foundation"
git push -u origin codex/product-publish-review-foundation
```

Expected: branch is pushed and ready for PR.

## Self-Review

Spec coverage:

- Merchant draft/submit and Admin approve/reject/archive are represented as deterministic workflow rules.
- Submit-readiness includes SKU, main image, detail image, qualification, parameter, and origin requirements.
- UI and write APIs are intentionally deferred.

Placeholder scan:

- This plan avoids unresolved placeholder markers.

Type consistency:

- Review action codes use lower snake case.
- Status transition actors use `merchant` and `admin`.
- Product review status remains separate from sale status.

## Execution Evidence

- Baseline branch check: `git status -sb` and `git branch --show-current` confirmed `codex/product-publish-review-foundation`.
- Baseline verification: `pnpm run verify` exited 0 before workflow implementation.
- RED verification: targeted product workflow tests failed before implementation because the transition/readiness modules were missing and catalog endpoints returned 404.
- GREEN verification: `pnpm --filter @welfare-mall/api run test -- product-status-transition product-submit-readiness product-review` passed 3 suites and 8 tests.
- Prisma validation: `pnpm --filter @welfare-mall/api run prisma:validate` exited 0.
- OpenAPI generation: `pnpm run openapi:generate` exited 0 and regenerated the product catalog endpoint paths.
- API verification: `pnpm run verify:api` exited 0 with 18 suites and 37 tests passing.
- Build verification: `pnpm run build` exited 0.
- Repository verification: `pnpm run verify` exited 0 with 18 suites and 37 tests passing.
- Runtime smoke: compiled API on port 3104 returned `save_draft,submit_review,approve,reject,archive` and included `pending_review:approve->approved`.
