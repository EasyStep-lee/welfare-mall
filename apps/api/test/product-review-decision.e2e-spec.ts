import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProductReviewDecisionService } from '../src/product/product-review-decision.service';

function createProductReviewDecisionServiceMock() {
  return {
    decide: jest.fn()
  };
}

describe('Product admin review decision API contract', () => {
  let app: INestApplication;
  let productReviewDecisionService: ReturnType<typeof createProductReviewDecisionServiceMock>;
  const createdAt = new Date('2026-06-02T00:00:00.000Z');

  beforeEach(async () => {
    productReviewDecisionService = createProductReviewDecisionServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(ProductReviewDecisionService)
      .useValue(productReviewDecisionService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('approves a pending product review', async () => {
    productReviewDecisionService.decide.mockResolvedValue({
      productId: 'product-001',
      action: 'approve',
      fromStatus: 'pending_review',
      toStatus: 'approved',
      reviewLog: {
        id: 'review-log-approve-001',
        productId: 'product-001',
        actorUserId: 'admin-user-001',
        actorType: 'admin',
        action: 'approve',
        fromStatus: 'pending_review',
        toStatus: 'approved',
        reason: null,
        createdAt
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/products/product-001/review-decisions')
      .send({ action: 'approve', actorUserId: 'admin-user-001' })
      .expect(201);

    expect(productReviewDecisionService.decide).toHaveBeenCalledWith({
      productId: 'product-001',
      action: 'approve',
      actorUserId: 'admin-user-001',
      reason: null
    });
    expect(response.body).toEqual({
      productId: 'product-001',
      action: 'approve',
      fromStatus: 'pending_review',
      toStatus: 'approved',
      reviewLog: {
        id: 'review-log-approve-001',
        productId: 'product-001',
        actorUserId: 'admin-user-001',
        actorType: 'admin',
        action: 'approve',
        fromStatus: 'pending_review',
        toStatus: 'approved',
        reason: null,
        createdAt: '2026-06-02T00:00:00.000Z'
      }
    });
  });

  it('rejects a pending product review with a reason', async () => {
    productReviewDecisionService.decide.mockResolvedValue({
      productId: 'product-001',
      action: 'reject',
      fromStatus: 'pending_review',
      toStatus: 'rejected',
      reviewLog: {
        id: 'review-log-reject-001',
        productId: 'product-001',
        actorUserId: 'admin-user-001',
        actorType: 'admin',
        action: 'reject',
        fromStatus: 'pending_review',
        toStatus: 'rejected',
        reason: '资质材料不完整',
        createdAt
      }
    });

    await request(app.getHttpServer())
      .post('/api/products/product-001/review-decisions')
      .send({ action: 'reject', actorUserId: 'admin-user-001', reason: '资质材料不完整' })
      .expect(201);

    expect(productReviewDecisionService.decide).toHaveBeenCalledWith({
      productId: 'product-001',
      action: 'reject',
      actorUserId: 'admin-user-001',
      reason: '资质材料不完整'
    });
  });

  it('rejects a blank reject reason before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/products/product-001/review-decisions')
      .send({ action: 'reject', actorUserId: 'admin-user-001', reason: ' ' })
      .expect(400);

    expect(productReviewDecisionService.decide).not.toHaveBeenCalled();
  });

  it('returns not found when the product does not exist', async () => {
    productReviewDecisionService.decide.mockRejectedValue(new NotFoundException('Product product-missing not found.'));

    await request(app.getHttpServer())
      .post('/api/products/product-missing/review-decisions')
      .send({ action: 'approve', actorUserId: 'admin-user-001' })
      .expect(404);
  });
});
