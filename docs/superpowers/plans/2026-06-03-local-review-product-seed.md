# Local Review Product Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an idempotent local seed command that creates one complete `pending_review` product so Admin runtime verification can show real SKU/media/qualification/parameter/detail data.

**Architecture:** Add a local-only Prisma seed script under the API package. The script upserts fixed sample franchise, merchant, category, brand, product, child master-data records, one draft snapshot, and one merchant `submit_review` log; it resets only the fixed sample product's child records so repeated runs are stable.

**Tech Stack:** NestJS API workspace, Prisma Client, TypeScript, tsx, Jest.

---

## File Structure

- Create: `apps/api/src/dev/seed-local-review-product.ts` for the seed function and CLI entry.
- Create: `apps/api/test/dev/seed-local-review-product.spec.ts` for a unit contract around the seed operations.
- Modify: `apps/api/package.json` to add `seed:local-review-product`.
- Modify: root `package.json` to add `seed:local-review-product`.
- Modify: `apps/admin/src/App.tsx` and `apps/admin/src/App.test.tsx` so the local sample's product code is visible in the review queue.

## Task 1: RED Seed Contract

- [x] **Step 1: Write failing seed test**

Create `apps/api/test/dev/seed-local-review-product.spec.ts` that imports `seedLocalReviewProduct`, passes a Prisma mock with `$transaction`, and asserts the transaction:

- upserts `franchise-local-review`, `merchant-local-review`, `category-local-review`, `brand-local-review`, and `product-local-review`
- sets product status to `pending_review`
- creates `SKU-LOCAL-REVIEW-5KG`
- creates `main_image`, `detail_image`, `origin_certificate`, `净含量`, and `福利说明`
- writes a `submit_review` log

- [x] **Step 2: Run focused seed test**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/dev/seed-local-review-product.spec.ts --runInBand
```

Expected: FAIL because the seed module does not exist.

## Task 2: GREEN Seed Implementation

- [x] **Step 1: Implement seed module**

Create `apps/api/src/dev/seed-local-review-product.ts` with:

- exported `seedLocalReviewProduct(prisma)` function
- fixed IDs and sample payload constants
- transaction that deletes only child records for `product-local-review`
- upserts foundation rows and product row
- recreates SKU/media/qualification/parameter/detail/draft snapshot/review log rows
- CLI entry that constructs `PrismaClient`, runs the seed, prints the product code/status, and disconnects

- [x] **Step 2: Add package scripts**

Add:

```json
"seed:local-review-product": "cross-env DATABASE_URL=mysql://welfare_mall:welfare_mall_password@127.0.0.1:3306/welfare_mall_v2 tsx src/dev/seed-local-review-product.ts"
```

to `apps/api/package.json`, and add root script:

```json
"seed:local-review-product": "pnpm --filter @welfare-mall/api run seed:local-review-product"
```

- [x] **Step 3: Run focused seed test**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- test/dev/seed-local-review-product.spec.ts --runInBand
```

Expected: PASS.

## Task 3: Verification And Runtime

- [x] **Step 1: Run full verification**

Run:

```powershell
pnpm run verify
pnpm run build
git diff --check
```

Expected: all pass; Windows CRLF warnings are acceptable.

- [x] **Step 2: Seed local database**

Run:

```powershell
pnpm run seed:local-review-product
```

Expected: command prints `P-LOCAL-REVIEW-001 pending_review`.

- [x] **Step 3: Runtime API and browser check**

Start or reuse API/Admin dev servers, then verify:

```powershell
curl.exe -s "http://localhost:3000/api/products/review-queue?status=pending_review"
```

Expected: response contains `P-LOCAL-REVIEW-001`, `SKU-LOCAL-REVIEW-5KG`, `产地证明`, `净含量`, and `福利说明`.

Open `http://localhost:5173/` in the in-app browser and confirm the same details are visible with no console errors.

The Admin queue row also shows the product code, so the local sample can be identified unambiguously during browser checks.

## Task 4: GitHub

- [ ] **Step 1: Commit, push, PR, merge**

Commit on `codex/local-review-product-seed`, push to GitHub, create a PR to `main`, merge after it is mergeable, and fast-forward local `main`.

## Acceptance Boundary

This slice is local-development seed data only. It does not define production seed data, production migrations, formal business acceptance, or target-environment deployment.
