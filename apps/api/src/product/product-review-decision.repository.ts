import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductReviewActions } from './product-review-action';
import type { ProductReviewAction } from './product-review-action';
import type { ProductStatus } from './product-status';
import { applyProductStatusTransition } from './product-status-transition';

export type ProductReviewDecisionAction = typeof ProductReviewActions.Approve | typeof ProductReviewActions.Reject;

export type DecideProductReviewInput = {
  productId: string;
  action: ProductReviewDecisionAction;
  actorUserId: string;
  reason: string | null;
};

export type ProductReviewDecisionLogSummary = {
  id: string;
  productId: string;
  actorUserId: string | null;
  actorType: 'admin';
  action: ProductReviewDecisionAction;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  createdAt: Date;
};

export type ProductReviewDecisionResult =
  | {
      allowed: true;
      productId: string;
      action: ProductReviewDecisionAction;
      fromStatus: string;
      toStatus: string;
      reviewLog: ProductReviewDecisionLogSummary;
    }
  | {
      allowed: false;
      productId: string;
      fromStatus: string;
      reason: string;
    };

@Injectable()
export class ProductReviewDecisionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async decide(input: DecideProductReviewInput): Promise<ProductReviewDecisionResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: input.productId },
        select: { id: true, status: true }
      });

      if (!product) {
        return null;
      }

      const transition = applyProductStatusTransition({
        actor: 'admin',
        currentStatus: product.status as ProductStatus,
        action: input.action as ProductReviewAction
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
          actorType: 'admin',
          action: input.action,
          fromStatus: product.status,
          toStatus: transition.nextStatus,
          reason: input.reason
        }
      });

      return {
        allowed: true,
        productId: product.id,
        action: input.action,
        fromStatus: product.status,
        toStatus: transition.nextStatus,
        reviewLog: {
          id: reviewLog.id,
          productId: reviewLog.productId,
          actorUserId: reviewLog.actorUserId,
          actorType: 'admin',
          action: input.action,
          fromStatus: reviewLog.fromStatus,
          toStatus: reviewLog.toStatus,
          reason: reviewLog.reason,
          createdAt: reviewLog.createdAt
        }
      };
    });
  }
}
