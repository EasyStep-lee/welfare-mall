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
        channel: 'wechat',
        welfareCardAccountId: 'account-001'
      })
    ).toEqual({
      requestId: 'payment-request-001',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980,
      welfareCardAccountId: 'account-001'
    });
  });

  it('omits blank welfare-card account IDs from pure online payment payloads', () => {
    expect(
      buildPaymentPayload({
        requestId: 'payment-request-online-only',
        order: {
          ...order,
          welfareCardPayableAmount: 0,
          cashPayableAmount: 13980
        },
        channel: 'wechat',
        welfareCardAccountId: '   '
      })
    ).toEqual({
      requestId: 'payment-request-online-only',
      orderNo: 'ORDER-20260603-001',
      channel: 'wechat',
      totalAmount: 13980,
      welfareCardPayableAmount: 0,
      cashPayableAmount: 13980
    });
  });

  it('supports Alipay as an online payment channel', () => {
    expect(
      buildPaymentPayload({
        requestId: 'payment-request-002',
        order,
        channel: 'alipay'
      })
    ).toMatchObject({
      channel: 'alipay',
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 8980
    });
  });

  it('does not send offline cash as a payment channel', () => {
    expect(
      buildPaymentPayload({
        requestId: 'payment-request-cash',
        order,
        channel: 'cash'
      })
    ).toMatchObject({
      channel: 'wechat'
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

  it('does not map offline cash as a user payment channel', () => {
    expect(
      toPaymentDisplay({
        paymentNo: 'PAY-CASH-001',
        status: 'pending',
        channel: 'cash'
      })
    ).toMatchObject({
      channelText: '未知支付渠道'
    });
  });
});
