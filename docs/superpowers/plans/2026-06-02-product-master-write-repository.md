# Product Master Write Repository Plan

## Goal

Build the first product master-data persistence slice after the draft command contract: a repository that writes a validated product draft into the product master tables in one Prisma transaction.

## Scope

- Add `ProductMasterRepository`.
- Support create and update modes.
- Persist product core fields, SKUs, media, qualifications, parameters, and detail sections.
- Replace child rows on update inside the same transaction.
- Register the repository in `ProductModule`.
- Keep this slice below HTTP/UI level.

## Out of Scope

- No Admin or merchant-web page work.
- No real database integration test in this slice.
- No review submission endpoint wiring.
- No product pool publishing changes.

## Test First

1. Repository creates product master data from a complete draft and writes all child tables.
2. Repository updates an existing product and replaces all child records in one transaction.
3. Repository is injectable from `ProductModule`.

## Implementation Steps

1. Add failing tests in `apps/api/test/product/product-master.repository.spec.ts`.
2. Implement `apps/api/src/product/product-master.repository.ts`.
3. Export the repository through `ProductModule`.
4. Run targeted test, API verification, build, full verification, diff checks, and placeholder scan.

## Acceptance Boundary

This closes the mocked Prisma transaction contract for product master writes. It does not prove live database schema behavior, endpoint behavior, merchant/admin browser behavior, or production acceptance.
