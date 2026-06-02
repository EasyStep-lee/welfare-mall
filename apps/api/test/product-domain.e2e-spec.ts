import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/main';

describe('Product domain catalogs', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns product statuses', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/statuses').expect(200);

    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'draft' })]));
  });

  it('returns sale statuses', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/sale-statuses').expect(200);

    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'on_sale' })]));
  });

  it('returns media types', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/media-types').expect(200);

    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'detail_image' })]));
  });

  it('returns qualification types', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/qualification-types').expect(200);

    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'origin_certificate' })]));
  });

  it('returns parameter value types', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/parameter-value-types').expect(200);

    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'text' })]));
  });

  it('returns product-pool statuses', async () => {
    const response = await request(app.getHttpServer()).get('/api/product-pools/statuses').expect(200);

    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'active' })]));
  });
});
