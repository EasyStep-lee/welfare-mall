import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ProductReviewSubmissionResult } from './product-review-submission.repository';
import { ProductReviewSubmissionRepository } from './product-review-submission.repository';

export type SubmitProductReviewInput = {
  productId: string;
  actorUserId: string;
};

export type ProductReviewSubmissionSummary = Extract<ProductReviewSubmissionResult, { allowed: true }>;

@Injectable()
export class ProductReviewSubmissionService {
  constructor(private readonly productReviewSubmissionRepository: ProductReviewSubmissionRepository) {}

  async submitForReview(input: SubmitProductReviewInput): Promise<ProductReviewSubmissionSummary> {
    const result = await this.productReviewSubmissionRepository.submitForReview(input);

    if (!result) {
      throw new NotFoundException(`Product ${input.productId} not found.`);
    }

    if (!result.allowed) {
      throw new BadRequestException({
        message: 'Product cannot be submitted for review from current status.',
        productId: result.productId,
        fromStatus: result.fromStatus,
        reason: result.reason
      });
    }

    return result;
  }
}
