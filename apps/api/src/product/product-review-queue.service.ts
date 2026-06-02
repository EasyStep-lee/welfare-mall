import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ProductReviewQueueRepository,
  ProductReviewQueueResult,
  ProductReviewQueueStatus
} from './product-review-queue.repository';
import { ProductStatuses } from './product-status';

export type ProductReviewQueueListInput = {
  status?: string | null;
};

const reviewQueueStatuses: ProductReviewQueueStatus[] = [
  ProductStatuses.PendingReview,
  ProductStatuses.Approved,
  ProductStatuses.Rejected
];

@Injectable()
export class ProductReviewQueueService {
  constructor(private readonly productReviewQueueRepository: ProductReviewQueueRepository) {}

  async list(input: ProductReviewQueueListInput): Promise<ProductReviewQueueResult> {
    const status = normalizeStatus(input.status);
    return this.productReviewQueueRepository.list({ status });
  }
}

function normalizeStatus(value: string | null | undefined): ProductReviewQueueStatus {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return ProductStatuses.PendingReview;
  }

  const status = value.trim();
  if (!reviewQueueStatuses.includes(status as ProductReviewQueueStatus)) {
    throw new BadRequestException(`status must be one of: ${reviewQueueStatuses.join(', ')}.`);
  }

  return status as ProductReviewQueueStatus;
}
