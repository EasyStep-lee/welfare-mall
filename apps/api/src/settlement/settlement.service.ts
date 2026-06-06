import { BadRequestException, Injectable } from '@nestjs/common';
import {
  MerchantSettlementStatementConfirmResult,
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

export type ConfirmMerchantSettlementStatementOfflinePayoutInput = {
  statementNo: string;
  paidAt?: string;
  payoutReference?: string;
  payoutRemark?: string;
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

  async confirmMerchantSettlementStatementOfflinePayout(
    input: ConfirmMerchantSettlementStatementOfflinePayoutInput
  ): Promise<MerchantSettlementStatementConfirmResult> {
    if (typeof input?.statementNo !== 'string' || input.statementNo.trim().length === 0) {
      throw new BadRequestException('statementNo is required.');
    }

    return this.settlementRepository.confirmMerchantSettlementStatementOfflinePayout({
      statementNo: input.statementNo.trim(),
      paidAt: normalizeOptionalDate(input.paidAt) ?? new Date(),
      payoutReference: normalizeOptionalText(input.payoutReference) ?? null,
      payoutRemark: normalizeOptionalText(input.payoutRemark) ?? null
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

function normalizeOptionalDate(value: string | undefined): Date | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException('paidAt must be a valid ISO date.');
  }

  const date = new Date(value.trim());
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('paidAt must be a valid ISO date.');
  }

  return date;
}
