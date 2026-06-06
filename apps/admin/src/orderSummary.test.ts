import { AdminOrder } from './api';
import { summarizeAdminOrders } from './orderSummary';

describe('admin order summary', () => {
  it('summarizes loaded order totals and fulfillment task counts', () => {
    const orders = [
      {
        totalAmount: 13980,
        welfareCardPayableAmount: 5000,
        cashPayableAmount: 8980,
        fulfillmentSummary: {
          totalTasks: 2,
          pendingTasks: 1,
          completedTasks: 1,
          taskNos: ['FT-001', 'FT-002']
        },
        lines: [
          { quantity: 2 },
          { quantity: 1 }
        ]
      },
      {
        totalAmount: 5000,
        welfareCardPayableAmount: 0,
        cashPayableAmount: 5000,
        fulfillmentSummary: {
          totalTasks: 1,
          pendingTasks: 0,
          completedTasks: 1,
          taskNos: ['FT-003']
        },
        lines: [{ quantity: 4 }]
      }
    ] as AdminOrder[];

    expect(summarizeAdminOrders(orders)).toEqual({
      orderCount: 2,
      lineQuantity: 7,
      totalAmount: 18980,
      welfareCardPayableAmount: 5000,
      cashPayableAmount: 13980,
      pendingFulfillmentTasks: 1,
      completedFulfillmentTasks: 2
    });
  });
});
