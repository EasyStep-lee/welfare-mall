# Product Draft Command Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the backend contract foundation for merchant product draft payload validation before building Merchant/Admin pages or database write APIs.

**Architecture:** Keep this slice deterministic and testable without database coupling. The API accepts a complete product draft payload, validates master data, SKU, media, qualification, parameter, origin, and detail-section requirements, and returns submit-readiness output that pages can consume later.

**Tech Stack:** NestJS, TypeScript, Jest, Supertest, OpenAPI, pnpm workspace.

---

## Scope

Included:

- Product draft payload type covering product master data, SKU, media, qualifications, parameters, and detail sections.
- Pure draft validation function for merchant draft commands.
- `POST /api/products/draft-validation` contract endpoint.
- Contract tests and OpenAPI regeneration.

Not included:

- Database create/update transactions.
- Merchant product edit page.
- Admin review page.
- Product pool publication rules.
- Inventory or stock source integration.

## Business Rules

- Product draft command must include merchant, franchise, category, product code, product name, and origin country.
- Product draft command must include at least one SKU.
- SKU must include code, positive sale price, positive market price, and at least one spec pair.
- Product media must include one `main_image` and one `detail_image`.
- Product qualifications must include at least one qualification.
- Product parameters must include at least one structured parameter.
- Detail sections must include at least one image or text section.
- The endpoint returns deterministic issue codes rather than throwing generic errors, so Merchant/Admin pages can display business-friendly validation later.

## File Structure

Create:

- `apps/api/src/product/product-draft-command.ts`
- `apps/api/test/product/product-draft-command.spec.ts`
- `apps/api/test/product-draft-command.e2e-spec.ts`

Modify:

- `apps/api/src/product/product.controller.ts`
- `packages/contracts/openapi/welfare-mall-api.openapi.json`
- `docs/superpowers/plans/2026-06-02-product-draft-command-contract.md`

## Task 1: Baseline

- [x] **Step 1: Confirm branch**

Run:

```powershell
git status -sb
git branch --show-current
```

Expected:

```text
## codex/product-draft-command-contract
codex/product-draft-command-contract
```

- [x] **Step 2: Run baseline verification**

Run:

```powershell
pnpm run verify
```

Expected: command exits 0 before draft-command implementation.

## Task 2: Draft Command Validator

**Files:**

- Create: `apps/api/test/product/product-draft-command.spec.ts`
- Create: `apps/api/src/product/product-draft-command.ts`

- [x] **Step 1: Write failing validator tests**

Write tests proving a complete payload is valid and an incomplete payload reports missing `sku`, `main_image`, `detail_image`, `qualification`, `parameter`, `origin_country`, and `detail_section`.

- [x] **Step 2: Run tests to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft-command
```

Expected: FAIL because `product-draft-command.ts` does not exist.

- [x] **Step 3: Add draft command validator**

Implement:

```ts
validateProductDraftCommand(input: ProductDraftCommandInput): ProductDraftCommandValidationResult
```

The result shape is:

```ts
{
  valid: boolean;
  issues: Array<{ code: string; field: string; message: string }>;
  submitReadiness: { ready: boolean; missingRequirements: string[] };
}
```

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft-command
```

Expected: draft-command tests pass.

## Task 3: Endpoint and Contract

**Files:**

- Create: `apps/api/test/product-draft-command.e2e-spec.ts`
- Modify: `apps/api/src/product/product.controller.ts`

- [x] **Step 1: Write failing e2e endpoint test**

Write tests proving `POST /api/products/draft-validation` returns `valid: true` for a complete payload and includes `detail_section` when detail content is missing.

- [x] **Step 2: Run e2e tests to verify RED**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft-command
```

Expected: FAIL because `/api/products/draft-validation` does not exist.

- [x] **Step 3: Add endpoint**

Add:

```ts
@Post('draft-validation')
validateDraft(@Body() input: ProductDraftCommandInput)
```

- [x] **Step 4: Run tests to verify GREEN**

Run:

```powershell
pnpm --filter @welfare-mall/api run test -- product-draft-command
```

Expected: unit and e2e draft-command tests pass.

## Task 4: OpenAPI and Verification

- [x] **Step 1: Regenerate OpenAPI**

Run:

```powershell
pnpm run openapi:generate
```

Expected: OpenAPI includes `/api/products/draft-validation`.

- [x] **Step 2: Full verification**

Run:

```powershell
pnpm run verify:api
pnpm run build
pnpm run verify
```

Expected: all commands exit 0.

- [x] **Step 3: Runtime smoke**

Run compiled API on a temporary port and request:

```text
POST /api/products/draft-validation
```

Expected: complete payload returns `valid: true`.

- [x] **Step 4: Commit, push, PR, CI, merge**

Run the branch workflow:

```powershell
git add apps/api packages/contracts docs/superpowers/plans/2026-06-02-product-draft-command-contract.md
git commit -m "feat: add product draft command contract"
git push -u origin codex/product-draft-command-contract
```

Expected: branch is pushed, PR is created, CI passes, PR is merged to `main`, and local `main` is verified.

## Self-Review

Spec coverage:

- Covers product master data completeness before Merchant/Admin pages.
- Keeps SKU, specification, image, qualification, parameter, origin, and detail-section requirements explicit.
- Defers persistence and page implementation intentionally.

Placeholder scan:

- This plan has no unresolved placeholder markers.

Type consistency:

- Missing requirement keys match the existing submit-readiness keys where applicable.
- New `detail_section` key is only added for detail content validation.

## Execution Evidence

- Branch check: `git status -sb` and `git branch --show-current` confirmed `codex/product-draft-command-contract`.
- Baseline verification: `pnpm run verify` exited 0 with 18 suites and 37 tests passing before implementation.
- RED unit verification: `pnpm --filter @welfare-mall/api run test -- product-draft-command` failed because `product-draft-command.ts` did not exist.
- GREEN unit verification: targeted draft-command unit tests passed 1 suite and 3 tests.
- RED e2e verification: targeted draft-command tests failed because `POST /api/products/draft-validation` returned 404.
- GREEN e2e verification: targeted draft-command tests passed 2 suites and 5 tests after adding the endpoint and `@HttpCode(200)`.
- OpenAPI generation: `pnpm run openapi:generate` exited 0 and `rg` found `/api/products/draft-validation`.
- API verification: `pnpm run verify:api` exited 0 with 20 suites and 42 tests passing.
- Build verification: `pnpm run build` exited 0.
- Repository verification: `pnpm run verify` exited 0 with 20 suites and 42 tests passing.
- Runtime smoke: compiled API on port 3105 returned `valid: true`, no issues, and submit-readiness ready for a complete draft payload.
