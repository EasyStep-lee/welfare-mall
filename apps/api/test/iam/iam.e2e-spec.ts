import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createApp } from '../../src/main';

describe('IAM API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the permission catalog', async () => {
    const response = await request(app.getHttpServer()).get('/api/iam/permissions/catalog').expect(200);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'product:read',
          name: '商品查看',
          risk: 'low'
        })
      ])
    );
  });
});

