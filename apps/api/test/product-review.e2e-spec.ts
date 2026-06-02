import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../src/main';

describe('Product review workflow catalogs', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns product review actions', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/review-actions').expect(200);

    expect(response.body).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'submit_review' })]));
  });

  it('returns product status transitions', async () => {
    const response = await request(app.getHttpServer()).get('/api/products/status-transitions').expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromStatus: 'pending_review',
          action: 'approve',
          toStatus: 'approved'
        })
      ])
    );
  });
});
