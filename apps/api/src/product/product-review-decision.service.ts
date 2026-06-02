import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ProductReviewActions } from './product-review-action';
import type { ProductReviewDecisionAction, ProductReviewDecisionResult } from './product-review-decision.repository';
import { ProductReviewDecisionRepository } from './product-review-decision.repository';

export type DecideProductReviewRequest = {
  productId: string;
  action: ProductReviewDecisionAction;
  actorUserId: string;
  reason: string | null;
};

export type ProductReviewDecisionSummary = Extract<ProductReviewDecisionResult, { allowed: true }>;

@Injectable()
export class ProductReviewDecisionService {
  constructor(private readonly productReviewDecisionRepository: ProductReviewDecisionRepository) {}

  async decide(input: DecideProductReviewRequest): Promise<ProductReviewDecisionSummary> {
    if (input.action === ProductReviewActions.Reject && !input.reason?.trim()) {
      throw new BadRequestException('reason is required for reject.');
    }

    const result = await this.productReviewDecisionRepository.decide({
      ...input,
      reason: input.reason?.trim() || null
    });

    if (!result) {
      throw new NotFoundException(`Product ${input.productId} not found.`);
    }

    if (!result.allowed) {
      throw new BadRequestException({
        message: 'Product review decision is not allowed from current status.',
        productId: result.productId,
        fromStatus: result.fromStatus,
        reason: result.reason
      });
    }

    return result;
  }
}
