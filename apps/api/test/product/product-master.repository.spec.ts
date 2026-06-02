import { Test } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import type { ProductDraftCommandInput } from '../../src/product/product-draft-command';
import { ProductMasterRepository } from '../../src/product/product-master.repository';
import { ProductModule } from '../../src/product/product.module';

const completeDraft: ProductDraftCommandInput = {
  code: 'P-RICE-001',
  name: '东北五常大米福利装',
  merchantId: 'merchant-001',
  franchiseId: 'franchise-001',
  categoryId: 'category-rice',
  brandId: 'brand-rice',
  originCountry: '中国',
  originProvince: '黑龙江',
  originCity: '哈尔滨',
  originDescription: '五常核心产区直供',
  skus: [
    {
      code: 'SKU-RICE-5KG',
      priceAmount: 6990,
      marketPriceAmount: 8990,
      costPriceAmount: 5200,
      barcode: '6900000000001',
      specs: [{ name: '规格', value: '5kg' }],
      weightGrams: 5000,
      volumeMilliliters: 8000
    }
  ],
  media: [
    { type: 'main_image', url: 'https://cdn.example.com/products/rice-main.jpg', sortOrder: 10, altText: '大米主图' },
    { type: 'detail_image', url: 'https://cdn.example.com/products/rice-detail.jpg', altText: '大米详情图' }
  ],
  qualifications: [
    {
      type: 'origin_certificate',
      title: '产地证明',
      certificateNo: 'ORIGIN-2026-001',
      fileUrl: 'https://cdn.example.com/certs/origin.pdf',
      validFrom: '2026-06-01',
      validTo: '2027-06-01'
    }
  ],
  parameters: [
    { groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text', sortOrder: 3 },
    { groupName: '产地参数', name: '产地', value: '黑龙江五常', valueType: 'text' }
  ],
  detailSections: [
    { type: 'text', title: '商品介绍', content: '适合企业福利发放。', sortOrder: 1 },
    { type: 'image', imageUrl: 'https://cdn.example.com/products/rice-detail-1.jpg' }
  ]
};

function createTransactionMock() {
  const tx = {
    product: {
      create: jest.fn(),
      update: jest.fn()
    },
    productSku: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    productMedia: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    productQualification: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    productParameter: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    },
    productDetailSection: {
      deleteMany: jest.fn(),
      createMany: jest.fn()
    }
  };
  const prisma = {
    $transaction: jest.fn(async (callback) => callback(tx))
  };

  return { prisma, tx };
}

describe('ProductMasterRepository', () => {
  it('creates product master data and all child records from a complete draft', async () => {
    const { prisma, tx } = createTransactionMock();
    tx.product.create.mockResolvedValue({ id: 'product-001' });
    const repository = new ProductMasterRepository(prisma as never);

    const summary = await repository.saveFromDraft({
      payload: completeDraft,
      actorUserId: 'merchant-user-001'
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.product.create).toHaveBeenCalledWith({
      data: {
        code: 'P-RICE-001',
        name: '东北五常大米福利装',
        merchantId: 'merchant-001',
        franchiseId: 'franchise-001',
        categoryId: 'category-rice',
        brandId: 'brand-rice',
        status: 'draft',
        saleStatus: 'off_sale',
        originCountry: '中国',
        originProvince: '黑龙江',
        originCity: '哈尔滨',
        originDescription: '五常核心产区直供'
      },
      select: { id: true }
    });
    expect(tx.productSku.createMany).toHaveBeenCalledWith({
      data: [
        {
          productId: 'product-001',
          code: 'SKU-RICE-5KG',
          priceAmount: 6990,
          marketPriceAmount: 8990,
          costPriceAmount: 5200,
          barcode: '6900000000001',
          specs: [{ name: '规格', value: '5kg' }],
          weightGrams: 5000,
          volumeMilliliters: 8000
        }
      ]
    });
    expect(tx.productMedia.createMany).toHaveBeenCalledWith({
      data: [
        {
          productId: 'product-001',
          type: 'main_image',
          url: 'https://cdn.example.com/products/rice-main.jpg',
          sortOrder: 10,
          altText: '大米主图'
        },
        {
          productId: 'product-001',
          type: 'detail_image',
          url: 'https://cdn.example.com/products/rice-detail.jpg',
          sortOrder: 1,
          altText: '大米详情图'
        }
      ]
    });
    expect(tx.productQualification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          productId: 'product-001',
          type: 'origin_certificate',
          title: '产地证明',
          certificateNo: 'ORIGIN-2026-001',
          fileUrl: 'https://cdn.example.com/certs/origin.pdf',
          validFrom: expect.any(Date),
          validTo: expect.any(Date)
        })
      ]
    });
    expect(tx.productParameter.createMany).toHaveBeenCalledWith({
      data: [
        {
          productId: 'product-001',
          groupName: '基础参数',
          name: '净含量',
          value: '5kg',
          valueType: 'text',
          sortOrder: 3
        },
        {
          productId: 'product-001',
          groupName: '产地参数',
          name: '产地',
          value: '黑龙江五常',
          valueType: 'text',
          sortOrder: 1
        }
      ]
    });
    expect(tx.productDetailSection.createMany).toHaveBeenCalledWith({
      data: [
        {
          productId: 'product-001',
          type: 'text',
          title: '商品介绍',
          content: '适合企业福利发放。',
          imageUrl: null,
          sortOrder: 1
        },
        {
          productId: 'product-001',
          type: 'image',
          title: null,
          content: null,
          imageUrl: 'https://cdn.example.com/products/rice-detail-1.jpg',
          sortOrder: 1
        }
      ]
    });
    expect(summary).toEqual({
      productId: 'product-001',
      mode: 'created',
      skuCount: 1,
      mediaCount: 2,
      qualificationCount: 1,
      parameterCount: 2,
      detailSectionCount: 2
    });
  });

  it('updates product master data by replacing child records for an existing product', async () => {
    const { prisma, tx } = createTransactionMock();
    tx.product.update.mockResolvedValue({ id: 'product-001' });
    const repository = new ProductMasterRepository(prisma as never);

    const summary = await repository.saveFromDraft({
      productId: 'product-001',
      payload: completeDraft,
      actorUserId: 'merchant-user-001'
    });

    expect(tx.product.update).toHaveBeenCalledWith({
      where: { id: 'product-001' },
      data: expect.objectContaining({
        code: 'P-RICE-001',
        name: '东北五常大米福利装',
        originCountry: '中国'
      }),
      select: { id: true }
    });
    for (const childRepository of [
      tx.productSku,
      tx.productMedia,
      tx.productQualification,
      tx.productParameter,
      tx.productDetailSection
    ]) {
      expect(childRepository.deleteMany).toHaveBeenCalledWith({ where: { productId: 'product-001' } });
    }
    expect(summary).toEqual({
      productId: 'product-001',
      mode: 'updated',
      skuCount: 1,
      mediaCount: 2,
      qualificationCount: 1,
      parameterCount: 2,
      detailSectionCount: 2
    });
  });

  it('registers the repository in product module', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ProductModule]
    })
      .overrideProvider(PrismaService)
      .useValue(createTransactionMock().prisma)
      .compile();

    expect(moduleRef.get(ProductMasterRepository)).toBeInstanceOf(ProductMasterRepository);

    await moduleRef.close();
  });
});
