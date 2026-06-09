import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const {
  buildAmountPreviewPayload,
  buildCheckoutPayload,
  createCheckoutRequestId,
  toPreviewDisplay
} = require('./checkout.js');

describe('user mini-program checkout helpers', () => {
  it('builds an amount preview payload from detail checkout state', () => {
    expect(
      buildAmountPreviewPayload({
        itemId: 'pool-item-001',
        quantity: 2,
        welfareCardPaymentAmount: 5000
      })
    ).toEqual({
      items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
      welfareCardPaymentAmount: 5000
    });
  });

  it('builds a delivery checkout payload with a stable request id', () => {
    expect(
      buildCheckoutPayload({
        requestId: 'checkout-user-001',
        buyerUserId: 'local-user-001',
        itemId: 'pool-item-001',
        quantity: 2,
        welfareCardPaymentAmount: 5000,
        receiverName: 'Li Lei',
        receiverPhone: '13800000000',
        receiverAddress: 'Pudong Avenue 1'
      })
    ).toEqual({
      requestId: 'checkout-user-001',
      buyerUserId: 'local-user-001',
      items: [{ productPoolItemId: 'pool-item-001', quantity: 2 }],
      welfareCardPaymentAmount: 5000,
      fulfillment: {
        type: 'delivery',
        receiverName: 'Li Lei',
        receiverPhone: '13800000000',
        receiverAddress: 'Pudong Avenue 1'
      }
    });
  });

  it('creates encoded checkout request ids', () => {
    const now = () => 1780470000000;

    expect(createCheckoutRequestId('pool item 001', now)).toBe('mini-checkout-pool-item-001-1780470000000');
  });

  it('formats preview totals for display', () => {
    expect(
      toPreviewDisplay({
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980
      })
    ).toEqual({
      totalText: '¥139.80',
      welfareCardText: '¥50.00',
      onlineRemainderText: '¥89.80'
    });
  });
});
