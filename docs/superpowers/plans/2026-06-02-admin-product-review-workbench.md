# Admin Product Review Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Admin product review workbench backed by a business-facing review queue API.

**Architecture:** Add a product review queue read model inside the API product module, then scaffold a focused Admin web app that consumes the queue, review decision, and product pool publish endpoints. The UI must show business labels and product master completeness instead of asking operators to type raw internal IDs.

**Tech Stack:** NestJS, Prisma, Jest, Supertest, Vite, React, TypeScript.

---

## File Structure

- Create: `apps/api/src/product/product-review-queue.repository.ts` for Prisma review queue reads.
- Create: `apps/api/src/product/product-review-queue.service.ts` for queue status validation and orchestration.
- Create: `apps/api/test/product-review-queue.e2e-spec.ts` for `GET /api/products/review-queue` contract coverage.
- Modify: `apps/api/src/product/product.controller.ts` to expose the queue endpoint.
- Modify: `apps/api/src/product/product.module.ts` to register/export the queue repository and service.
- Modify: `packages/contracts/openapi/welfare-mall-api.openapi.json` after OpenAPI generation.
- Create: `apps/admin/package.json` for the Admin workspace package.
- Create: `apps/admin/index.html` for the Vite entry.
- Create: `apps/admin/tsconfig.json` and `apps/admin/tsconfig.node.json` for TypeScript.
- Create: `apps/admin/vite.config.ts` for React build and test configuration.
- Create: `apps/admin/src/main.tsx` for React bootstrap.
- Create: `apps/admin/src/App.tsx` for the product review workbench screen.
- Create: `apps/admin/src/api.ts` for API client functions.
- Create: `apps/admin/src/App.test.tsx` for Admin workbench behavior tests.
- Modify: `package.json` to include Admin lint/typecheck/test/build scripts in the root verification path.
- Modify: `pnpm-workspace.yaml` only if `apps/*` is not already covered.

## Task 1: Product Review Queue API Contract

**Files:**
- Create: `apps/api/test/product-review-queue.e2e-spec.ts`
- Modify: `apps/api/src/product/product.controller.ts`

- [ ] **Step 1: Write the failing API contract test**

```typescript
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProductReviewQueueService } from '../src/product/product-review-queue.service';

function createProductReviewQueueServiceMock() {
  return {
    list: jest.fn()
  };
}

describe('Product admin review queue API contract', () => {
  let app: INestApplication;
  let productReviewQueueService: ReturnType<typeof createProductReviewQueueServiceMock>;

  beforeEach(async () => {
    productReviewQueueService = createProductReviewQueueServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(ProductReviewQueueService)
      .useValue(productReviewQueueService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists pending products with business-facing review fields', async () => {
    productReviewQueueService.list.mockResolvedValue({
      status: 'pending_review',
      items: [
        {
          productId: 'product-001',
          code: 'P-RICE-001',
          name: '东北五常大米福利装',
          status: 'pending_review',
          saleStatus: 'off_sale',
          merchant: { id: 'merchant-001', code: 'M-001', name: '哈尔滨优选商贸' },
          franchise: { id: 'franchise-001', code: 'F-001', name: '黑龙江福利卡中心' },
          category: { id: 'category-001', code: 'grain', name: '粮油副食' },
          brand: { id: 'brand-001', code: 'wuchang', name: '五常香米' },
          origin: { country: '中国', province: '黑龙江', city: '哈尔滨', description: '五常核心产区' },
          skuCount: 2,
          imageCount: 3,
          qualificationCount: 1,
          parameterCount: 4,
          detailSectionCount: 2,
          primaryImageUrl: 'https://img.example.com/rice-cover.jpg',
          latestReviewLog: {
            action: 'submit_review',
            actorUserId: 'merchant-user-001',
            reason: null,
            createdAt: '2026-06-02T00:00:00.000Z'
          }
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get('/api/products/review-queue')
      .query({ status: 'pending_review' })
      .expect(200);

    expect(productReviewQueueService.list).toHaveBeenCalledWith({ status: 'pending_review' });
    expect(response.body.items[0].merchant.name).toBe('哈尔滨优选商贸');
    expect(response.body.items[0].skuCount).toBe(2);
    expect(response.body.items[0].primaryImageUrl).toBe('https://img.example.com/rice-cover.jpg');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @welfare-mall/api exec jest --config jest.config.ts test/product-review-queue.e2e-spec.ts --runInBand`

Expected: FAIL because `ProductReviewQueueService` does not exist.

## Task 2: Product Review Queue Read Model

**Files:**
- Create: `apps/api/src/product/product-review-queue.repository.ts`
- Create: `apps/api/src/product/product-review-queue.service.ts`
- Modify: `apps/api/src/product/product.module.ts`
- Modify: `apps/api/src/product/product.controller.ts`

- [ ] **Step 1: Implement the repository and service**

Add a repository that queries `Product` by status, includes merchant/franchise/category/brand, counts SKU/media/qualification/parameter/detail rows, selects the first sorted media row as the primary image, and selects the latest review log.

- [ ] **Step 2: Wire the endpoint**

Add `GET /api/products/review-queue?status=pending_review` to `ProductController` and register the new provider in `ProductModule`.

- [ ] **Step 3: Run the focused test**

Run: `pnpm --filter @welfare-mall/api exec jest --config jest.config.ts test/product-review-queue.e2e-spec.ts --runInBand`

Expected: PASS.

## Task 3: Admin Workbench Scaffold

**Files:**
- Create: `apps/admin/package.json`
- Create: `apps/admin/index.html`
- Create: `apps/admin/tsconfig.json`
- Create: `apps/admin/tsconfig.node.json`
- Create: `apps/admin/vite.config.ts`
- Create: `apps/admin/src/main.tsx`
- Create: `apps/admin/src/api.ts`
- Create: `apps/admin/src/App.tsx`
- Create: `apps/admin/src/App.test.tsx`
- Modify: `package.json`

- [ ] **Step 1: Write the failing Admin UI test**

Test that the workbench renders the queue rows with product name, merchant name, franchise name, SKU count, and approve/reject/publish controls after the API client returns data.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @welfare-mall/admin run test -- --run`

Expected: FAIL before the app is implemented.

- [ ] **Step 3: Implement the Admin workbench**

Build a single operational first screen with status tabs, a compact product table, detail panel, and action buttons. Keep visible controls business-facing.

- [ ] **Step 4: Run Admin tests**

Run: `pnpm --filter @welfare-mall/admin run test -- --run`

Expected: PASS.

## Task 4: Verification And Publication

**Files:**
- Modify: `packages/contracts/openapi/welfare-mall-api.openapi.json`

- [ ] **Step 1: Generate OpenAPI**

Run: `pnpm run openapi:generate`

Expected: OpenAPI includes `/api/products/review-queue`.

- [ ] **Step 2: Run full verification**

Run: `pnpm run verify`

Expected: lint, typecheck, and tests pass.

- [ ] **Step 3: Build all workspaces**

Run: `pnpm run build`

Expected: API and Admin build successfully.

- [ ] **Step 4: Check diff hygiene**

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 5: Commit and push**

```bash
git add .
git commit -m "feat: add admin product review workbench"
git push -u origin codex/admin-product-review-workbench
```

Expected: branch pushed to GitHub.
