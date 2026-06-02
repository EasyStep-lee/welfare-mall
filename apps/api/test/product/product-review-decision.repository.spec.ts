import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ProductReviewDecisionRepository } from '../../src/product/product-review-decision.repository';
import { ProductModule } from '../../src/product/product.module';

function createTransactionMock(productStatus: string | null = 'pending_review') {
  const tx = {
    product: {
      findUnique: jest.fn().mockResolvedValue(productStatus ? { id: 'product-001', status: productStatus } : null),
      update: jest.fn().mockResolvedValue({ id: 'product-001' })
    },
    productReviewLog: {
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: `review-log-${data.action}-001`,
          productId: data.productId,
          actorUserId: data.actorUserId,
          actorType: data.actorType,
          action: data.action,
          fromStatus: data.fromStatus,
          toStatus: data.toStatus,
          reason: data.reason,
          createdAt: new Date('2026-06-02T00:00:00.000Z')
        })
      )
    }
  };
  const prisma = {
    $transaction: jest.fn(async (callback) => callback(tx))
  };

  return { prisma, tx };
}

describe('ProductReviewDecisionRepository', () => {
  it('approves a pending product review and writes an admin review log', async () => {
    const { prisma, tx } = createTransactionMock('pending_review');
    const repository = new ProductReviewDecisionRepository(prisma as never);

    const result = await repository.decide({
      productId: 'product-001',
      action: 'approve',
      actorUserId: 'admin-user-001',
      reason: null
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.product.findUnique).toHaveBeenCalledWith({
      where: { id: 'product-001' },
      select: { id: true, status: true }
    });
    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-001' },
      data: { status: 'approved' },
      select: { id: true }
    });
    expect(tx.productReviewLog.create).toHaveBeenCalledWith({
      data: {
        productId: 'product-001',
        actorUserId: 'admin-user-001',
        actorType: 'admin',
        action: 'approve',
        fromStatus: 'pending_review',
        toStatus: 'approved',
        reason: null
      }
    });
    expect(result).toEqual({
      allowed: true,
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
        createdAt: new Date('2026-06-02T00:00:00.000Z')
      }
    });
  });

  it('rejects a pending product review and persists the review reason', async () => {
    const { tx } = createTransactionMock('pending_review');
    const repository = new ProductReviewDecisionRepository({ $transaction: jest.fn(async (callback) => callback(tx)) } as never);

    const result = await repository.decide({
      productId: 'product-001',
      action: 'reject',
      actorUserId: 'admin-user-001',
      reason: '资质材料不完整'
    });

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-001' },
      data: { status: 'rejected' },
      select: { id: true }
    });
    expect(tx.productReviewLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'reject',
        fromStatus: 'pending_review',
        toStatus: 'rejected',
        reason: '资质材料不完整'
      })
    });
    expect(result).toEqual(
      expect.objectContaining({
        allowed: true,
        action: 'reject',
        fromStatus: 'pending_review',
        toStatus: 'rejected',
        reviewLog: expect.objectContaining({ reason: '资质材料不完整' })
      })
    );
  });

  it('does not approve a product from an unsupported status', async () => {
    const { tx } = createTransactionMock('draft');
    const repository = new ProductReviewDecisionRepository({ $transaction: jest.fn(async (callback) => callback(tx)) } as never);

    const result = await repository.decide({
      productId: 'product-001',
      action: 'approve',
      actorUserId: 'admin-user-001',
      reason: null
    });

    expect(tx.product.update).not.toHaveBeenCalled();
    expect(tx.productReviewLog.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      allowed: false,
      productId: 'product-001',
      fromStatus: 'draft',
      reason: 'action not allowed for current actor and status'
    });
  });

  it('returns null when the product does not exist', async () => {
    const { tx } = createTransactionMock(null);
    const repository = new ProductReviewDecisionRepository({ $transaction: jest.fn(async (callback) => callback(tx)) } as never);

    await expect(
      repository.decide({
        productId: 'product-missing',
        action: 'approve',
        actorUserId: 'admin-user-001',
        reason: null
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

    expect(moduleRef.get(ProductReviewDecisionRepository)).toBeInstanceOf(ProductReviewDecisionRepository);

    await moduleRef.close();
  });
});
