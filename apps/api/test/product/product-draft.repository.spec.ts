import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import type { ProductDraftCommandInput } from '../../src/product/product-draft-command';
import { ProductDraftRepository } from '../../src/product/product-draft.repository';
import { ProductModule } from '../../src/product/product.module';

const draftPayload: ProductDraftCommandInput = {
  code: 'P-RICE-001',
  name: '东北五常大米福利装',
  merchantId: 'merchant-001',
  franchiseId: 'franchise-001',
  categoryId: 'category-rice',
  originCountry: '中国',
  skus: [
    {
      code: 'SKU-RICE-5KG',
      priceAmount: 6990,
      marketPriceAmount: 8990,
      specs: [{ name: '规格', value: '5kg' }]
    }
  ],
  media: [
    { type: 'main_image', url: 'https://cdn.example.com/products/rice-main.jpg' },
    { type: 'detail_image', url: 'https://cdn.example.com/products/rice-detail.jpg' }
  ],
  qualifications: [{ type: 'origin_certificate', title: '产地证明' }],
  parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text' }],
  detailSections: [{ type: 'image', imageUrl: 'https://cdn.example.com/products/rice-detail-1.jpg' }]
};

function createPrismaMock() {
  return {
    productDraftSnapshot: {
      findFirst: jest.fn(),
      create: jest.fn()
    }
  };
}

describe('ProductDraftRepository', () => {
  it('creates the first draft snapshot as version 1', async () => {
    const createdAt = new Date('2026-06-02T00:00:00.000Z');
    const prisma = createPrismaMock();
    prisma.productDraftSnapshot.findFirst.mockResolvedValue(null);
    prisma.productDraftSnapshot.create.mockImplementation(({ data }) => ({
      id: 'snapshot-001',
      productId: data.productId,
      versionNo: data.versionNo,
      payload: data.payload,
      createdBy: data.createdBy,
      createdAt
    }));
    const repository = new ProductDraftRepository(prisma as never);

    const snapshot = await repository.saveSnapshot({
      productId: 'product-001',
      payload: draftPayload,
      createdBy: 'merchant-user-001'
    });

    expect(prisma.productDraftSnapshot.findFirst).toHaveBeenCalledWith({
      where: { productId: 'product-001' },
      orderBy: { versionNo: 'desc' },
      select: { versionNo: true }
    });
    expect(prisma.productDraftSnapshot.create).toHaveBeenCalledWith({
      data: {
        productId: 'product-001',
        versionNo: 1,
        payload: draftPayload,
        createdBy: 'merchant-user-001'
      }
    });
    expect(snapshot).toEqual({
      id: 'snapshot-001',
      productId: 'product-001',
      versionNo: 1,
      payload: draftPayload,
      createdBy: 'merchant-user-001',
      createdAt
    });
  });

  it('increments draft snapshot version from the latest existing snapshot', async () => {
    const prisma = createPrismaMock();
    prisma.productDraftSnapshot.findFirst.mockResolvedValue({ versionNo: 3 });
    prisma.productDraftSnapshot.create.mockImplementation(({ data }) => ({
      id: 'snapshot-004',
      productId: data.productId,
      versionNo: data.versionNo,
      payload: data.payload,
      createdBy: data.createdBy,
      createdAt: new Date('2026-06-02T00:00:00.000Z')
    }));
    const repository = new ProductDraftRepository(prisma as never);

    const snapshot = await repository.saveSnapshot({
      productId: 'product-001',
      payload: draftPayload,
      createdBy: 'merchant-user-001'
    });

    expect(snapshot.versionNo).toBe(4);
    expect(prisma.productDraftSnapshot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ versionNo: 4 })
      })
    );
  });

  it('returns the latest draft snapshot summary for a product', async () => {
    const createdAt = new Date('2026-06-02T00:00:00.000Z');
    const prisma = createPrismaMock();
    prisma.productDraftSnapshot.findFirst.mockResolvedValue({
      id: 'snapshot-004',
      productId: 'product-001',
      versionNo: 4,
      payload: draftPayload,
      createdBy: 'merchant-user-001',
      createdAt
    });
    const repository = new ProductDraftRepository(prisma as never);

    const snapshot = await repository.findLatestSnapshot('product-001');

    expect(prisma.productDraftSnapshot.findFirst).toHaveBeenCalledWith({
      where: { productId: 'product-001' },
      orderBy: { versionNo: 'desc' }
    });
    expect(snapshot).toEqual({
      id: 'snapshot-004',
      productId: 'product-001',
      versionNo: 4,
      payload: draftPayload,
      createdBy: 'merchant-user-001',
      createdAt
    });
  });

  it('returns null when a product has no draft snapshot', async () => {
    const prisma = createPrismaMock();
    prisma.productDraftSnapshot.findFirst.mockResolvedValue(null);
    const repository = new ProductDraftRepository(prisma as never);

    await expect(repository.findLatestSnapshot('product-unknown')).resolves.toBeNull();
  });

  it('registers the repository in product module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProductModule]
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .compile();

    expect(moduleRef.get(ProductDraftRepository)).toBeInstanceOf(ProductDraftRepository);

    await moduleRef.close();
  });
});
