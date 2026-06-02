import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ProductDraftCommandInput,
  ProductDraftDetailSectionInput,
  ProductDraftMediaInput,
  ProductDraftParameterInput,
  ProductDraftQualificationInput,
  ProductDraftSkuInput
} from './product-draft-command';

const PRODUCT_DRAFT_STATUS = 'draft';
const PRODUCT_OFF_SALE_STATUS = 'off_sale';

export type SaveProductMasterFromDraftInput = {
  productId?: string | null;
  payload: ProductDraftCommandInput;
  actorUserId: string;
};

export type ProductMasterWriteSummary = {
  productId: string;
  mode: 'created' | 'updated';
  skuCount: number;
  mediaCount: number;
  qualificationCount: number;
  parameterCount: number;
  detailSectionCount: number;
};

@Injectable()
export class ProductMasterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveFromDraft(input: SaveProductMasterFromDraftInput): Promise<ProductMasterWriteSummary> {
    const payload = input.payload;
    const skus = payload.skus ?? [];
    const media = payload.media ?? [];
    const qualifications = payload.qualifications ?? [];
    const parameters = payload.parameters ?? [];
    const detailSections = payload.detailSections ?? [];

    return this.prisma.$transaction(async (tx) => {
      const product = input.productId
        ? await tx.product.update({
            where: { id: input.productId },
            data: toProductData(payload),
            select: { id: true }
          })
        : await tx.product.create({
            data: {
              ...toProductData(payload),
              status: PRODUCT_DRAFT_STATUS,
              saleStatus: PRODUCT_OFF_SALE_STATUS
            },
            select: { id: true }
          });

      const productId = product.id;
      await replaceChildRows(tx, productId);
      await createChildRows(tx, productId, {
        skus,
        media,
        qualifications,
        parameters,
        detailSections
      });

      return {
        productId,
        mode: input.productId ? 'updated' : 'created',
        skuCount: skus.length,
        mediaCount: media.length,
        qualificationCount: qualifications.length,
        parameterCount: parameters.length,
        detailSectionCount: detailSections.length
      };
    });
  }
}

function toProductData(payload: ProductDraftCommandInput) {
  return {
    code: requireText(payload.code, 'code'),
    name: requireText(payload.name, 'name'),
    merchantId: requireText(payload.merchantId, 'merchantId'),
    franchiseId: requireText(payload.franchiseId, 'franchiseId'),
    categoryId: requireText(payload.categoryId, 'categoryId'),
    brandId: nullableText(payload.brandId),
    originCountry: requireText(payload.originCountry, 'originCountry'),
    originProvince: nullableText(payload.originProvince),
    originCity: nullableText(payload.originCity),
    originDescription: nullableText(payload.originDescription)
  };
}

async function replaceChildRows(tx: Prisma.TransactionClient, productId: string) {
  await tx.productSku.deleteMany({ where: { productId } });
  await tx.productMedia.deleteMany({ where: { productId } });
  await tx.productQualification.deleteMany({ where: { productId } });
  await tx.productParameter.deleteMany({ where: { productId } });
  await tx.productDetailSection.deleteMany({ where: { productId } });
}

async function createChildRows(
  tx: Prisma.TransactionClient,
  productId: string,
  input: {
    skus: ProductDraftSkuInput[];
    media: ProductDraftMediaInput[];
    qualifications: ProductDraftQualificationInput[];
    parameters: ProductDraftParameterInput[];
    detailSections: ProductDraftDetailSectionInput[];
  }
) {
  if (input.skus.length > 0) {
    await tx.productSku.createMany({ data: input.skus.map((sku) => toSkuRow(productId, sku)) });
  }

  if (input.media.length > 0) {
    await tx.productMedia.createMany({ data: input.media.map((item, index) => toMediaRow(productId, item, index)) });
  }

  if (input.qualifications.length > 0) {
    await tx.productQualification.createMany({
      data: input.qualifications.map((item) => toQualificationRow(productId, item))
    });
  }

  if (input.parameters.length > 0) {
    await tx.productParameter.createMany({
      data: input.parameters.map((item, index) => toParameterRow(productId, item, index))
    });
  }

  if (input.detailSections.length > 0) {
    await tx.productDetailSection.createMany({
      data: input.detailSections.map((item, index) => toDetailSectionRow(productId, item, index))
    });
  }
}

function toSkuRow(productId: string, sku: ProductDraftSkuInput) {
  return {
    productId,
    code: requireText(sku.code, 'sku.code'),
    priceAmount: requireNumber(sku.priceAmount, 'sku.priceAmount'),
    marketPriceAmount: requireNumber(sku.marketPriceAmount, 'sku.marketPriceAmount'),
    costPriceAmount: nullableNumber(sku.costPriceAmount),
    barcode: nullableText(sku.barcode),
    specs: (sku.specs ?? []) as Prisma.InputJsonValue,
    weightGrams: nullableNumber(sku.weightGrams),
    volumeMilliliters: nullableNumber(sku.volumeMilliliters)
  };
}

function toMediaRow(productId: string, media: ProductDraftMediaInput, index: number) {
  return {
    productId,
    type: requireText(media.type, 'media.type'),
    url: requireText(media.url, 'media.url'),
    sortOrder: media.sortOrder ?? index,
    altText: nullableText(media.altText)
  };
}

function toQualificationRow(productId: string, qualification: ProductDraftQualificationInput) {
  return {
    productId,
    type: requireText(qualification.type, 'qualification.type'),
    title: requireText(qualification.title, 'qualification.title'),
    certificateNo: nullableText(qualification.certificateNo),
    fileUrl: nullableText(qualification.fileUrl),
    validFrom: parseOptionalDate(qualification.validFrom),
    validTo: parseOptionalDate(qualification.validTo)
  };
}

function toParameterRow(productId: string, parameter: ProductDraftParameterInput, index: number) {
  return {
    productId,
    groupName: requireText(parameter.groupName, 'parameter.groupName'),
    name: requireText(parameter.name, 'parameter.name'),
    value: requireText(parameter.value, 'parameter.value'),
    valueType: requireText(parameter.valueType, 'parameter.valueType'),
    sortOrder: parameter.sortOrder ?? index
  };
}

function toDetailSectionRow(productId: string, section: ProductDraftDetailSectionInput, index: number) {
  return {
    productId,
    type: requireText(section.type, 'detailSection.type'),
    title: nullableText(section.title),
    content: nullableText(section.content),
    imageUrl: nullableText(section.imageUrl),
    sortOrder: section.sortOrder ?? index
  };
}

function requireText(value: string | null | undefined, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Product draft ${field} is required before saving master data.`);
  }

  return value;
}

function requireNumber(value: number | null | undefined, field: string): number {
  if (typeof value !== 'number') {
    throw new Error(`Product draft ${field} is required before saving master data.`);
  }

  return value;
}

function nullableText(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function nullableNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' ? value : null;
}

function parseOptionalDate(value: string | null | undefined): Date | null {
  return typeof value === 'string' && value.trim().length > 0 ? new Date(value) : null;
}
