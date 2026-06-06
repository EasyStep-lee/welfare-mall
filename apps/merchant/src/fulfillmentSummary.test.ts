import { MerchantFulfillmentOrder } from './api';
import { summarizeMerchantFulfillmentOrders } from './fulfillmentSummary';

describe('merchant fulfillment summary', () => {
  it('summarizes loaded fulfillment task totals and fulfillment types', () => {
    const orders = [
      {
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980,
        fulfillmentType: 'delivery',
        lines: [
          { quantity: 2 },
          { quantity: 1 }
        ]
      },
      {
        totalAmount: 6990,
        welfareCardPayableAmount: 0,
        cashPayableAmount: 6990,
        fulfillmentType: 'pickup',
        lines: [{ quantity: 1 }]
      }
    ] as MerchantFulfillmentOrder[];

    expect(summarizeMerchantFulfillmentOrders(orders)).toEqual({
      taskCount: 2,
      lineQuantity: 4,
      totalAmount: 20970,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 15970,
      deliveryTasks: 1,
      pickupTasks: 1
    });
  });
});
