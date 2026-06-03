import { seedLocalReviewProduct } from '../../src/dev/seed-local-review-product';

function createPrismaMock() {
  const tx = {
    productPoolItem: { deleteMany: jest.fn() },
    productReviewLog: { deleteMany: jest.fn(), create: jest.fn() },
    productDraftSnapshot: { deleteMany: jest.fn(), create: jest.fn() },
    productDetailSection: { deleteMany: jest.fn(), createMany: jest.fn() },
    productParameter: { deleteMany: jest.fn(), createMany: jest.fn() },
    productQualification: { deleteMany: jest.fn(), createMany: jest.fn() },
    productMedia: { deleteMany: jest.fn(), createMany: jest.fn() },
    productSku: { deleteMany: jest.fn(), createMany: jest.fn() },
    franchise: { upsert: jest.fn() },
    merchant: { upsert: jest.fn() },
    productCategory: { upsert: jest.fn() },
    productBrand: { upsert: jest.fn() },
    product: { upsert: jest.fn() }
  };
  const prisma = {
    $transaction: jest.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx))
  };

  return { prisma, tx };
}

describe('seedLocalReviewProduct', () => {
  it('creates a complete pending-review product for local Admin runtime checks', async () => {
    const { prisma, tx } = createPrismaMock();

    const result = await seedLocalReviewProduct(prisma as Parameters<typeof seedLocalReviewProduct>[0]);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.franchise.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'franchise-local-review' } })
    );
    expect(tx.merchant.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'merchant-local-review' } }));
    expect(tx.productCategory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'category-local-review' } })
    );
    expect(tx.productBrand.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'brand-local-review' } }));
    expect(tx.product.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'product-local-review' },
        update: expect.objectContaining({ status: 'pending_review' }),
        create: expect.objectContaining({ code: 'P-LOCAL-REVIEW-001', status: 'pending_review' })
      })
    );
    expect(tx.productSku.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            productId: 'product-local-review',
            code: 'SKU-LOCAL-REVIEW-5KG',
            priceAmount: 6990,
            specs: [{ name: '规格', value: '5kg' }]
          })
        ]
      })
    );
    expect(tx.productMedia.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ type: 'main_image' }),
          expect.objectContaining({ type: 'detail_image' })
        ])
      })
    );
    expect(tx.productQualification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ type: 'origin_certificate', title: '产地证明' })]
      })
    );
    expect(tx.productParameter.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ name: '净含量', value: '5kg' })]
      })
    );
    expect(tx.productDetailSection.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [expect.objectContaining({ title: '福利说明', content: '适合企业福利发放' })]
      })
    );
    expect(tx.productReviewLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          productId: 'product-local-review',
          actorType: 'merchant',
          action: 'submit_review',
          fromStatus: 'draft',
          toStatus: 'pending_review'
        })
      })
    );
    expect(result).toEqual({ productId: 'product-local-review', code: 'P-LOCAL-REVIEW-001', status: 'pending_review' });
  });
});
