import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { buildRefundPayload, canRequestRefund, createRefundRequestId, toRefundDisplay } = require('./refund.js');

describe('user mini-program refund helpers', () => {
  const paidOrder = {
    orderNo: 'ORDER-20260603-001',
    status: 'paid',
    totalAmount: 13980,
    latestPayment: {
      paymentNo: 'PAY-20260603-001',
      status: 'paid',
      channel: 'wechat'
    }
  };

  it('allows refund requests only for paid orders with a paid latest payment', () => {
    expect(canRequestRefund(paidOrder)).toBe(true);
    expect(canRequestRefund({ ...paidOrder, status: 'pending_payment' })).toBe(false);
    expect(canRequestRefund({ ...paidOrder, latestPayment: { ...paidOrder.latestPayment, status: 'pending' } })).toBe(false);
    expect(canRequestRefund({ ...paidOrder, latestPayment: null })).toBe(false);
  });

  it('builds full after-sale refund payload from the paid order snapshot', () => {
    expect(
      buildRefundPayload({
        requestId: 'refund-request-001',
        order: paidOrder
      })
    ).toEqual({
      requestId: 'refund-request-001',
      paymentNo: 'PAY-20260603-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      refundAmount: 13980,
      reason: 'after_sale'
    });
  });

  it('creates stable local refund request IDs', () => {
    expect(createRefundRequestId('ORDER 001', () => 1780470000000)).toBe('mini-refund-ORDER-001-1780470000000');
  });

  it('maps refund records to display labels', () => {
    expect(
      toRefundDisplay({
        refundNo: 'REF-20260603-001',
        status: 'processing',
        channel: 'wechat',
        refundAmount: 13980
      })
    ).toEqual({
      refundNo: 'REF-20260603-001',
      statusText: '退款处理中',
      channelText: '微信支付',
      refundAmountText: '¥139.80'
    });
  });
});
