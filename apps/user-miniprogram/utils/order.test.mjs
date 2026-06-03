import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { toOrderDetailDisplay, toOrderSummaryDisplay } = require('./order.js');

const order = {
  orderNo: 'ORDER-20260603-001',
  status: 'pending_payment',
  totalAmount: 13980,
  welfareCardPayableAmount: 5000,
  cashPayableAmount: 8980,
  latestPayment: {
    paymentNo: 'PAY-20260603-001',
    status: 'pending',
    channel: 'wechat'
  },
  receiverName: 'Li Lei',
  receiverPhone: '13800000000',
  receiverAddress: 'Pudong Avenue 1',
  lines: [
    {
      displayName: 'Local Rice',
      displaySkuCode: 'SKU-RICE-5KG',
      quantity: 2,
      unitPriceAmount: 6990,
      lineTotalAmount: 13980
    }
  ]
};

describe('user mini-program order display helpers', () => {
  it('formats order summaries', () => {
    expect(toOrderSummaryDisplay(order)).toEqual({
      orderNo: 'ORDER-20260603-001',
      statusText: '待支付',
      firstLineName: 'Local Rice',
      lineCountText: '1 件商品',
      totalText: '¥139.80',
      paymentText: '微信支付 待支付'
    });
  });

  it('formats order details with line display data', () => {
    expect(toOrderDetailDisplay(order)).toMatchObject({
      orderNo: 'ORDER-20260603-001',
      statusText: '待支付',
      totalText: '¥139.80',
      welfareCardText: '¥50.00',
      cashText: '¥89.80',
      latestPaymentDisplay: {
        paymentNo: 'PAY-20260603-001',
        statusText: '待支付',
        channelText: '微信支付'
      },
      receiverText: 'Li Lei / 13800000000 / Pudong Avenue 1',
      lines: [
        {
          displayName: 'Local Rice',
          skuText: 'SKU-RICE-5KG',
          quantityText: 'x2',
          unitPriceText: '¥69.90',
          lineTotalText: '¥139.80'
        }
      ]
    });
  });
});
