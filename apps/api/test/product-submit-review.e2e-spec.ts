import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProductReviewSubmissionService } from '../src/product/product-review-submission.service';

function createProductReviewSubmissionServiceMock() {
  return {
    submitForReview: jest.fn()
  };
}

describe('Product submit review API contract', () => {
  let app: INestApplication;
  let productReviewSubmissionService: ReturnType<typeof createProductReviewSubmissionServiceMock>;
  const createdAt = new Date('2026-06-02T00:00:00.000Z');

  beforeEach(async () => {
    productReviewSubmissionService = createProductReviewSubmissionServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(ProductReviewSubmissionService)
      .useValue(productReviewSubmissionService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('submits a saved product draft for merchant review', async () => {
    productReviewSubmissionService.submitForReview.mockResolvedValue({
      productId: 'product-001',
      action: 'submit_review',
      fromStatus: 'draft',
      toStatus: 'pending_review',
      reviewLog: {
        id: 'review-log-001',
        productId: 'product-001',
        actorUserId: 'merchant-user-001',
        actorType: 'merchant',
        action: 'submit_review',
        fromStatus: 'draft',
        toStatus: 'pending_review',
        reason: null,
        createdAt
      }
    });

    const response = await request(app.getHttpServer())
      .post('/api/products/product-001/review-submissions')
      .send({ actorUserId: 'merchant-user-001' })
      .expect(201);

    expect(productReviewSubmissionService.submitForReview).toHaveBeenCalledWith({
      productId: 'product-001',
      actorUserId: 'merchant-user-001'
    });
    expect(response.body).toEqual({
      productId: 'product-001',
      action: 'submit_review',
      fromStatus: 'draft',
      toStatus: 'pending_review',
      reviewLog: {
        id: 'review-log-001',
        productId: 'product-001',
        actorUserId: 'merchant-user-001',
        actorType: 'merchant',
        action: 'submit_review',
        fromStatus: 'draft',
        toStatus: 'pending_review',
        reason: null,
        createdAt: '2026-06-02T00:00:00.000Z'
      }
    });
  });

  it('rejects blank actor before submitting review', async () => {
    await request(app.getHttpServer())
      .post('/api/products/product-001/review-submissions')
      .send({ actorUserId: ' ' })
      .expect(400);

    expect(productReviewSubmissionService.submitForReview).not.toHaveBeenCalled();
  });

  it('returns not found when the product does not exist', async () => {
    productReviewSubmissionService.submitForReview.mockRejectedValue(new NotFoundException('Product product-missing not found.'));

    await request(app.getHttpServer())
      .post('/api/products/product-missing/review-submissions')
      .send({ actorUserId: 'merchant-user-001' })
      .expect(404);
  });
});
