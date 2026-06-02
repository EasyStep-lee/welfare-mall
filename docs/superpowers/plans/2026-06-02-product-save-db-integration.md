# Product Save DB Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in real MySQL integration verification path for the product draft save API.

**Architecture:** Keep real database tests outside the default Jest pattern and default `pnpm run verify`. Add a dedicated Jest config plus a package script that pushes the Prisma schema to the local MySQL database before running the integration test.

**Tech Stack:** NestJS, Prisma Client, MySQL 8.4 via Docker Compose, Jest + Supertest, dedicated opt-in package scripts.

---

## Files

- Create: `apps/api/jest.db.config.ts`
- Create: `apps/api/test/product-draft-save.db-test.ts`
- Modify: `apps/api/package.json`
- Modify: `package.json`
- Create: `docs/superpowers/plans/2026-06-02-product-save-db-integration.md`

## Test Contract

The real database test must:

- Start a real `AppModule` without repository mocks.
- Create required `Franchise`, `Merchant`, and `ProductCategory` rows.
- Call `POST /api/products/drafts/save`.
- Verify rows exist in `product`, `product_sku`, `product_media`, `product_qualification`, `product_parameter`, `product_detail_section`, and `product_draft_snapshot`.
- Call the same endpoint again with `productId` and changed child data.
- Verify product row updates, child rows are replaced, and snapshot version increments.
- Clean up all rows it creates.

## Tasks

### Task 1: RED

- [x] Add `apps/api/test/product-draft-save.db-test.ts` with the integration contract.
- [x] Run `pnpm run verify:product-save-db`.
- [x] Expected result: fail because the opt-in script/config does not exist yet.

### Task 2: GREEN

- [x] Add `apps/api/jest.db.config.ts` matching `*.db-test.ts`.
- [x] Add `test:db:product-save` to `apps/api/package.json`.
- [x] Add root `verify:product-save-db` to `package.json`.
- [x] Run `pnpm run verify:product-save-db`.
- [x] Expected result: pass against local MySQL after Prisma `db push`.

### Task 3: Default Verification

- [x] Run `pnpm run verify`.
- [x] Confirm the real database test is not part of default verification.
- [x] Run `pnpm run verify:api`.
- [x] Run `pnpm run build`.
- [x] Run `git diff --check`.
- [x] Run placeholder scan over touched files.
- [ ] Commit, push, create PR, wait for GitHub Actions, mark ready, squash merge, sync `main`, and run `pnpm run verify` on `main`.

## Acceptance Boundary

This slice proves the product draft save API can write and update product master data through a real local MySQL database. It does not prove Admin/merchant-web browser flows, product review submission, product pool publishing, true-device behavior, or target-environment acceptance.
