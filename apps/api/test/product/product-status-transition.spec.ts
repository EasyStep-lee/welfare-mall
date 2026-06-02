import { applyProductStatusTransition } from '../../src/product/product-status-transition';

describe('applyProductStatusTransition', () => {
  it('allows merchant to submit a draft product for review', () => {
    const result = applyProductStatusTransition({
      actor: 'merchant',
      currentStatus: 'draft',
      action: 'submit_review'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'pending_review',
      requiresReason: false
    });
  });

  it('allows admin to approve a pending product', () => {
    const result = applyProductStatusTransition({
      actor: 'admin',
      currentStatus: 'pending_review',
      action: 'approve'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'approved',
      requiresReason: false
    });
  });

  it('allows admin to reject a pending product with a required reason', () => {
    const result = applyProductStatusTransition({
      actor: 'admin',
      currentStatus: 'pending_review',
      action: 'reject'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'rejected',
      requiresReason: true
    });
  });

  it('denies merchant approval', () => {
    const result = applyProductStatusTransition({
      actor: 'merchant',
      currentStatus: 'pending_review',
      action: 'approve'
    });

    expect(result).toEqual({
      allowed: false,
      reason: 'action not allowed for current actor and status'
    });
  });
});
