import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ProductPoolService } from '../../src/product-pool/product-pool.service';

function createProductPoolServiceMock() {
  return {
    publishApprovedProduct: jest.fn(),
    listCatalog: jest.fn(),
    getItemDetail: jest.fn()
  };
}

describe('Product pool publish API contract', () => {
  let app: INestApplication;
  let productPoolService: ReturnType<typeof createProductPoolServiceMock>;

  beforeEach(async () => {
    productPoolService = createProductPoolServiceMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(ProductPoolService)
      .useValue(productPoolService)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
  });

  it('publishes an approved product into a franchise product pool', async () => {
    productPoolService.publishApprovedProduct.mockResolvedValue({
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
          displayName: '东北五常大米福利装',
          displaySkuCode: 'SKU-RICE-5KG',
          displayPriceAmount: 6990,
          displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
          sortOrder: 0
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .post('/api/product-pools/items/publish')
      .send({ productId: 'product-001', actorUserId: 'admin-user-001' })
      .expect(201);

    expect(productPoolService.publishApprovedProduct).toHaveBeenCalledWith({
      productId: 'product-001',
      actorUserId: 'admin-user-001'
    });
    expect(response.body).toEqual({
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
          displayName: '东北五常大米福利装',
          displaySkuCode: 'SKU-RICE-5KG',
          displayPriceAmount: 6990,
          displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
          sortOrder: 0
        }
      ]
    });
  });

  it('rejects missing publish request fields before calling service', async () => {
    await request(app.getHttpServer())
      .post('/api/product-pools/items/publish')
      .send({ productId: ' ' })
      .expect(400);

    expect(productPoolService.publishApprovedProduct).not.toHaveBeenCalled();
  });

  it('returns not found when publish target product does not exist', async () => {
    productPoolService.publishApprovedProduct.mockRejectedValue(new NotFoundException('Product product-missing not found.'));

    await request(app.getHttpServer())
      .post('/api/product-pools/items/publish')
      .send({ productId: 'product-missing', actorUserId: 'admin-user-001' })
      .expect(404);
  });

  it('returns active product pool catalog filtered by franchise', async () => {
    productPoolService.listCatalog.mockResolvedValue({
      productPools: [
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
              displayName: '东北五常大米福利装',
              displaySkuCode: 'SKU-RICE-5KG',
              displayPriceAmount: 6990,
              displayImageUrl: 'https://cdn.example.com/products/rice-main.jpg',
              sortOrder: 0
            }
          ]
        }
      ]
    });

    const response = await request(app.getHttpServer())
      .get('/api/product-pools/catalog')
      .query({ franchiseId: 'franchise-001' })
      .expect(200);

    expect(productPoolService.listCatalog).toHaveBeenCalledWith({ franchiseId: 'franchise-001' });
    expect(response.body.productPools).toHaveLength(1);
    expect(response.body.productPools[0].items[0]).toEqual(
      expect.objectContaining({
        productId: 'product-001',
        displayPriceAmount: 6990
      })
    );
  });

  it('returns product pool item detail with product master data', async () => {
    productPoolService.getItemDetail.mockResolvedValue({
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
        code: 'P-RICE-001',
        name: '东北五常大米福利装',
        origin: { country: '中国', province: '黑龙江', city: '哈尔滨', description: '五常核心产区' },
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
        specText: '规格: 5kg'
      }
    });

    const response = await request(app.getHttpServer()).get('/api/product-pools/items/pool-item-001').expect(200);

    expect(productPoolService.getItemDetail).toHaveBeenCalledWith('pool-item-001');
    expect(response.body).toEqual(
      expect.objectContaining({
        id: 'pool-item-001',
        displayName: '东北五常大米福利装',
        displaySkuCode: 'SKU-RICE-5KG',
        product: expect.objectContaining({
          code: 'P-RICE-001',
          parameters: [expect.objectContaining({ name: '净含量', value: '5kg' })],
          qualifications: [expect.objectContaining({ title: '产地证明' })],
          detailSections: [expect.objectContaining({ title: '福利说明' })]
        })
      })
    );
  });

  it('returns not found when product pool item detail does not exist', async () => {
    productPoolService.getItemDetail.mockRejectedValue(new NotFoundException('Product pool item pool-item-missing not found.'));

    await request(app.getHttpServer()).get('/api/product-pools/items/pool-item-missing').expect(404);
  });
});
