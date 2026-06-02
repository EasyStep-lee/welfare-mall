import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ProductModule } from '../../src/product/product.module';
import { ProductReviewSubmissionRepository } from '../../src/product/product-review-submission.repository';

function createTransactionMock(productStatus: string | null = 'draft') {
  const tx = {
    product: {
      findUnique: jest.fn().mockResolvedValue(productStatus ? { id: 'product-001', status: productStatus } : null),
      update: jest.fn().mockResolvedValue({ id: 'product-001' })
    },
    productReviewLog: {
      create: jest.fn().mockResolvedValue({
        id: 'review-log-001',
        productId: 'product-001',
        actorUserId: 'merchant-user-001',
        actorType: 'merchant',
        action: 'submit_review',
        fromStatus: 'draft',
        toStatus: 'pending_review',
        reason: null,
        createdAt: new Date('2026-06-02T00:00:00.000Z')
      })
    }
  };
  const prisma = {
    $transaction: jest.fn(async (callback) => callback(tx))
  };

  return { prisma, tx };
}

describe('ProductReviewSubmissionRepository', () => {
  it('submits a draft product for review and writes a review log', async () => {
    const { prisma, tx } = createTransactionMock('draft');
    const repository = new ProductReviewSubmissionRepository(prisma as never);

    const result = await repository.submitForReview({
      productId: 'product-001',
      actorUserId: 'merchant-user-001'
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-001' },
      select: { id: true, status: true }
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-001' },
      data: { status: 'pending_review' },
      select: { id: true }
    });
    expect(tx.productReviewLog.create).toHaveBeenCalledWith({
      data: {
        productId: 'product-001',
        actorUserId: 'merchant-user-001',
        actorType: 'merchant',
        action: 'submit_review',
        fromStatus: 'draft',
        toStatus: 'pending_review',
        reason: null
      }
    });
    expect(result).toEqual({
      allowed: true,
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
        createdAt: new Date('2026-06-02T00:00:00.000Z')
      }
    });
  });

  it('does not submit a product from an unsupported status', async () => {
    const { tx } = createTransactionMock('approved');
    const repository = new ProductReviewSubmissionRepository({ $transaction: jest.fn(async (callback) => callback(tx)) } as never);

    const result = await repository.submitForReview({
      productId: 'product-001',
      actorUserId: 'merchant-user-001'
    });

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.productReviewLog.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      allowed: false,
      productId: 'product-001',
      fromStatus: 'approved',
      reason: 'action not allowed for current actor and status'
    });
  });

  it('returns null when the product does not exist', async () => {
    const { tx } = createTransactionMock(null);
    const repository = new ProductReviewSubmissionRepository({ $transaction: jest.fn(async (callback) => callback(tx)) } as never);

    await expect(
      repository.submitForReview({
        productId: 'product-missing',
        actorUserId: 'merchant-user-001'
      })
    ).resolves.toBeNull();

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.productReviewLog.create).not.toHaveBeenCalled();
  });

  it('registers the repository in product module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProductModule]
    })
      .overrideProvider(PrismaService)
      .useValue(createTransactionMock().prisma)
      .compile();

    expect(moduleRef.get(ProductReviewSubmissionRepository)).toBeInstanceOf(ProductReviewSubmissionRepository);

    await moduleRef.close();
  });
});
