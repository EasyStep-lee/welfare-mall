import { BadRequestException, Injectable } from '@nestjs/common';
import { WelfareCardIssueResult, WelfareCardRepository } from './welfare-card.repository';

export type IssueWelfareCardInput = {
  franchiseId: string;
  buyerUserId: string;
  requestId: string;
  amount: number;
  remark?: string;
};

@Injectable()
export class WelfareCardService {
  constructor(private readonly welfareCardRepository: WelfareCardRepository) {}

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
