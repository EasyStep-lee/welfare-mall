import { PrismaClient } from '@prisma/client';

type SeedPrisma = {
  $transaction<T>(callback: (tx: SeedTransaction) => Promise<T>): Promise<T>;
};

type SeedTransaction = {
  productPoolItem: { deleteMany(args: unknown): Promise<unknown> };
  productReviewLog: { deleteMany(args: unknown): Promise<unknown>; create(args: unknown): Promise<unknown> };
  productDraftSnapshot: { deleteMany(args: unknown): Promise<unknown>; create(args: unknown): Promise<unknown> };
  productDetailSection: { deleteMany(args: unknown): Promise<unknown>; createMany(args: unknown): Promise<unknown> };
  productParameter: { deleteMany(args: unknown): Promise<unknown>; createMany(args: unknown): Promise<unknown> };
  productQualification: { deleteMany(args: unknown): Promise<unknown>; createMany(args: unknown): Promise<unknown> };
  productMedia: { deleteMany(args: unknown): Promise<unknown>; createMany(args: unknown): Promise<unknown> };
  productSku: { deleteMany(args: unknown): Promise<unknown>; createMany(args: unknown): Promise<unknown> };
  franchise: { upsert(args: unknown): Promise<unknown> };
  merchant: { upsert(args: unknown): Promise<unknown> };
  productCategory: { upsert(args: unknown): Promise<unknown> };
  productBrand: { upsert(args: unknown): Promise<unknown> };
  product: { upsert(args: unknown): Promise<unknown> };
};

const ids = {
  franchiseId: 'franchise-local-review',
  merchantId: 'merchant-local-review',
  categoryId: 'category-local-review',
  brandId: 'brand-local-review',
  productId: 'product-local-review'
};

const productCode = 'P-LOCAL-REVIEW-001';
const draftPayload = {
  code: productCode,
  name: '本地审核五常大米福利装',
  merchantId: ids.merchantId,
  franchiseId: ids.franchiseId,
  categoryId: ids.categoryId,
  brandId: ids.brandId,
  originCountry: '中国',
  originProvince: '黑龙江',
  originCity: '哈尔滨',
  originDescription: '五常核心产区',
  skus: [
    {
      code: 'SKU-LOCAL-REVIEW-5KG',
      priceAmount: 6990,
      marketPriceAmount: 7990,
      costPriceAmount: 5200,
      barcode: '6900000000001',
      specs: [{ name: '规格', value: '5kg' }],
      weightGrams: 5000,
      volumeMilliliters: 9000
    }
  ],
  media: [
    {
      type: 'main_image',
      url: 'https://img.example.com/local-review/rice-main.jpg',
      sortOrder: 1,
      altText: '本地审核五常大米主图'
    },
    {
      type: 'detail_image',
      url: 'https://img.example.com/local-review/rice-detail.jpg',
      sortOrder: 2,
      altText: '本地审核五常大米详情图'
    }
  ],
  qualifications: [
    {
      type: 'origin_certificate',
      title: '产地证明',
      certificateNo: 'CERT-LOCAL-REVIEW-001',
      fileUrl: 'https://img.example.com/local-review/cert-origin.pdf',
      validFrom: new Date('2026-06-01T00:00:00.000Z'),
      validTo: new Date('2027-06-01T00:00:00.000Z')
    }
  ],
  parameters: [{ groupName: '基础参数', name: '净含量', value: '5kg', valueType: 'text', sortOrder: 1 }],
  detailSections: [{ type: 'text', title: '福利说明', content: '适合企业福利发放', sortOrder: 1 }]
};

export async function seedLocalReviewProduct(prisma: SeedPrisma) {
  await prisma.$transaction(async (tx) => {
    await tx.productPoolItem.deleteMany({ where: { productId: ids.productId } });
    await tx.productReviewLog.deleteMany({ where: { productId: ids.productId } });
    await tx.productDraftSnapshot.deleteMany({ where: { productId: ids.productId } });
    await tx.productDetailSection.deleteMany({ where: { productId: ids.productId } });
    await tx.productParameter.deleteMany({ where: { productId: ids.productId } });
    await tx.productQualification.deleteMany({ where: { productId: ids.productId } });
    await tx.productMedia.deleteMany({ where: { productId: ids.productId } });
    await tx.productSku.deleteMany({ where: { productId: ids.productId } });

    await tx.franchise.upsert({
      where: { id: ids.franchiseId },
      update: { code: 'F-LOCAL-REVIEW', name: '本地福利卡中心', status: 'active' },
      create: { id: ids.franchiseId, code: 'F-LOCAL-REVIEW', name: '本地福利卡中心', status: 'active' }
    });
    await tx.merchant.upsert({
      where: { id: ids.merchantId },
      update: {
        code: 'M-LOCAL-REVIEW',
        name: '本地优选商户',
        status: 'active',
        franchiseId: ids.franchiseId,
        businessScopes: ['粮油副食']
      },
      create: {
        id: ids.merchantId,
        code: 'M-LOCAL-REVIEW',
        name: '本地优选商户',
        status: 'active',
        franchiseId: ids.franchiseId,
        businessScopes: ['粮油副食']
      }
    });
    await tx.productCategory.upsert({
      where: { id: ids.categoryId },
      update: { code: 'local-grain', name: '粮油副食', sortOrder: 1 },
      create: { id: ids.categoryId, code: 'local-grain', name: '粮油副食', sortOrder: 1 }
    });
    await tx.productBrand.upsert({
      where: { id: ids.brandId },
      update: { code: 'local-wuchang', name: '五常香米', logoUrl: null },
      create: { id: ids.brandId, code: 'local-wuchang', name: '五常香米', logoUrl: null }
    });
    await tx.product.upsert({
      where: { id: ids.productId },
      update: {
        code: productCode,
        name: draftPayload.name,
        merchantId: ids.merchantId,
        franchiseId: ids.franchiseId,
        categoryId: ids.categoryId,
        brandId: ids.brandId,
        status: 'pending_review',
        saleStatus: 'off_sale',
        originCountry: draftPayload.originCountry,
        originProvince: draftPayload.originProvince,
        originCity: draftPayload.originCity,
        originDescription: draftPayload.originDescription,
        deletedAt: null
      },
      create: {
        id: ids.productId,
        code: productCode,
        name: draftPayload.name,
        merchantId: ids.merchantId,
        franchiseId: ids.franchiseId,
        categoryId: ids.categoryId,
        brandId: ids.brandId,
        status: 'pending_review',
        saleStatus: 'off_sale',
        originCountry: draftPayload.originCountry,
        originProvince: draftPayload.originProvince,
        originCity: draftPayload.originCity,
        originDescription: draftPayload.originDescription
      }
    });

    await tx.productSku.createMany({
      data: draftPayload.skus.map((sku) => ({ productId: ids.productId, ...sku }))
    });
    await tx.productMedia.createMany({
      data: draftPayload.media.map((media) => ({ productId: ids.productId, ...media }))
    });
    await tx.productQualification.createMany({
      data: draftPayload.qualifications.map((qualification) => ({ productId: ids.productId, ...qualification }))
    });
    await tx.productParameter.createMany({
      data: draftPayload.parameters.map((parameter) => ({ productId: ids.productId, ...parameter }))
    });
    await tx.productDetailSection.createMany({
      data: draftPayload.detailSections.map((section) => ({ productId: ids.productId, ...section }))
    });
    await tx.productDraftSnapshot.create({
      data: {
        productId: ids.productId,
        versionNo: 1,
        payload: draftPayload,
        createdBy: 'merchant-user-local'
      }
    });
    await tx.productReviewLog.create({
      data: {
        productId: ids.productId,
        actorUserId: 'merchant-user-local',
        actorType: 'merchant',
        action: 'submit_review',
        fromStatus: 'draft',
        toStatus: 'pending_review',
        reason: null
      }
    });
  });

  return { productId: ids.productId, code: productCode, status: 'pending_review' };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await seedLocalReviewProduct(prisma);
    console.log(`${result.code} ${result.status}`);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main();
}
