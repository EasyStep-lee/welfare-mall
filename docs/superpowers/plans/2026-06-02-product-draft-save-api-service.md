# Product Draft Save API Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first API-level save path that validates a merchant product draft, writes product master data, and stores a draft snapshot.

**Architecture:** Add `ProductDraftSaveService` as the orchestration boundary between the controller and repositories. The controller owns request shape and HTTP errors; the service owns validation, master write, snapshot write, and response summary assembly.

**Tech Stack:** NestJS controller/service, Prisma-backed repositories through mocks in contract tests, Jest + Supertest, OpenAPI generation through existing Nest Swagger flow.

---

## Files

- Create: `apps/api/src/product/product-draft-save.service.ts`
- Create: `apps/api/test/product-draft-save.e2e-spec.ts`
- Modify: `apps/api/src/product/product.controller.ts`
- Modify: `apps/api/src/product/product.module.ts`
- Create: `docs/superpowers/plans/2026-06-02-product-draft-save-api-service.md`

## API Contract

`POST /api/products/drafts/save`

Request:

```json
{
  "productId": "product-001",
  "actorUserId": "merchant-user-001",
  "payload": {
    "code": "P-RICE-001",
    "name": "东北五常大米福利装",
    "merchantId": "merchant-001",
    "franchiseId": "franchise-001",
    "categoryId": "category-rice",
    "originCountry": "中国",
    "skus": [
      {
        "code": "SKU-RICE-5KG",
        "priceAmount": 6990,
        "marketPriceAmount": 8990,
        "specs": [{ "name": "规格", "value": "5kg" }]
      }
    ],
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

Response:

```json
{
  "product": {
    "productId": "product-001",
    "mode": "updated",
    "skuCount": 1,
    "mediaCount": 2,
    "qualificationCount": 1,
    "parameterCount": 1,
    "detailSectionCount": 1
  },
  "snapshot": {
    "id": "snapshot-005",
    "productId": "product-001",
    "versionNo": 5,
    "payload": { "code": "P-RICE-001", "name": "东北五常大米福利装" },
    "createdBy": "merchant-user-001",
    "createdAt": "2026-06-02T00:00:00.000Z"
  },
  "validation": {
    "valid": true,
    "issues": [],
    "submitReadiness": { "ready": true, "missingRequirements": [] }
  }
}
```

Invalid draft response uses HTTP 400 and includes the validation result in `message.validation`.

## Tasks

### Task 1: API Contract RED

- [ ] Add `apps/api/test/product-draft-save.e2e-spec.ts`.
- [ ] Cover creating a product from a valid draft, updating an existing product from a valid draft, and rejecting an invalid draft without repository writes.
- [ ] Run `pnpm --filter @welfare-mall/api run test -- product-draft-save` and confirm the endpoint fails before implementation.

### Task 2: Service and Controller GREEN

- [ ] Add `ProductDraftSaveService.saveDraft`.
- [ ] Inject the service into `ProductController`.
- [ ] Add `POST /api/products/drafts/save`.
- [ ] Register and export the service in `ProductModule`.
- [ ] Run `pnpm --filter @welfare-mall/api run test -- product-draft-save` and confirm the tests pass.

### Task 3: Verification and Integration

- [ ] Run `pnpm run verify:api`.
- [ ] Run `pnpm run build`.
- [ ] Run `pnpm run verify`.
- [ ] Run `git diff --check`.
- [ ] Run placeholder scan over touched files.
- [ ] Commit, push, create PR, wait for GitHub Actions, mark ready, squash merge, sync `main`, and run `pnpm run verify` on `main`.

## Acceptance Boundary

This slice closes the API-level save command contract through mocked repositories. It still does not prove live MySQL writes, real merchant/admin browser behavior, product review submission, product pool publishing, true-device behavior, or target-environment acceptance.
