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
    expect(response.body).toEqual({
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
  });
});
