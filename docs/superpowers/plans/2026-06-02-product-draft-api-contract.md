# Product Draft API Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend HTTP contracts for saving a product draft snapshot and reading the latest saved draft snapshot.

**Architecture:** Keep HTTP behavior in `ProductController` and persistence behind `ProductDraftRepository`. Tests override the repository with a mock provider so this API slice remains a contract and wiring slice, not a real database integration slice.

**Tech Stack:** NestJS, TypeScript, Prisma Client, Jest, Supertest, pnpm workspace.

---

## Scope

Included:

- `POST /api/products/:productId/draft-snapshots` saves a draft snapshot through `ProductDraftRepository`.
- `GET /api/products/:productId/draft-snapshots/latest` returns the latest draft snapshot through `ProductDraftRepository`.
- Request body requires `payload` and `createdBy`.
- Responses serialize `createdAt` as an ISO string.
- Contract tests use a mock repository and do not require MySQL.

Not included:

- Real database integration tests.
- Product create/update transactions.
- Review submission persistence.
- Authentication, authorization, or audit logging.
- Admin or merchant UI.

## API Contract

Save request:

```json
{
  "createdBy": "merchant-user-001",
  "payload": {
    "code": "P-RICE-001",
    "name": "东北五常大米福利装",
    "merchantId": "merchant-001",
    "franchiseId": "franchise-001",
    "categoryId": "category-rice",
    "originCountry": "中国",
    "skus": [{ "code": "SKU-RICE-5KG", "priceAmount": 6990, "marketPriceAmount": 8990, "specs": [{ "name": "规格", "value": "5kg" }] }],
    "media": [
      { "type": "main_image", "url": "https://cdn.example.com/products/rice-main.jpg" },
      { "type": "detail_image", "url": "https://cdn.example.com/products/rice-detail.jpg" }
    ],
    "qualifications": [{ "type": "origin_certificate", "title": "产地证明" }],
    "parameters": [{ "groupName": "基础参数", "name": "净含量", "value": "5kg", "valueType": "text" }],
    "detailSections": [{ "type": "image", "imageUrl": "https://cdn.example.com/products/rice-detail-1.jpg" }]
  }
}
```

Snapshot response:

```json
{
  "id": "snapshot-001",
  "productId": "product-001",
  "versionNo": 1,
  "payload": {
    "code": "P-RICE-001",
    "name": "东北五常大米福利装"
  },
  "createdBy": "merchant-user-001",
  "createdAt": "2026-06-02T00:00:00.000Z"
}
```

Latest snapshot missing response:

```json
{
  "snapshot": null
}
```

## File Structure

Create:

- `apps/api/test/product-draft-snapshot.e2e-spec.ts`

Modify:

- `apps/api/src/product/product.controller.ts`
- `packages/contracts/openapi/welfare-mall-api.openapi.json`
- `docs/superpowers/plans/2026-06-02-product-draft-api-contract.md`

## Task 1: Baseline

- [x] **Step 1: Confirm branch**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected:

```text
## codex/product-draft-api-contract
codex/product-draft-api-contract
```

- [x] **Step 2: Run baseline verification**

Run:

```powershell
pnpm run verify
```

Expected: command exits 0 before API implementation.

Evidence: `pnpm run verify` exited 0 before API implementation; 21 suites and 47 tests passed.

## Task 2: Save Draft Snapshot API

**Files:**

- Create: `apps/api/test/product-draft-snapshot.e2e-spec.ts`
- Modify: `apps/api/src/product/product.controller.ts`

- [x] **Step 1: Write failing e2e contract test**

Add a Supertest app that imports `AppModule`, overrides `ProductDraftRepository`, and proves `POST /api/products/product-001/draft-snapshots` calls `saveSnapshot()` with `productId`, `payload`, and `createdBy`.

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft-snapshot
```

Expected: FAIL with 404 because the save endpoint does not exist.

Evidence: targeted Jest run failed with 404 for `POST /api/products/product-001/draft-snapshots`.

- [x] **Step 3: Implement save endpoint**

Update `ProductController` constructor:

```ts
constructor(private readonly productDraftRepository: ProductDraftRepository) {}
```

Add:

```ts
@Post(':productId/draft-snapshots')
@HttpCode(201)
async saveDraftSnapshot(@Param('productId') productId: string, @Body() input: SaveProductDraftSnapshotRequest) {
  const snapshot = await this.productDraftRepository.saveSnapshot({
    productId,
    payload: input.payload,
    createdBy: input.createdBy
  });

  return toProductDraftSnapshotResponse(snapshot);
}
```

- [x] **Step 4: Run test to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft-snapshot
```

Expected: save endpoint test passes.

Evidence: save endpoint test passed. A runtime validation test was added so missing `payload` or `createdBy` returns 400 before the repository is called.

## Task 3: Latest Draft Snapshot API

**Files:**

- Modify: `apps/api/test/product-draft-snapshot.e2e-spec.ts`
- Modify: `apps/api/src/product/product.controller.ts`

- [x] **Step 1: Write failing latest snapshot tests**

Add two tests:

- `GET /api/products/product-001/draft-snapshots/latest` returns `{ snapshot: ... }` when a snapshot exists.
- `GET /api/products/product-missing/draft-snapshots/latest` returns `{ snapshot: null }` when none exists.

- [x] **Step 2: Run test to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft-snapshot
```

Expected: FAIL with 404 because the latest snapshot endpoint does not exist.

Evidence: targeted Jest run failed with 404 for `GET /api/products/:productId/draft-snapshots/latest`.

- [x] **Step 3: Implement latest endpoint**

Add:

```ts
@Get(':productId/draft-snapshots/latest')
async getLatestDraftSnapshot(@Param('productId') productId: string) {
  const snapshot = await this.productDraftRepository.findLatestSnapshot(productId);

  return {
    snapshot: snapshot ? toProductDraftSnapshotResponse(snapshot) : null
  };
}
```

- [x] **Step 4: Run test to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft-snapshot
```

Expected: all product draft snapshot API tests pass.

Evidence: `pnpm --filter @welfare-mall/api run test -- product-draft-snapshot` exited 0; 4 tests passed.

## Task 4: Verification and PR

- [x] **Step 1: Full verification**

Run:

```powershell
pnpm run verify:api
pnpm run build
pnpm run verify
git diff --check
rg -n "T[O]DO|F[I]XME|P[L]ACEHOLDER|T[B]D|待[补]|占[位]" apps/api/src apps/api/test docs/superpowers/plans/2026-06-02-product-draft-api-contract.md
```

Expected: all commands exit 0; the placeholder scan returns no matches.

Evidence: `pnpm run verify:api`, `pnpm run build`, and `pnpm run verify` exited 0. The full API test suite now has 22 suites and 51 tests. `git diff --check` exited 0, and placeholder scan returned no matches.

- [ ] **Step 2: Commit and push**

Run:

```powershell
git add apps/api packages/contracts/openapi/welfare-mall-api.openapi.json docs/superpowers/plans/2026-06-02-product-draft-api-contract.md
git commit -m "feat: add product draft snapshot api contract"
git push -u origin codex/product-draft-api-contract
```

Expected: branch is pushed and ready for PR.

- [ ] **Step 3: PR, CI, merge, sync main**

Create a draft PR, wait for CI, mark ready, squash merge, sync local `main`, and run `pnpm run verify` on `main`.

## Self-Review

Spec coverage:

- Covers save and latest-read HTTP contracts.
- Keeps database integration and UI out of scope.
- Uses the existing repository boundary instead of putting persistence logic in the controller.

Placeholder scan:

- This plan has no unresolved placeholder markers.

Type consistency:

- `SaveProductDraftSnapshotRequest`, `ProductDraftSnapshotResponse`, and `ProductDraftRepository` names are consistent across the plan.
