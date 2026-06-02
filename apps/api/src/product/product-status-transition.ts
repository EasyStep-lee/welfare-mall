import { ProductReviewAction } from './product-review-action';
import { ProductStatus } from './product-status';

export type ProductReviewActor = 'merchant' | 'admin';

export type ProductStatusTransition = {
  actor: ProductReviewActor;
  fromStatus: ProductStatus;
  action: ProductReviewAction;
  toStatus: ProductStatus;
  requiresReason: boolean;
};

export const ProductStatusTransitionCatalog: ProductStatusTransition[] = [
  { actor: 'merchant', fromStatus: 'draft', action: 'save_draft', toStatus: 'draft', requiresReason: false },
  { actor: 'merchant', fromStatus: 'rejected', action: 'save_draft', toStatus: 'draft', requiresReason: false },
  { actor: 'merchant', fromStatus: 'draft', action: 'submit_review', toStatus: 'pending_review', requiresReason: false },
  { actor: 'merchant', fromStatus: 'rejected', action: 'submit_review', toStatus: 'pending_review', requiresReason: false },
  { actor: 'admin', fromStatus: 'pending_review', action: 'approve', toStatus: 'approved', requiresReason: false },
  { actor: 'admin', fromStatus: 'pending_review', action: 'reject', toStatus: 'rejected', requiresReason: true },
  { actor: 'admin', fromStatus: 'draft', action: 'archive', toStatus: 'archived', requiresReason: true },
  { actor: 'admin', fromStatus: 'rejected', action: 'archive', toStatus: 'archived', requiresReason: true },
  { actor: 'admin', fromStatus: 'approved', action: 'archive', toStatus: 'archived', requiresReason: true }
];

export type ProductStatusTransitionInput = {
  actor: ProductReviewActor;
  currentStatus: ProductStatus;
  action: ProductReviewAction;
};

export type ProductStatusTransitionResult =
  | {
      allowed: true;
      nextStatus: ProductStatus;
      requiresReason: boolean;
    }
  | {
      allowed: false;
      reason: string;
    };

export function applyProductStatusTransition(input: ProductStatusTransitionInput): ProductStatusTransitionResult {
  const transition = ProductStatusTransitionCatalog.find(
    (item) => item.actor === input.actor && item.fromStatus === input.currentStatus && item.action === input.action
  );

  if (!transition) {
    return {
      allowed: false,
      reason: 'action not allowed for current actor and status'
    };
  }

  return {
    allowed: true,
    nextStatus: transition.toStatus,
    requiresReason: transition.requiresReason
  };
}
