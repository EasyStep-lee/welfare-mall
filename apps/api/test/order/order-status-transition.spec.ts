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
});
