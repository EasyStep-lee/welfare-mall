# Product Draft Repository Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the PrismaService and ProductDraftRepository foundation for saving and reading product draft snapshots without introducing database-dependent runtime endpoints yet.

**Architecture:** Keep persistence behind a focused repository that can be tested with a Prisma-shaped mock. The repository assigns the next draft version from the latest saved snapshot, creates `ProductDraftSnapshot`, and reads the latest snapshot by `productId`; Nest providers are registered without eager database connection.

**Tech Stack:** NestJS, TypeScript, Prisma Client, Jest, pnpm workspace.

---

## Scope

Included:

- PrismaService wrapper for the API app.
- ProductDraftRepository for `ProductDraftSnapshot` save/read behavior.
- Repository tests using a Prisma-shaped mock.
- ProductModule provider registration.

Not included:

- HTTP write/read endpoints.
- Real database integration tests.
- Product create/update transactions.
- Product review submission persistence.
- Merchant/Admin UI.

## Repository Rules

- `saveSnapshot()` requires `productId`, `createdBy`, and the draft command payload.
- Version number starts at 1 when no prior snapshot exists for the product.
- Version number increments from the latest existing snapshot for the product.
- `findLatestSnapshot()` returns the latest snapshot for one product or `null`.
- The repository returns a compact summary instead of leaking raw Prisma rows into controllers or services.

## File Structure

Create:

- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/src/product/product-draft.repository.ts`
- `apps/api/test/product/product-draft.repository.spec.ts`

Modify:

- `apps/api/src/product/product.module.ts`
- `apps/api/package.json`
- `package.json`
- `docs/superpowers/plans/2026-06-02-product-draft-repository-foundation.md`

## Task 1: Baseline

- [x] **Step 1: Confirm branch**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected:

```text
## codex/product-draft-repository-foundation
codex/product-draft-repository-foundation
```

- [x] **Step 2: Run baseline verification**

Run:

```powershell
pnpm run verify
```

Expected: command exits 0 before repository implementation.

Evidence: `pnpm run verify` exited 0 before implementation; 20 suites and 42 tests passed.

## Task 2: Repository Contract

**Files:**

- Create: `apps/api/test/product/product-draft.repository.spec.ts`
- Create: `apps/api/src/product/product-draft.repository.ts`

- [x] **Step 1: Write failing repository tests**

Write tests proving:

- A first snapshot is created as version 1.
- A later snapshot increments from the latest version.
- Latest snapshot read returns a compact summary.
- Missing latest snapshot returns `null`.

- [x] **Step 2: Run tests to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft.repository
```

Expected: FAIL because `product-draft.repository.ts` does not exist.

Evidence: targeted Jest run failed with `Cannot find module '../../src/product/product-draft.repository'`.

- [x] **Step 3: Add repository implementation**

Implement:

```ts
ProductDraftRepository.saveSnapshot(input)
ProductDraftRepository.findLatestSnapshot(productId)
```

Use Prisma methods:

```ts
productDraftSnapshot.findFirst()
productDraftSnapshot.create()
```

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft.repository
```

Expected: repository tests pass.

Evidence: repository behavior tests passed after implementation. A Prisma Client generation failure was then traced to missing `prisma generate` in the verification chain and fixed by adding `prisma:generate`.

## Task 3: PrismaService and Module Registration

**Files:**

- Create: `apps/api/src/prisma/prisma.service.ts`
- Modify: `apps/api/src/product/product.module.ts`

- [x] **Step 1: Add provider registration test**

Add a test proving `ProductModule` exposes `ProductDraftRepository` through Nest DI.

- [x] **Step 2: Run tests to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft.repository
```

Expected: FAIL because `PrismaService` and module providers are not registered.

Evidence: targeted Jest run failed with `Nest could not find ProductDraftRepository element`.

- [x] **Step 3: Add PrismaService and register providers**

Create:

```ts
export class PrismaService extends PrismaClient {}
```

Update `ProductModule` providers:

```ts
providers: [PrismaService, ProductDraftRepository],
exports: [ProductDraftRepository]
```

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft.repository
```

Expected: repository and DI tests pass.

Evidence: `pnpm --filter @welfare-mall/api run test -- product-draft.repository` exited 0; 5 tests passed.

## Task 4: Verification and PR

- [x] **Step 1: Full verification**

Run:

```powershell
pnpm run verify:api
pnpm run build
pnpm run verify
```

Expected: all commands exit 0.

Evidence: `pnpm run verify:api` exited 0; 21 suites and 47 tests passed, Prisma schema validated, and OpenAPI generation completed. `pnpm run build` and `pnpm run verify` also exited 0.

- [ ] **Step 2: Commit and push**

Run:

```powershell
git add apps/api package.json docs/superpowers/plans/2026-06-02-product-draft-repository-foundation.md
git commit -m "feat: add product draft repository foundation"
git push -u origin codex/product-draft-repository-foundation
```

Expected: branch is pushed and ready for PR.

- [ ] **Step 3: PR, CI, merge, sync main**

Create a draft PR, wait for CI, mark ready, squash merge, sync local `main`, and run `pnpm run verify` on `main`.

## Self-Review

Spec coverage:

- Covers PrismaService introduction and product draft snapshot repository behavior.
- Keeps database integration and HTTP endpoints out of this slice.
- Preserves local e2e independence by avoiding eager database connection in PrismaService.

Placeholder scan:

- This plan has no unresolved placeholder markers.

Type consistency:

- Repository method names and snapshot summary fields are consistent across tasks.
