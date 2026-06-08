import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ProductPoolRepository } from '../../src/product-pool/product-pool.repository';
import { ProductPoolModule } from '../../src/product-pool/product-pool.module';

const approvedProduct = {
  id: 'product-001',
  name: '东北五常大米福利装',
  status: 'approved',
  franchiseId: 'franchise-001',
  skus: [{ id: 'sku-001', code: 'SKU-RICE-5KG', priceAmount: 6990 }],
  media: [{ url: 'https://cdn.example.com/products/rice-main.jpg' }]
};

const productPoolItemDetail = {
  id: 'pool-item-001',
  productPoolId: 'pool-001',
  productId: 'product-001',
  skuId: 'sku-001',
  sortOrder: 0,
  displayName: '东北五常大米福利装',
  displaySkuCode: 'SKU-RICE-5KG',
  displayPriceAmount: 6990,
  displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
  product: {
    merchantId: 'merchant-local-review',
    code: 'P-RICE-001',
    name: '东北五常大米福利装',
    originCountry: '中国',
    originProvince: '黑龙江',
    originCity: '哈尔滨',
    originDescription: '五常核心产区',
    brand: { id: 'brand-001', code: 'wuchang', name: '五常香米' },
    category: { id: 'category-001', code: 'grain', name: '粮油副食' },
    media: [{ type: 'main_image', url: 'https://cdn.example.com/products/rice-main.jpg', sortOrder: 1 }],
    qualifications: [{ type: 'origin_certificate', title: '产地证明', certificateNo: 'CERT-RICE-001', fileUrl: null }],
    parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text', sortOrder: 1 }],
    detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }]
  },
  sku: {
    code: 'SKU-RICE-5KG',
    priceAmount: 6990,
    marketPriceAmount: 7990,
    specs: [{ name: '规格', value: '5kg' }]
  }
};

function createPrismaMock(product: typeof approvedProduct | null = approvedProduct) {
  const tx = {
    product: {
      findUnique: jest.fn().mockResolvedValue(product)
    },
    productPool: {
      upsert: jest.fn().mockResolvedValue({
        id: 'pool-001',
        code: 'FRANCHISE-franchise-001-DEFAULT',
        name: '默认商品池',
        status: 'active',
        franchiseId: 'franchise-001'
      })
    },
    productPoolItem: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: 'pool-item-001',
          productId: data.productId,
          skuId: data.skuId,
          sortOrder: data.sortOrder,
          displayName: data.displayName,
          displaySkuCode: data.displaySkuCode,
          displayPriceAmount: data.displayPriceAmount,
          displayImageUrl: data.displayImageUrl
        })
      ),
      update: jest.fn()
    }
  };
  const prisma = {
    $transaction: jest.fn(async (callback) => callback(tx)),
    productPool: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'pool-001',
          code: 'FRANCHISE-franchise-001-DEFAULT',
          name: '默认商品池',
          status: 'active',
          franchiseId: 'franchise-001',
          items: [
            {
              id: 'pool-item-001',
              productId: 'product-001',
              skuId: 'sku-001',
              sortOrder: 0,
              displayName: '东北五常大米福利装',
              displaySkuCode: 'SKU-RICE-5KG',
              displayPriceAmount: 6990,
              displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg'
            }
          ]
        }
      ])
    },
    productPoolItem: {
      findUnique: jest.fn().mockResolvedValue(productPoolItemDetail)
    }
  };

  return { prisma, tx };
}

describe('ProductPoolRepository', () => {
  it('publishes an approved product into an active franchise product pool', async () => {
    const { prisma, tx } = createPrismaMock();
    const repository = new ProductPoolRepository(prisma as never);

    const result = await repository.publishApprovedProduct({
      productId: 'product-001',
      actorUserId: 'admin-user-001'
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.product.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'product-001' }
      })
    );
    expect(tx.productPool.upsert).toHaveBeenCalledWith({
      where: { code: 'FRANCHISE-franchise-001-DEFAULT' },
      create: {
        code: 'FRANCHISE-franchise-001-DEFAULT',
        name: '默认商品池',
        status: 'active',
        franchiseId: 'franchise-001'
      },
      update: {
        status: 'active',
        deletedAt: null
      },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        franchiseId: true
      }
    });
    expect(tx.productPoolItem.create).toHaveBeenCalledWith({
      data: {
        productPoolId: 'pool-001',
        productId: 'product-001',
        skuId: 'sku-001',
        sortOrder: 0,
        displayName: '东北五常大米福利装',
        displaySkuCode: 'SKU-RICE-5KG',
        displayPriceAmount: 6990,
        displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg'
      },
      select: {
        id: true,
        productId: true,
        skuId: true,
        sortOrder: true,
        displayName: true,
        displaySkuCode: true,
        displayPriceAmount: true,
        displayImageUrl: true
      }
    });
    expect(result).toEqual({
      allowed: true,
      productPool: {
        id: 'pool-001',
        code: 'FRANCHISE-franchise-001-DEFAULT',
        name: '默认商品池',
        status: 'active',
        franchiseId: 'franchise-001'
      },
      publishedItems: [
        {
          id: 'pool-item-001',
          productId: 'product-001',
          skuId: 'sku-001',
          sortOrder: 0,
          displayName: '东北五常大米福利装',
          displaySkuCode: 'SKU-RICE-5KG',
          displayPriceAmount: 6990,
          displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg'
        }
      ]
    });
  });

  it('does not publish a product that is not approved', async () => {
    const { tx } = createPrismaMock({ ...approvedProduct, status: 'pending_review' });
    const repository = new ProductPoolRepository({ $transaction: jest.fn(async (callback) => callback(tx)) } as never);

    const result = await repository.publishApprovedProduct({
      productId: 'product-001',
      actorUserId: 'admin-user-001'
    });

    expect(tx.productPool.upsert).not.toHaveBeenCalled();
    expect(tx.productPoolItem.create).not.toHaveBeenCalled();
    expect(result).toEqual({
      allowed: false,
      productId: 'product-001',
      reasonCode: 'not_approved',
      reason: 'product must be approved before publishing to product pool'
    });
  });

  it('does not publish a product without SKU data', async () => {
    const { tx } = createPrismaMock({ ...approvedProduct, skus: [] });
    const repository = new ProductPoolRepository({ $transaction: jest.fn(async (callback) => callback(tx)) } as never);

    const result = await repository.publishApprovedProduct({
      productId: 'product-001',
      actorUserId: 'admin-user-001'
    });

    expect(tx.productPool.upsert).not.toHaveBeenCalled();
    expect(result).toEqual({
      allowed: false,
      productId: 'product-001',
      reasonCode: 'missing_sku',
      reason: 'product must have at least one SKU before publishing to product pool'
    });
  });

  it('does not publish a product without a main image', async () => {
    const { tx } = createPrismaMock({ ...approvedProduct, media: [] });
    const repository = new ProductPoolRepository({ $transaction: jest.fn(async (callback) => callback(tx)) } as never);

    const result = await repository.publishApprovedProduct({
      productId: 'product-001',
      actorUserId: 'admin-user-001'
    });

    expect(tx.productPool.upsert).not.toHaveBeenCalled();
    expect(result).toEqual({
      allowed: false,
      productId: 'product-001',
      reasonCode: 'missing_main_image',
      reason: 'product must have a main image before publishing to product pool'
    });
  });

  it('returns active product pool catalog rows', async () => {
    const { prisma } = createPrismaMock();
    const repository = new ProductPoolRepository(prisma as never);

    const result = await repository.listCatalog({ franchiseId: 'franchise-001' });

    expect(prisma.productPool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'active', deletedAt: null, franchiseId: 'franchise-001' }
      })
    );
    const firstPool = result.productPools[0];
    expect(firstPool).toBeDefined();
    expect(firstPool!.items[0]).toEqual(
      expect.objectContaining({
        productId: 'product-001',
        displayName: '东北五常大米福利装'
      })
    );
  });

  it('returns product pool item detail with product master data', async () => {
    const { prisma } = createPrismaMock();
    const repository = new ProductPoolRepository(prisma as never);

    const result = await repository.getItemDetail('pool-item-001');

    expect(prisma.productPoolItem.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pool-item-001' }
      })
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'pool-item-001',
        displayName: '东北五常大米福利装',
        product: expect.objectContaining({
          code: 'P-RICE-001',
          merchantId: 'merchant-local-review',
          origin: { country: '中国', province: '黑龙江', city: '哈尔滨', description: '五常核心产区' },
          parameters: [expect.objectContaining({ name: '净含量', value: '5kg' })],
          qualifications: [expect.objectContaining({ title: '产地证明' })],
          detailSections: [expect.objectContaining({ title: '福利说明' })]
        }),
        sku: expect.objectContaining({
          code: 'SKU-RICE-5KG',
          specText: '规格: 5kg'
        })
      })
    );
  });

  it('returns null when product pool item detail is missing', async () => {
    const { prisma } = createPrismaMock();
    prisma.productPoolItem.findUnique.mockResolvedValue(null);
    const repository = new ProductPoolRepository(prisma as never);

    await expect(repository.getItemDetail('pool-item-missing')).resolves.toBeNull();
  });

  it('registers the repository in product pool module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProductPoolModule]
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock().prisma)
      .compile();

    expect(moduleRef.get(ProductPoolRepository)).toBeInstanceOf(ProductPoolRepository);

    await moduleRef.close();
  });
});
