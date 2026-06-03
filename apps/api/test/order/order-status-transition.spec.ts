import { applyOrderStatusTransition } from '../../src/order/order-status-transition';

describe('applyOrderStatusTransition', () => {
  it('allows user to submit a draft order for payment', () => {
    const result = applyOrderStatusTransition({
      actor: 'user',
      currentStatus: 'draft',
      action: 'submit'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'pending_payment',
      requiresReason: false
    });
  });

  it('allows system payment callback to mark a pending order paid', () => {
    const result = applyOrderStatusTransition({
      actor: 'system',
      currentStatus: 'pending_payment',
      action: 'pay'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'paid',
      requiresReason: false
    });
  });

  it('allows user to cancel an unpaid order with a required reason', () => {
    const result = applyOrderStatusTransition({
      actor: 'user',
      currentStatus: 'pending_payment',
      action: 'cancel'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'cancelled',
      requiresReason: true
    });
  });

  it('denies user payment status mutation', () => {
    const result = applyOrderStatusTransition({
      actor: 'user',
      currentStatus: 'pending_payment',
      action: 'pay'
    });

    expect(result).toEqual({
      allowed: false,
      reason: 'action not allowed for current actor and status'
    });
  });

  it('allows system to move paid order into refund processing', () => {
    const result = applyOrderStatusTransition({
      actor: 'system',
      currentStatus: 'paid',
      action: 'refund_request'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'refund_processing',
      requiresReason: false
    });
  });

  it('allows system to mark a refund processing order refunded', () => {
    const result = applyOrderStatusTransition({
      actor: 'system',
      currentStatus: 'refund_processing',
      action: 'refund_succeed'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'refunded',
      requiresReason: false
    });
  });

  it('allows system to restore paid status after a failed refund', () => {
    const result = applyOrderStatusTransition({
      actor: 'system',
      currentStatus: 'refund_processing',
      action: 'refund_fail'
    });

    expect(result).toEqual({
      allowed: true,
      nextStatus: 'paid',
      requiresReason: false
    });
  });
});
