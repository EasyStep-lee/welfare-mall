import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductReviewActions } from './product-review-action';
import { applyProductStatusTransition } from './product-status-transition';
import type { ProductStatus } from './product-status';

export type SubmitProductForReviewInput = {
  productId: string;
  actorUserId: string;
};

export type ProductReviewLogSummary = {
  id: string;
  productId: string;
  actorUserId: string | null;
  actorType: 'merchant';
  action: 'submit_review';
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  createdAt: Date;
};

export type ProductReviewSubmissionResult =
  | {
      allowed: true;
      productId: string;
      action: 'submit_review';
      fromStatus: string;
      toStatus: string;
      reviewLog: ProductReviewLogSummary;
    }
  | {
      allowed: false;
      productId: string;
      fromStatus: string;
      reason: string;
    };

@Injectable()
export class ProductReviewSubmissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async submitForReview(input: SubmitProductForReviewInput): Promise<ProductReviewSubmissionResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: input.productId },
        select: { id: true, status: true }
      });

      if (!product) {
        return null;
      }

      const transition = applyProductStatusTransition({
        actor: 'merchant',
        currentStatus: product.status as ProductStatus,
        action: ProductReviewActions.SubmitReview
      });

      if (!transition.allowed) {
        return {
          allowed: false,
          productId: product.id,
          fromStatus: product.status,
          reason: transition.reason
        };
      }

      await tx.product.update({
        where: { id: product.id },
        data: { status: transition.nextStatus },
        select: { id: true }
      });
      const reviewLog = await tx.productReviewLog.create({
        data: {
          productId: product.id,
          actorUserId: input.actorUserId,
          actorType: 'merchant',
          action: ProductReviewActions.SubmitReview,
          fromStatus: product.status,
          toStatus: transition.nextStatus,
          reason: null
        }
      });

      return {
        allowed: true,
        productId: product.id,
        action: ProductReviewActions.SubmitReview,
        fromStatus: product.status,
        toStatus: transition.nextStatus,
        reviewLog: {
          id: reviewLog.id,
          productId: reviewLog.productId,
          actorUserId: reviewLog.actorUserId,
          actorType: 'merchant',
          action: ProductReviewActions.SubmitReview,
          fromStatus: reviewLog.fromStatus,
          toStatus: reviewLog.toStatus,
          reason: reviewLog.reason,
          createdAt: reviewLog.createdAt
        }
      };
    });
  }
}
