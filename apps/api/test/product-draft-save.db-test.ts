import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createApp } from '../src/main';

const runId = `db${Date.now()}`;
const ids = {
  franchiseId: `franchise-${runId}`,
  merchantId: `merchant-${runId}`,
  categoryId: `category-${runId}`
};

function createDraft(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    code: `P-${runId}`,
    name: '真实库五常大米福利装',
    merchantId: ids.merchantId,
    franchiseId: ids.franchiseId,
    categoryId: ids.categoryId,
    originCountry: '中国',
    originProvince: '黑龙江',
    originCity: '哈尔滨',
    skus: [
      {
        code: `SKU-${runId}-5KG`,
        priceAmount: 6990,
        marketPriceAmount: 8990,
        costPriceAmount: 5200,
        specs: [{ name: '规格', value: '5kg' }]
      }
    ],
    media: [
      { type: 'main_image', url: `https://cdn.example.com/${runId}/main.jpg` },
      { type: 'detail_image', url: `https://cdn.example.com/${runId}/detail.jpg` }
    ],
    qualifications: [{ type: 'origin_certificate', title: '产地证明', certificateNo: `CERT-${runId}` }],
    parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text' }],
    detailSections: [{ type: 'image', imageUrl: `https://cdn.example.com/${runId}/detail-1.jpg` }],
    ...overrides
  };
}

describe('Product draft save real database integration', () => {
  const prisma = new PrismaClient();
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();

    await prisma.franchise.create({
      data: {
        id: ids.franchiseId,
        code: `FR-${runId}`,
        name: '真实库测试加盟商',
        status: 'active'
      }
    });
    await prisma.merchant.create({
      data: {
        id: ids.merchantId,
        code: `MC-${runId}`,
        name: '真实库测试商户',
        status: 'active',
        franchiseId: ids.franchiseId
      }
    });
    await prisma.productCategory.create({
      data: {
        id: ids.categoryId,
        code: `CAT-${runId}`,
        name: '真实库测试分类'
      }
    });
  });

  afterAll(async () => {
    await prisma.productDraftSnapshot.deleteMany({ where: { product: { code: { startsWith: `P-${runId}` } } } });
    await prisma.productReviewLog.deleteMany({ where: { product: { code: { startsWith: `P-${runId}` } } } });
    await prisma.productDetailSection.deleteMany({ where: { product: { code: { startsWith: `P-${runId}` } } } });
    await prisma.productParameter.deleteMany({ where: { product: { code: { startsWith: `P-${runId}` } } } });
    await prisma.productQualification.deleteMany({ where: { product: { code: { startsWith: `P-${runId}` } } } });
    await prisma.productMedia.deleteMany({ where: { product: { code: { startsWith: `P-${runId}` } } } });
    await prisma.productSku.deleteMany({ where: { product: { code: { startsWith: `P-${runId}` } } } });
    await prisma.product.deleteMany({ where: { code: { startsWith: `P-${runId}` } } });
    await prisma.merchant.deleteMany({ where: { id: ids.merchantId } });
    await prisma.franchise.deleteMany({ where: { id: ids.franchiseId } });
    await prisma.productCategory.deleteMany({ where: { id: ids.categoryId } });
    await prisma.$disconnect();
    await app.close();
  });

  it('creates and updates product master data with draft snapshots in MySQL', async () => {
    const createDraftPayload = createDraft();

    const createResponse = await request(app.getHttpServer())
      .post('/api/products/drafts/save')
      .send({ payload: createDraftPayload, actorUserId: 'merchant-user-db' })
      .expect(201);

    const productId = createResponse.body.product.productId as string;

    expect(createResponse.body.product).toEqual({
      productId,
      mode: 'created',
      skuCount: 1,
      mediaCount: 2,
      qualificationCount: 1,
      parameterCount: 1,
      detailSectionCount: 1
    });
    await expect(prisma.product.findUnique({ where: { id: productId } })).resolves.toEqual(
      expect.objectContaining({
        id: productId,
        code: `P-${runId}`,
        name: '真实库五常大米福利装',
        status: 'draft',
        saleStatus: 'off_sale'
      })
    );
    await expect(prisma.productSku.count({ where: { productId } })).resolves.toBe(1);
    await expect(prisma.productMedia.count({ where: { productId } })).resolves.toBe(2);
    await expect(prisma.productQualification.count({ where: { productId } })).resolves.toBe(1);
    await expect(prisma.productParameter.count({ where: { productId } })).resolves.toBe(1);
    await expect(prisma.productDetailSection.count({ where: { productId } })).resolves.toBe(1);
    await expect(prisma.productDraftSnapshot.count({ where: { productId } })).resolves.toBe(1);

    const updateDraftPayload = createDraft({
      name: '真实库五常大米福利装二次编辑',
      skus: [
        {
          code: `SKU-${runId}-10KG`,
          priceAmount: 12990,
          marketPriceAmount: 15990,
          specs: [{ name: '规格', value: '10kg' }]
        }
      ],
      parameters: [{ groupName: '基础参数', name: '净含量', value: '10kg', valueType: 'text' }],
      detailSections: [{ type: 'text', title: '商品介绍', content: '二次编辑后的商品详情。' }]
    });

    const updateResponse = await request(app.getHttpServer())
      .post('/api/products/drafts/save')
      .send({ productId, payload: updateDraftPayload, actorUserId: 'merchant-user-db' })
      .expect(201);

    expect(updateResponse.body.product.mode).toBe('updated');
    expect(updateResponse.body.snapshot.versionNo).toBe(2);
    await expect(prisma.product.findUnique({ where: { id: productId } })).resolves.toEqual(
      expect.objectContaining({ name: '真实库五常大米福利装二次编辑' })
    );
    await expect(prisma.productSku.findMany({ where: { productId }, select: { code: true } })).resolves.toEqual([
      { code: `SKU-${runId}-10KG` }
    ]);
    await expect(prisma.productParameter.findMany({ where: { productId }, select: { value: true } })).resolves.toEqual([
      { value: '10kg' }
    ]);
    await expect(prisma.productDraftSnapshot.count({ where: { productId } })).resolves.toBe(2);

    const submitResponse = await request(app.getHttpServer())
      .post(`/api/products/${productId}/review-submissions`)
      .send({ actorUserId: 'merchant-user-db' })
      .expect(201);

    expect(submitResponse.body).toEqual(
      expect.objectContaining({
        productId,
        action: 'submit_review',
        fromStatus: 'draft',
        toStatus: 'pending_review'
      })
    );
    await expect(prisma.product.findUnique({ where: { id: productId } })).resolves.toEqual(
      expect.objectContaining({ status: 'pending_review' })
    );
    const approveResponse = await request(app.getHttpServer())
      .post(`/api/products/${productId}/review-decisions`)
      .send({ action: 'approve', actorUserId: 'admin-user-db' })
      .expect(201);

    expect(approveResponse.body).toEqual(
      expect.objectContaining({
        productId,
        action: 'approve',
        fromStatus: 'pending_review',
        toStatus: 'approved'
      })
    );
    await expect(prisma.product.findUnique({ where: { id: productId } })).resolves.toEqual(
      expect.objectContaining({ status: 'approved' })
    );
    await expect(
      prisma.productReviewLog.findMany({
        where: { productId },
        orderBy: { createdAt: 'asc' },
        select: { actorUserId: true, actorType: true, action: true, fromStatus: true, toStatus: true, reason: true }
      })
    ).resolves.toEqual([
      {
        actorUserId: 'merchant-user-db',
        actorType: 'merchant',
        action: 'submit_review',
        fromStatus: 'draft',
        toStatus: 'pending_review',
        reason: null
      },
      {
        actorUserId: 'admin-user-db',
        actorType: 'admin',
        action: 'approve',
        fromStatus: 'pending_review',
        toStatus: 'approved',
        reason: null
      }
    ]);

    const rejectedDraftPayload = createDraft({
      code: `P-${runId}-REJECT`,
      name: '真实库待驳回福利装',
      skus: [
        {
          code: `SKU-${runId}-REJECT`,
          priceAmount: 3990,
          marketPriceAmount: 4990,
          specs: [{ name: '规格', value: '2kg' }]
        }
      ]
    });

    const rejectedCreateResponse = await request(app.getHttpServer())
      .post('/api/products/drafts/save')
      .send({ payload: rejectedDraftPayload, actorUserId: 'merchant-user-db' })
      .expect(201);
    const rejectedProductId = rejectedCreateResponse.body.product.productId as string;

    await request(app.getHttpServer())
      .post(`/api/products/${rejectedProductId}/review-submissions`)
      .send({ actorUserId: 'merchant-user-db' })
      .expect(201);
    const rejectResponse = await request(app.getHttpServer())
      .post(`/api/products/${rejectedProductId}/review-decisions`)
      .send({ action: 'reject', actorUserId: 'admin-user-db', reason: '资质材料不完整' })
      .expect(201);

    expect(rejectResponse.body).toEqual(
      expect.objectContaining({
        productId: rejectedProductId,
        action: 'reject',
        fromStatus: 'pending_review',
        toStatus: 'rejected'
      })
    );
    await expect(prisma.product.findUnique({ where: { id: rejectedProductId } })).resolves.toEqual(
      expect.objectContaining({ status: 'rejected' })
    );
    await expect(
      prisma.productReviewLog.findMany({
        where: { productId: rejectedProductId, actorType: 'admin' },
        select: { actorUserId: true, actorType: true, action: true, fromStatus: true, toStatus: true, reason: true }
      })
    ).resolves.toEqual([
      {
        actorUserId: 'admin-user-db',
        actorType: 'admin',
        action: 'reject',
        fromStatus: 'pending_review',
        toStatus: 'rejected',
        reason: '资质材料不完整'
      }
    ]);
  });
});
