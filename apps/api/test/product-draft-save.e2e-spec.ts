import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ProductDraftRepository } from '../src/product/product-draft.repository';
import { ProductMasterRepository } from '../src/product/product-master.repository';

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

function createProductMasterRepositoryMock() {
  return {
    saveFromDraft: jest.fn()
  };
}

function createProductDraftRepositoryMock() {
  return {
    saveSnapshot: jest.fn(),
    findLatestSnapshot: jest.fn()
  };
}

describe('Product draft save API contract', () => {
  let app: INestApplication;
  let productMasterRepository: ReturnType<typeof createProductMasterRepositoryMock>;
  let productDraftRepository: ReturnType<typeof createProductDraftRepositoryMock>;
  const createdAt = new Date('2026-06-02T00:00:00.000Z');

  beforeEach(async () => {
    productMasterRepository = createProductMasterRepositoryMock();
    productDraftRepository = createProductDraftRepositoryMock();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(ProductMasterRepository)
      .useValue(productMasterRepository)
      .overrideProvider(ProductDraftRepository)
      .useValue(productDraftRepository)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('creates product master data and a draft snapshot from a valid draft', async () => {
    productMasterRepository.saveFromDraft.mockResolvedValue({
      productId: 'product-001',
      mode: 'created',
      skuCount: 1,
      mediaCount: 2,
      qualificationCount: 1,
      parameterCount: 1,
      detailSectionCount: 1
    });
    productDraftRepository.saveSnapshot.mockResolvedValue({
      id: 'snapshot-001',
      productId: 'product-001',
      versionNo: 1,
      payload: completeDraft,
      createdBy: 'merchant-user-001',
      createdAt
    });

    const response = await request(app.getHttpServer())
      .post('/api/products/drafts/save')
      .send({ payload: completeDraft, actorUserId: 'merchant-user-001' })
      .expect(201);

    expect(productMasterRepository.saveFromDraft).toHaveBeenCalledWith({
      productId: null,
      payload: completeDraft,
      actorUserId: 'merchant-user-001'
    });
    expect(productDraftRepository.saveSnapshot).toHaveBeenCalledWith({
      productId: 'product-001',
      payload: completeDraft,
      createdBy: 'merchant-user-001'
    });
    expect(response.body).toEqual({
      product: {
        productId: 'product-001',
        mode: 'created',
        skuCount: 1,
        mediaCount: 2,
        qualificationCount: 1,
        parameterCount: 1,
        detailSectionCount: 1
      },
      snapshot: {
        id: 'snapshot-001',
        productId: 'product-001',
        versionNo: 1,
        payload: completeDraft,
        createdBy: 'merchant-user-001',
        createdAt: '2026-06-02T00:00:00.000Z'
      },
      validation: {
        valid: true,
        issues: [],
        submitReadiness: {
          ready: true,
          missingRequirements: []
        }
      }
    });
  });

  it('updates product master data and saves a new draft snapshot for an existing product', async () => {
    productMasterRepository.saveFromDraft.mockResolvedValue({
      productId: 'product-001',
      mode: 'updated',
      skuCount: 1,
      mediaCount: 2,
      qualificationCount: 1,
      parameterCount: 1,
      detailSectionCount: 1
    });
    productDraftRepository.saveSnapshot.mockResolvedValue({
      id: 'snapshot-005',
      productId: 'product-001',
      versionNo: 5,
      payload: completeDraft,
      createdBy: 'merchant-user-001',
      createdAt
    });

    const response = await request(app.getHttpServer())
      .post('/api/products/drafts/save')
      .send({ productId: 'product-001', payload: completeDraft, actorUserId: 'merchant-user-001' })
      .expect(201);

    expect(productMasterRepository.saveFromDraft).toHaveBeenCalledWith({
      productId: 'product-001',
      payload: completeDraft,
      actorUserId: 'merchant-user-001'
    });
    expect(response.body.product.mode).toBe('updated');
    expect(response.body.snapshot.versionNo).toBe(5);
  });

  it('rejects an invalid draft before writing product master data or a snapshot', async () => {
    const invalidDraft = { ...completeDraft, skus: [] };

    const response = await request(app.getHttpServer())
      .post('/api/products/drafts/save')
      .send({ payload: invalidDraft, actorUserId: 'merchant-user-001' })
      .expect(400);

    expect(productMasterRepository.saveFromDraft).not.toHaveBeenCalled();
    expect(productDraftRepository.saveSnapshot).not.toHaveBeenCalled();
    expect(response.body.message.validation.valid).toBe(false);
    expect(response.body.message.validation.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'sku_required', field: 'skus' })])
    );
  });
});
