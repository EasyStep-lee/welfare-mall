import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type MerchantDraftContextParty = {
  id: string;
  code: string;
  name: string;
};

export type MerchantDraftContextMerchant = MerchantDraftContextParty & {
  address: string | null;
};

export type MerchantDraftContext = {
  merchant: MerchantDraftContextMerchant;
  franchise: MerchantDraftContextParty;
  defaultCategory: MerchantDraftContextParty | null;
  defaultBrand: MerchantDraftContextParty | null;
};

@Injectable()
export class MerchantDraftContextRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDraftContext(merchantId: string): Promise<MerchantDraftContext | null> {
    const normalizedMerchantId = merchantId.trim();
    const [merchant, defaultCategory, defaultBrand] = await Promise.all([
      this.prisma.merchant.findUnique({
        where: { id: normalizedMerchantId },
        select: {
          id: true,
          code: true,
          name: true,
          address: true,
          franchise: { select: { id: true, code: true, name: true } }
        }
      }),
      this.prisma.productCategory.findFirst({
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, code: true, name: true }
      }),
      this.prisma.productBrand.findFirst({
        where: { deletedAt: null },
        orderBy: [{ id: 'asc' }],
        select: { id: true, code: true, name: true }
      })
    ]);

    if (!merchant) {
      return null;
    }

    return {
      merchant: {
        id: merchant.id,
        code: merchant.code,
        name: merchant.name,
        address: merchant.address
      },
      franchise: merchant.franchise,
      defaultCategory,
      defaultBrand
    };
  }
}
