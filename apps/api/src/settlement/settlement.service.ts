import { BadRequestException, Injectable } from '@nestjs/common';
import {
  MerchantSettlementBillItemListInput,
  MerchantSettlementBillItemListResult,
  MerchantSettlementStatementGenerateResult,
  MerchantSettlementStatementListInput,
  MerchantSettlementStatementListResult,
  SettlementRepository
} from './settlement.repository';

export type GenerateMerchantBillItemsInput = {
  orderNo: string;
};

export type GenerateMerchantSettlementStatementInput = {
  merchantId: string;
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

  async generateMerchantSettlementStatement(
    input: GenerateMerchantSettlementStatementInput
  ): Promise<MerchantSettlementStatementGenerateResult> {
    if (typeof input?.merchantId !== 'string' || input.merchantId.trim().length === 0) {
      throw new BadRequestException('merchantId is required.');
    }

    return this.settlementRepository.generateMerchantSettlementStatement({
      merchantId: input.merchantId.trim(),
      statementNo: createStatementNo(),
      generatedAt: new Date()
    });
  }

  async listMerchantSettlementStatements(
    input: MerchantSettlementStatementListInput = {}
  ): Promise<MerchantSettlementStatementListResult> {
    return this.settlementRepository.listMerchantSettlementStatements({
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

function createStatementNo(): string {
  return `MSS-${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
