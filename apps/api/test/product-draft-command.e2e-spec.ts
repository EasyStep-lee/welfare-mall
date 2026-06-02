import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/main';

const completeDraft = {
  code: 'P-RICE-001',
  name: '东北五常大米福利装',
  merchantId: 'merchant-001',
  franchiseId: 'franchise-001',
  categoryId: 'category-rice',
  brandId: 'brand-hx',
  originCountry: '中国',
  originProvince: '黑龙江',
  originCity: '哈尔滨',
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

describe('Product draft command contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates a complete product draft command', async () => {
    const response = await request(app.getHttpServer()).post('/api/products/draft-validation').send(completeDraft).expect(200);

    expect(response.body).toEqual({
      valid: true,
      issues: [],
      submitReadiness: {
        ready: true,
        missingRequirements: []
      }
    });
  });

  it('returns a detail-section issue when draft detail content is missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/products/draft-validation')
      .send({ ...completeDraft, detailSections: [] })
      .expect(200);

    expect(response.body.valid).toBe(false);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'detail_section_required', field: 'detailSections' })])
    );
  });
});
