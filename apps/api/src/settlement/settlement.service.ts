import { BadRequestException, Injectable } from '@nestjs/common';
import {
  MerchantSettlementBillItemListInput,
  MerchantSettlementBillItemListResult,
  SettlementRepository
} from './settlement.repository';

export type GenerateMerchantBillItemsInput = {
  orderNo: string;
};

@Injectable()
export class SettlementService {
  constructor(private readonly settlementRepository: SettlementRepository) {}

  async generateMerchantBillItems(input: GenerateMerchantBillItemsInput): Promise<MerchantSettlementBillItemListResult> {
    if (typeof input?.orderNo !== 'string' || input.orderNo.trim().length === 0) {
      throw new BadRequestException('orderNo is required.');
    }

    return this.settlementRepository.generateMerchantBillItemsForPaidOrder(input.orderNo.trim());
  }

  async listMerchantBillItems(input: MerchantSettlementBillItemListInput = {}): Promise<MerchantSettlementBillItemListResult> {
    return this.settlementRepository.listMerchantBillItems({
      merchantId: normalizeOptionalText(input.merchantId),
      status: normalizeOptionalText(input.status)
    });
  }
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}
