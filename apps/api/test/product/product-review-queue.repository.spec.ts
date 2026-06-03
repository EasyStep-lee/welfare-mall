import { PrismaService } from '../../src/prisma/prisma.service';
import { ProductReviewQueueRepository } from '../../src/product/product-review-queue.repository';

describe('ProductReviewQueueRepository', () => {
  it('maps product master details needed for Admin review', async () => {
    const prisma = {
      product: {
        findMany: jest.fn(async () => [
          {
            id: 'product-001',
            code: 'P-RICE-001',
            name: '东北五常大米福利装',
            status: 'pending_review',
            saleStatus: 'off_sale',
            originCountry: '中国',
            originProvince: '黑龙江',
            originCity: '哈尔滨',
            originDescription: '五常核心产区',
            merchant: { id: 'merchant-001', code: 'M-001', name: '哈尔滨优选商贸' },
            franchise: { id: 'franchise-001', code: 'F-001', name: '黑龙江福利卡中心' },
            category: { id: 'category-001', code: 'grain', name: '粮油副食' },
            brand: { id: 'brand-001', code: 'wuchang', name: '五常香米' },
            skus: [
              {
                code: 'SKU-RICE-5KG',
                priceAmount: 6990,
                marketPriceAmount: 7990,
                specs: [{ name: '规格', value: '5kg' }]
              }
            ],
            media: [{ type: 'main_image', url: 'https://img.example.com/rice-cover.jpg', sortOrder: 1 }],
            qualifications: [
              {
                type: 'origin_certificate',
                title: '产地证明',
                certificateNo: 'CERT-RICE-001',
                fileUrl: 'https://img.example.com/certs/rice.pdf'
              }
            ],
            parameters: [
              {
                groupName: '基础参数',
                name: '净含量',
                value: '5kg',
                valueType: 'text',
                sortOrder: 1
              }
            ],
            detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }],
            reviewLogs: [],
            _count: {
              skus: 1,
              media: 1,
              qualifications: 1,
              parameters: 1,
              detailSections: 1
            }
          }
        ])
      }
    };
    const repository = new ProductReviewQueueRepository(prisma as unknown as PrismaService);

    const result = await repository.list({ status: 'pending_review' });

    expect(result.items[0]).toEqual(
      expect.objectContaining({
        primarySku: {
          code: 'SKU-RICE-5KG',
          priceAmount: 6990,
          marketPriceAmount: 7990,
          specText: '规格: 5kg'
        },
        media: [{ type: 'main_image', url: 'https://img.example.com/rice-cover.jpg', sortOrder: 1 }],
        qualifications: [
          {
            type: 'origin_certificate',
            title: '产地证明',
            certificateNo: 'CERT-RICE-001',
            fileUrl: 'https://img.example.com/certs/rice.pdf'
          }
        ],
        parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text', sortOrder: 1 }],
        detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }]
      })
    );
  });
});
