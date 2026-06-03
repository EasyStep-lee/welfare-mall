import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { buildPaymentPayload, createPaymentRequestId, toPaymentDisplay } = require('./payment.js');

describe('user mini-program payment helpers', () => {
  const order = {
    orderNo: 'ORDER-20260603-001',
    totalAmount: 13980,
    welfareCardPayableAmount: 5000,
    cashPayableAmount: 8980
  };

  it('builds payment creation payload from an order snapshot', () => {
    expect(
      buildPaymentPayload({
        requestId: 'payment-request-001',
        order,
        channel: 'wechat'
      })
    ).toEqual({
      requestId: 'payment-request-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980
    });
  });

  it('creates stable local payment request IDs', () => {
    expect(createPaymentRequestId('ORDER 001', () => 1780470000000)).toBe('mini-payment-ORDER-001-1780470000000');
  });

  it('maps payment records to display labels', () => {
    expect(
      toPaymentDisplay({
        paymentNo: 'PAY-20260603-001',
        status: 'pending',
        channel: 'wechat'
      })
    ).toEqual({
      paymentNo: 'PAY-20260603-001',
      statusText: '待支付',
      channelText: '微信支付'
    });
  });
});
