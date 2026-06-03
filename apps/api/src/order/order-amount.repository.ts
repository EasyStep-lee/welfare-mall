import { Injectable } from '@nestjs/common';
import { ProductPoolStatuses } from '../product-pool/product-pool-status';
import { PrismaService } from '../prisma/prisma.service';

export type OrderAmountProductPoolItem = {
  id: string;
  productId: string;
  skuId: string | null;
  displayName: string;
  displaySkuCode: string | null;
  displayPriceAmount: number;
  displayImageUrl: string;
};

@Injectable()
export class OrderAmountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAmountItemsByIds(productPoolItemIds: string[]): Promise<OrderAmountProductPoolItem[]> {
    const uniqueIds = Array.from(new Set(productPoolItemIds));

    return this.prisma.productPoolItem.findMany({
      where: {
        id: { in: uniqueIds },
        productPool: {
          status: ProductPoolStatuses.Active,
          deletedAt: null
        }
      },
      select: {
        id: true,
        productId: true,
        skuId: true,
        displayName: true,
        displaySkuCode: true,
        displayPriceAmount: true,
        displayImageUrl: true
      }
    });
  }
}
