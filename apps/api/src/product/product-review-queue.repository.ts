import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ProductReviewQueueStatus = 'pending_review' | 'approved' | 'rejected';

export type ProductReviewQueueQuery = {
  status: ProductReviewQueueStatus;
};

export type ProductReviewQueueParty = {
  id: string;
  code: string;
  name: string;
};

export type ProductReviewQueueLatestLog = {
  action: string;
  actorUserId: string | null;
  reason: string | null;
  createdAt: string;
};

export type ProductReviewQueueItem = {
  productId: string;
  code: string;
  name: string;
  status: ProductReviewQueueStatus;
  saleStatus: string;
  merchant: ProductReviewQueueParty;
  franchise: ProductReviewQueueParty;
  category: ProductReviewQueueParty;
  brand: ProductReviewQueueParty | null;
  origin: {
    country: string;
    province: string | null;
    city: string | null;
    description: string | null;
  };
  skuCount: number;
  imageCount: number;
  qualificationCount: number;
  parameterCount: number;
  detailSectionCount: number;
  primaryImageUrl: string | null;
  latestReviewLog: ProductReviewQueueLatestLog | null;
};

export type ProductReviewQueueResult = {
  status: ProductReviewQueueStatus;
  items: ProductReviewQueueItem[];
};

@Injectable()
export class ProductReviewQueueRepository {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProductReviewQueueQuery): Promise<ProductReviewQueueResult> {
    const products = await this.prisma.product.findMany({
      where: {
        status: query.status,
        deletedAt: null
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        saleStatus: true,
        originCountry: true,
        originProvince: true,
        originCity: true,
        originDescription: true,
        merchant: { select: partySelect() },
        franchise: { select: partySelect() },
        category: { select: partySelect() },
        brand: { select: partySelect() },
        media: {
          where: { type: 'main_image' },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          take: 1,
          select: { url: true }
        },
        reviewLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            action: true,
            actorUserId: true,
            reason: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            skus: true,
            media: true,
            qualifications: true,
            parameters: true,
            detailSections: true
          }
        }
      }
    });

    return {
      status: query.status,
      items: products.map((product) => ({
        productId: product.id,
        code: product.code,
        name: product.name,
        status: product.status as ProductReviewQueueStatus,
        saleStatus: product.saleStatus,
        merchant: product.merchant,
        franchise: product.franchise,
        category: product.category,
        brand: product.brand,
        origin: {
          country: product.originCountry,
          province: product.originProvince,
          city: product.originCity,
          description: product.originDescription
        },
        skuCount: product._count.skus,
        imageCount: product._count.media,
        qualificationCount: product._count.qualifications,
        parameterCount: product._count.parameters,
        detailSectionCount: product._count.detailSections,
        primaryImageUrl: product.media[0]?.url ?? null,
        latestReviewLog: product.reviewLogs[0]
          ? {
              ...product.reviewLogs[0],
              createdAt: product.reviewLogs[0].createdAt.toISOString()
            }
          : null
      }))
    };
  }
}

function partySelect() {
  return {
    id: true,
    code: true,
    name: true
  } as const;
}
