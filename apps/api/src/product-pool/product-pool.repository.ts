import { Injectable } from '@nestjs/common';
import { ProductPoolItemSnapshot, buildProductPoolItemSnapshot } from './product-pool-snapshot';
import { ProductPoolStatuses } from './product-pool-status';
import { PrismaService } from '../prisma/prisma.service';

export type PublishProductPoolInput = {
  productId: string;
  actorUserId: string;
};

export type ProductPoolSummary = {
  id: string;
  code: string;
  name: string;
  status: string;
  franchiseId: string | null;
};

export type ProductPoolItemSummary = Omit<ProductPoolItemSnapshot, 'skuId' | 'displaySkuCode'> & {
  id: string;
  skuId: string | null;
  displaySkuCode: string | null;
  sortOrder: number;
};

export type ProductPoolCatalogItem = ProductPoolSummary & {
  items: ProductPoolItemSummary[];
};

export type ProductPoolCatalogQuery = {
  franchiseId?: string | null;
};

export type ProductPoolCatalogResult = {
  productPools: ProductPoolCatalogItem[];
};

export type PublishProductPoolResult =
  | {
      allowed: true;
      productPool: ProductPoolSummary;
      publishedItems: ProductPoolItemSummary[];
    }
  | {
      allowed: false;
      productId: string;
      reasonCode: 'not_approved' | 'missing_sku' | 'missing_main_image';
      reason: string;
    };

@Injectable()
export class ProductPoolRepository {
  constructor(private readonly prisma: PrismaService) {}

  async publishApprovedProduct(input: PublishProductPoolInput): Promise<PublishProductPoolResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: input.productId },
        select: {
          id: true,
          name: true,
          status: true,
          franchiseId: true,
          skus: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            select: { id: true, code: true, priceAmount: true }
          },
          media: {
            where: { type: 'main_image' },
            orderBy: { sortOrder: 'asc' },
            take: 1,
            select: { url: true }
          }
        }
      });

      if (!product) {
        return null;
      }

      if (product.status !== 'approved') {
        return denied(input.productId, 'not_approved', 'product must be approved before publishing to product pool');
      }

      if (product.skus.length === 0) {
        return denied(input.productId, 'missing_sku', 'product must have at least one SKU before publishing to product pool');
      }

      const mainImageUrl = product.media[0]?.url;
      if (!mainImageUrl) {
        return denied(input.productId, 'missing_main_image', 'product must have a main image before publishing to product pool');
      }

      const productPool = await tx.productPool.upsert({
        where: { code: defaultPoolCode(product.franchiseId) },
        create: {
          code: defaultPoolCode(product.franchiseId),
          name: '默认商品池',
          status: ProductPoolStatuses.Active,
          franchiseId: product.franchiseId
        },
        update: {
          status: ProductPoolStatuses.Active,
          deletedAt: null
        },
        select: productPoolSelect()
      });

      const publishedItems: ProductPoolItemSummary[] = [];
      for (const [index, sku] of product.skus.entries()) {
        const snapshot = buildProductPoolItemSnapshot({
          productId: product.id,
          skuId: sku.id,
          productName: product.name,
          skuCode: sku.code,
          priceAmount: sku.priceAmount,
          mainImageUrl
        });
        const existingItem = await tx.productPoolItem.findFirst({
          where: {
            productPoolId: productPool.id,
            productId: product.id,
            skuId: sku.id
          },
          select: { id: true }
        });
        const productPoolItem = existingItem
          ? await tx.productPoolItem.update({
              where: { id: existingItem.id },
              data: { ...snapshot, sortOrder: index },
              select: productPoolItemSelect()
            })
          : await tx.productPoolItem.create({
              data: {
                productPoolId: productPool.id,
                ...snapshot,
                sortOrder: index
              },
              select: productPoolItemSelect()
            });

        publishedItems.push(productPoolItem);
      }

      return {
        allowed: true,
        productPool,
        publishedItems
      };
    });
  }

  async listCatalog(query: ProductPoolCatalogQuery): Promise<ProductPoolCatalogResult> {
    const productPools = await this.prisma.productPool.findMany({
      where: {
        status: ProductPoolStatuses.Active,
        deletedAt: null,
        ...(query.franchiseId ? { franchiseId: query.franchiseId } : {})
      },
      orderBy: { createdAt: 'asc' },
      select: {
        ...productPoolSelect(),
        items: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: productPoolItemSelect()
        }
      }
    });

    return { productPools };
  }
}

function defaultPoolCode(franchiseId: string): string {
  return `FRANCHISE-${franchiseId}-DEFAULT`;
}

function denied(
  productId: string,
  reasonCode: 'not_approved' | 'missing_sku' | 'missing_main_image',
  reason: string
): Extract<PublishProductPoolResult, { allowed: false }> {
  return {
    allowed: false,
    productId,
    reasonCode,
    reason
  };
}

function productPoolSelect() {
  return {
    id: true,
    code: true,
    name: true,
    status: true,
    franchiseId: true
  } as const;
}

function productPoolItemSelect() {
  return {
    id: true,
    productId: true,
    skuId: true,
    sortOrder: true,
    displayName: true,
    displaySkuCode: true,
    displayPriceAmount: true,
    displayImageUrl: true
  } as const;
}
