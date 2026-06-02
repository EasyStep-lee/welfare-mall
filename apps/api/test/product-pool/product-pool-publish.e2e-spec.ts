import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ProductPoolService } from '../../src/product-pool/product-pool.service';

function createProductPoolServiceMock() {
  return {
    publishApprovedProduct: jest.fn(),
    listCatalog: jest.fn()
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
});
