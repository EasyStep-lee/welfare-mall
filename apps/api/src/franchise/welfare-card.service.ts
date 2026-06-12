import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BuyerWelfareCardAccountsResult,
  WelfareCardBatchCreateResult,
  WelfareCardBindResult,
  WelfareCardIssueResult,
  WelfareCardRepository
} from './welfare-card.repository';

export type IssueWelfareCardInput = {
  franchiseId: string;
  buyerUserId: string;
  requestId: string;
  amount: number;
  remark?: string;
};

export type CreateWelfareCardBatchInput = {
  franchiseId: string;
  requestId: string;
  batchName: string;
  faceValueAmount: number;
  totalCards: number;
  createdBy: string;
  remark?: string;
};

export type BindWelfareCardInput = {
  franchiseId: string;
  buyerUserId: string;
  requestId: string;
  cardNo: string;
  bindCode: string;
};

export type ListBuyerWelfareCardAccountsInput = {
  franchiseId: string;
  buyerUserId: string;
};

@Injectable()
export class WelfareCardService {
  constructor(private readonly welfareCardRepository: WelfareCardRepository) {}

  async createWelfareCardBatch(input: CreateWelfareCardBatchInput): Promise<WelfareCardBatchCreateResult> {
    const franchiseId = normalizeRequiredText(input?.franchiseId, 'franchiseId');
    const requestId = normalizeRequiredText(input?.requestId, 'requestId');
    const batchName = normalizeRequiredText(input?.batchName, 'batchName');
    const faceValueAmount = normalizePositiveInteger(input?.faceValueAmount, 'faceValueAmount');
    const totalCards = normalizePositiveInteger(input?.totalCards, 'totalCards');
    const createdBy = normalizeRequiredText(input?.createdBy, 'createdBy');

    return this.welfareCardRepository.createWelfareCardBatch({
      franchiseId,
      requestId,
      batchName,
      faceValueAmount,
      totalCards,
      createdBy,
      remark: normalizeOptionalText(input?.remark)
    });
  }

  async issueWelfareCard(input: IssueWelfareCardInput): Promise<WelfareCardIssueResult> {
    const franchiseId = normalizeRequiredText(input?.franchiseId, 'franchiseId');
    const buyerUserId = normalizeRequiredText(input?.buyerUserId, 'buyerUserId');
    const requestId = normalizeRequiredText(input?.requestId, 'requestId');
    const amount = normalizePositiveInteger(input?.amount, 'amount');

    return this.welfareCardRepository.issueWelfareCard({
      franchiseId,
      buyerUserId,
      requestId,
      amount,
      remark: normalizeOptionalText(input?.remark)
    });
  }

  async listBuyerWelfareCardAccounts(
    input: ListBuyerWelfareCardAccountsInput
  ): Promise<BuyerWelfareCardAccountsResult> {
    const franchiseId = normalizeRequiredText(input?.franchiseId, 'franchiseId');
    const buyerUserId = normalizeRequiredText(input?.buyerUserId, 'buyerUserId');

    return this.welfareCardRepository.listBuyerWelfareCardAccounts({
      franchiseId,
      buyerUserId
    });
  }

  async bindWelfareCard(input: BindWelfareCardInput): Promise<WelfareCardBindResult> {
    const franchiseId = normalizeRequiredText(input?.franchiseId, 'franchiseId');
    const buyerUserId = normalizeRequiredText(input?.buyerUserId, 'buyerUserId');
    const requestId = normalizeRequiredText(input?.requestId, 'requestId');
    const cardNo = normalizeRequiredText(input?.cardNo, 'cardNo');
    const bindCode = normalizeRequiredText(input?.bindCode, 'bindCode');

    return this.welfareCardRepository.bindWelfareCard({
      franchiseId,
      buyerUserId,
      requestId,
      cardNo,
      bindCode
    });
  }
}

function normalizeRequiredText(value: string | undefined, fieldName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }

  return value.trim();
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizePositiveInteger(value: number | undefined, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer amount in cents.`);
  }

  return value;
}
