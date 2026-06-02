import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProductDraftRepository } from '../src/product/product-draft.repository';

const completeDraft = {
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

function createRepositoryMock() {
  return {
    saveSnapshot: jest.fn(),
    findLatestSnapshot: jest.fn()
  };
}

describe('Product draft snapshot API contract', () => {
  let app: INestApplication;
  let repository: ReturnType<typeof createRepositoryMock>;
  const createdAt = new Date('2026-06-02T00:00:00.000Z');

  beforeEach(async () => {
    repository = createRepositoryMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(ProductDraftRepository)
      .useValue(repository)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('saves a product draft snapshot through the repository', async () => {
    repository.saveSnapshot.mockResolvedValue({
      id: 'snapshot-001',
      productId: 'product-001',
      versionNo: 1,
      payload: completeDraft,
      createdBy: 'merchant-user-001',
      createdAt
    });

    const response = await request(app.getHttpServer())
      .post('/api/products/product-001/draft-snapshots')
      .send({ payload: completeDraft, createdBy: 'merchant-user-001' })
      .expect(201);

    expect(repository.saveSnapshot).toHaveBeenCalledWith({
      productId: 'product-001',
      payload: completeDraft,
      createdBy: 'merchant-user-001'
    });
    expect(response.body).toEqual({
      id: 'snapshot-001',
      productId: 'product-001',
      versionNo: 1,
      payload: completeDraft,
      createdBy: 'merchant-user-001',
      createdAt: '2026-06-02T00:00:00.000Z'
    });
  });

  it('rejects a save request without payload or creator identity', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/products/product-001/draft-snapshots')
      .send({ payload: null, createdBy: '' })
      .expect(400);

    expect(repository.saveSnapshot).not.toHaveBeenCalled();
    expect(response.body.message).toEqual(['payload is required.', 'createdBy is required.']);
  });

  it('returns the latest product draft snapshot through the repository', async () => {
    repository.findLatestSnapshot.mockResolvedValue({
      id: 'snapshot-004',
      productId: 'product-001',
      versionNo: 4,
      payload: completeDraft,
      createdBy: 'merchant-user-001',
      createdAt
    });

    const response = await request(app.getHttpServer()).get('/api/products/product-001/draft-snapshots/latest').expect(200);

    expect(repository.findLatestSnapshot).toHaveBeenCalledWith('product-001');
    expect(response.body).toEqual({
      snapshot: {
        id: 'snapshot-004',
        productId: 'product-001',
        versionNo: 4,
        payload: completeDraft,
        createdBy: 'merchant-user-001',
        createdAt: '2026-06-02T00:00:00.000Z'
      }
    });
  });

  it('returns null when the latest product draft snapshot does not exist', async () => {
    repository.findLatestSnapshot.mockResolvedValue(null);

    const response = await request(app.getHttpServer()).get('/api/products/product-missing/draft-snapshots/latest').expect(200);

    expect(repository.findLatestSnapshot).toHaveBeenCalledWith('product-missing');
    expect(response.body).toEqual({ snapshot: null });
  });
});
