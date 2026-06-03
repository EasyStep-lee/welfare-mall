import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ProductReviewQueueStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

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

export type ProductReviewQueuePrimarySku = {
  code: string;
  priceAmount: number;
  marketPriceAmount: number;
  specText: string;
};

export type ProductReviewQueueMedia = {
  type: string;
  url: string;
  sortOrder: number;
};

export type ProductReviewQueueQualification = {
  type: string;
  title: string;
  certificateNo: string | null;
  fileUrl: string | null;
};

export type ProductReviewQueueParameter = {
  groupName: string;
  name: string;
  value: string;
  valueType: string;
  sortOrder: number;
};

export type ProductReviewQueueDetailSection = {
  type: string;
  title: string | null;
  content: string | null;
  sortOrder: number;
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
  primarySku: ProductReviewQueuePrimarySku | null;
  media: ProductReviewQueueMedia[];
  qualifications: ProductReviewQueueQualification[];
  parameters: ProductReviewQueueParameter[];
  detailSections: ProductReviewQueueDetailSection[];
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
        skus: {
          where: { deletedAt: null },
          orderBy: [{ createdAt: 'asc' }],
          take: 1,
          select: {
            code: true,
            priceAmount: true,
            marketPriceAmount: true,
            specs: true
          }
        },
        media: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { type: true, url: true, sortOrder: true }
        },
        qualifications: {
          orderBy: [{ createdAt: 'asc' }],
          select: { type: true, title: true, certificateNo: true, fileUrl: true }
        },
        parameters: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { groupName: true, name: true, value: true, valueType: true, sortOrder: true }
        },
        detailSections: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { type: true, title: true, content: true, sortOrder: true }
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
        primaryImageUrl: product.media.find((media) => media.type === 'main_image')?.url ?? product.media[0]?.url ?? null,
        primarySku: product.skus[0]
          ? {
              code: product.skus[0].code,
              priceAmount: product.skus[0].priceAmount,
              marketPriceAmount: product.skus[0].marketPriceAmount,
              specText: formatSkuSpecs(product.skus[0].specs)
            }
          : null,
        media: product.media,
        qualifications: product.qualifications,
        parameters: product.parameters,
        detailSections: product.detailSections,
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

function formatSkuSpecs(specs: unknown): string {
  if (!Array.isArray(specs)) {
    return '';
  }

  return specs
    .filter((spec): spec is { name: string; value: string } => isSkuSpec(spec))
    .map((spec) => `${spec.name}: ${spec.value}`)
    .join(' / ');
}

function isSkuSpec(spec: unknown): spec is { name: string; value: string } {
  return (
    typeof spec === 'object' &&
    spec !== null &&
    'name' in spec &&
    'value' in spec &&
    typeof spec.name === 'string' &&
    typeof spec.value === 'string'
  );
}
function partySelect() {
  return {
    id: true,
    code: true,
    name: true
  } as const;
}
